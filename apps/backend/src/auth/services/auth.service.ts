import {
	Injectable,
	UnauthorizedException,
	Res,
	HttpException,
	HttpStatus,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@/users/user.service';
import { Socket } from 'socket.io';

import { User, NewUser } from '@/database/schema/Users';
import { FortyTwoUser } from '../interfaces';

import { generateSecret, verify } from '2fa-util';

@Injectable()
export class AuthService {
	private secrets: Map<number, string> = new Map(); // store secrets for OTP - nasty but works (better practice would be to make a 2fa service using TwoFactor from 2fa-util)

	constructor(
		private jwtService: JwtService,
		private config: ConfigService, // Add ConfigService
		private userService: UserService,
		// to add later otp service
	) {}

	async mockLogin(username: string): Promise<string> {
		let user = await this.userService.getUserByName(username);
		if (!user) {
			const newUserData: NewUser = {
				fortytwoId: Math.floor(Math.random() * 1000) + 1,
				username: username,
			};
			user = await this.userService.create(newUserData);
		}

		const token = this.generateToken(user, !user.otp);

		return token;
	}

	async login(userData: FortyTwoUser): Promise<string> {
		let user = await this.userService.getByFortyTwoIdForJWT(userData.id);
		if (!user) {
			// Map 42 data to NewUser type
			const newUserData: NewUser = {
				fortytwoId: userData.id,
				username: `user${userData.id}`,
			};
			user = await this.userService.create(newUserData);
		}

		// If the user has not set up OTP, generate a token without OTP. If
		const token = this.generateToken(user, !user.otp);
		return token;
	}

	// any should be replaced with user type (schema or interface)
	private generateToken(user: any, otpVerified = true): string {
		const payload = {
			sub: user,
			otp: otpVerified,
		};

		const options = otpVerified
			? {} // No expiration if OTP is verified or not needed
			: { expiresIn: '30s' }; // Short expiration if OTP verification is pending

		return this.jwtService.sign(payload, options);
	}

	async verify42Token(accessToken: string): Promise<number | false> {
		try {
			const response = await fetch('https://api.intra.42.fr/v2/me', {
				headers: {
					Authorization: accessToken,
				},
			});
			if (!response.ok) {
				return false;
			}
			const data = await response.json();
			return data.id; // Assuming the 42 API response contains an 'id' field
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (error) {
			return false; // Instead of throwing, return false for invalid tokens
		}
	}

	async validateNextAuthToken(fortytwoId: number) {
		try {
			let user = await this.userService.getByFortyTwoId(
				Number(fortytwoId),
			);

			// new user
			if (!user) {
				const newUserData: NewUser = {
					fortytwoId: Number(fortytwoId),
					username: `user${fortytwoId}`,
				};

				user = await this.userService.create(newUserData);
			}

			// todo make backend jwt token as access token to give to the frontend to use
			const payload = {
				sub: user,
				// otp,
			};
			const token = this.jwtService.sign(payload);

			return { user, token };
			// eslint-disable-next-line @typescript-eslint/no-unused-vars
		} catch (error) {
			throw new UnauthorizedException('Invalid token');
		}
	}

	async setCookie(@Res() res, token: string): Promise<void> {
		const cookieOptions = {
			httpOnly: true,
			secure: this.config.get('NODE_ENV') === 'production',
			sameSite:
				this.config.get('NODE_ENV') === 'production' ? 'strict' : 'lax',
			domain: this.config.get('API_URL'),
			maxAge: 24 * 60 * 60 * 1000,
		};

		res.cookie('token', token, cookieOptions);
	}

	verifyJWT(token: string): any {
		try {
			return this.jwtService.verify(token);
		} catch {
			return null;
		}
	}

	// method to get user from the jwt bearer token from the socket connection
	async getUserFromSocketPayload(client: Socket): Promise<User | null> {
		const authorization = client.handshake.auth.token;
		// console.warn('authorization', authorization);
		const token = authorization && authorization.split(' ')[1];
		// console.warn('token', token);
		if (!token) return null;

		const payload = this.verifyJWT(token);
		// console.warn('payload', payload);
		if (!payload) return null;

		const user = await this.userService
			.getById(payload.sub.id)
			.catch(() => null);
		if (!user) return null;
		return user;
	}

	async generateQR(userId: number): Promise<string> {
		const user = await this.userService.getById(userId);
		if (!user)
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		if (user.otp)
			throw new HttpException('Already setup', HttpStatus.FORBIDDEN);

		const output = await generateSecret(user.username, 'TransenDance');
		this.secrets.set(user.id, output.secret);
		return output.qrcode;
	}

	async verifyCode(
		userId: number,
		code: string,
		secret?: string | null,
	): Promise<void> {
		if (!secret) {
			const user = await this.userService.getById(userId);
			if (!user)
				throw new HttpException('User not found', HttpStatus.NOT_FOUND);
			secret = user.otp;
		}

		if (!secret)
			throw new HttpException('No secret found', HttpStatus.NOT_FOUND);

		const check = await verify(code, secret);
		if (!check)
			throw new HttpException('Invalid code', HttpStatus.FORBIDDEN);
	}

	// verify the 2fa first time save the secret to the user in the database then delete the secret from memory
	async saveSecret(userId: number, code: string): Promise<void> {
		const secret = this.secrets.get(Number(userId));
		await this.verifyCode(userId, code, secret);

		this.secrets.delete(userId);
		await this.userService.updateOTP(userId, secret);
	}

	async loginOTP(token: string, code: string): Promise<string> {
		const data = this.verifyJWT(token);
		if (!data)
			throw new HttpException('Invalid token', HttpStatus.FORBIDDEN);
		if (data.otp)
			throw new HttpException('Already connected', HttpStatus.CONFLICT);

		// Get user from database to access their OTP secret
		const user = await this.userService.getById(data.sub.id);
		if (user && !user.otp)
			throw new HttpException('2FA not enabled', HttpStatus.BAD_REQUEST);

		await this.verifyCode(data.sub.id, code);
		return this.generateToken(data.sub, true);
	}
}
