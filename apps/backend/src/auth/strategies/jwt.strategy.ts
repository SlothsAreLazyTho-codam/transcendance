import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserService } from '@/users/user.service';

// todo use config service
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
	constructor(
		private config: ConfigService,
		private userService: UserService,
	) {
		const secret = config.get<string>('SECRET');
		if (!secret) {
			throw new Error('JWT_SECRET must be defined');
		}
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: secret,
		});
	}

	// async validate(payload: any) {
	// 	const fortytwoId = payload.providerAccountId || payload.sub;
	// 	const user = await this.userService.getByFortyTwoId(Number(fortytwoId));

	// 	if (!user) {
	// 		throw new UnauthorizedException('User not found');
	// 	}

	// 	// If OTP is enabled but not verified in token, deny access
	// 	// if (user.otpEnabled && !payload.otpVerified) {
	// 	// 	throw new UnauthorizedException('OTP verification required');
	// 	// }

	// 	return user;
	// }

	async validate(payload: any) {
		if (!payload.sub) {
			throw new UnauthorizedException('Invalid token payload');
		}

		const userId = payload.sub.id;
		const user = await this.userService.getById(userId);

		if (!user) {
			throw new UnauthorizedException({
				message: 'User not found',
				service: 'JWT Authentication Strategy',
				context: 'Authentication',
				timestamp: new Date().toISOString(),
			});
		}

		return user;
	}
}
