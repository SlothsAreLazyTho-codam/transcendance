import {
	Controller,
	Post,
	Body,
	Get,
	Req,
	HttpException,
	HttpStatus,
	Headers,
	UseGuards,
	Res,
	UnauthorizedException,
	BadRequestException,
	Delete,
} from '@nestjs/common';
import { AuthService } from './services/auth.service';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiBearerAuth,
	ApiBody,
} from '@nestjs/swagger';
import { Public } from './decorators/public.decorator';

import { ConfigService } from '@nestjs/config';
import { UserService } from '@/users/user.service';
import { FortyTwoAuthGuard } from './guards/42.guard';
import { FortyTwoUser } from './interfaces';
import { SessionService } from './services/session.service';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
	constructor(
		private readonly authService: AuthService,
		private readonly sessionService: SessionService,
		private readonly config: ConfigService,
		private readonly userService: UserService,
	) {}

	@Public()
	@Post('mock-login')
	@ApiOperation({
		summary:
			'Mock login for testing, if user does not exsist it will create one with a random 42 id between 1 and 1000 (low 42 id value as actual 42ids are in the tens of thousands)',
	})
	@ApiResponse({ status: 200, description: 'Successful login' })
	@ApiResponse({ status: 400, description: 'Bad Request' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				username: {
					type: 'string',
					description: 'The username of the user',
					example: 'john_doe',
				},
			},
			required: ['username'],
		},
	})
	async mockUserLogin(
		@Body('username') username: string,
		@Res({ passthrough: true }) res: any,
	) {
		if (!username) {
			throw new BadRequestException('Username is required');
		}

		try {
			const token = await this.authService.mockLogin(username);

			await this.authService.setCookie(res, token);

			const user = await this.userService.getUserByName(username);

			if (user && user.otp) {
				res.redirect(`/login/2fa`);
				return;
			}
			res.redirect(`/`);
		} catch (error) {
			if (error instanceof UnauthorizedException) {
				// This exception is thrown by authService.mockLogin if the user is not found
				throw new UnauthorizedException(
					'Mock login failed: Invalid user',
				);
			}
		}
	}

	@Public()
	@UseGuards(FortyTwoAuthGuard)
	@Get('42/callback')
	@ApiOperation({ summary: 'Handle 42 OAuth callback' })
	@ApiResponse({ status: 302, description: 'Redirect with auth token' })
	async login(@Req() req: any, @Res() res: any) {
		const token = await this.authService.login(req.user as FortyTwoUser);

		// set bearer token in cookie
		this.authService.setCookie(req.res, token);

		const user = await this.userService.getByFortyTwoIdForJWT(req.user.id);
		if (user && user.otp) {
			res.redirect(`/login/2fa`);
			return;
		}
		res.redirect(`/`);
	}

	// @Public()
	// @Get('session')
	// async getSession(@Headers('session_id') sessionId) {
	// 	const token = await this.sessionService.getSessionString(sessionId);
	// 	if (!token) {
	// 		throw new UnauthorizedException('Invalid session');
	// 	}
	// 	return { token };
	// }

	@ApiBearerAuth()
	@Post('logout')
	async logout(@Headers('session_id') session: string) {
		const success = await this.sessionService.removeSession(session);
		if (!success) {
			throw new UnauthorizedException('Invalid session');
		}
		return { message: 'Logged out successfully' };
	}

	// @Public()
	// @Get('jwt')
	// jwt(@Req() req: any): boolean {
	// 	console.log(req);
	// 	if (!req.headers.authorization) return false;
	// 	const token = req.headers.authorization.split(' ')[1];
	// 	const payload = this.authService.verifyJWT(token);
	// 	return !!payload;
	// }

	@Public()
	@Post('otp')
	async loginOTP(
		@Body('token') token: string,
		@Body('code') code: string,
		@Res({ passthrough: true }) res: any,
	): Promise<{ success: boolean; redirect?: string }> {
		try {
			const verifiedToken = await this.authService.loginOTP(token, code);

			this.authService.setCookie(res, verifiedToken);

			return { success: true, redirect: '/' };
		} catch (error) {
			void error;
			return { success: false };
		}
	}

	// check either take user obj or id only..
	@Get('2fa/qrcode')
	@ApiBearerAuth()
	async get2FA(@Req() req: any): Promise<string> {
		return this.authService.generateQR(req.user.id);
	}

	// check either take user obj or id only..
	// returns true or false !!user.otp either empty then false or !!user.otp is not empty then true
	// checks if user has 2fa enabled
	@ApiBearerAuth()
	@Get('2fa/me')
	async get2FAofUser(@Req() req: any): Promise<boolean> {
		const user = await this.userService.getById(req.user.id);
		if (!user)
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		return !!user.otp;
	}

	// check either take user obj or id only..
	@ApiBearerAuth()
	@ApiBody({
		schema: {
			type: 'object',
			properties: {
				code: {
					type: 'string',
					description: 'The 2FA code provided by the user',
					example: '123456',
				},
			},
			required: ['code'],
		},
	})
	@Post('2fa')
	create2FA(@Req() req: any, @Body('code') code: string): Promise<void> {
		return this.authService.saveSecret(req.user.id, code);
	}

	@ApiBearerAuth()
	@Delete('2fa')
	delete2FA(@Req() req: any): Promise<void> {
		return this.userService.updateOTP(req.user.id);
	}

	@ApiBearerAuth()
	@Get('me')
	async getProfile(@Req() req: any) {
		// the guard will fetch the user from the token
		return req.user;
	}
}
