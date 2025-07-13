import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '@/users/user.module';
import { FortyTwoStrategy } from './strategies/42.strategy';
import { SessionService } from './services/session.service';

@Module({
	imports: [
		PassportModule,
		ConfigModule.forRoot(), // Add if not already in AppModule
		JwtModule.registerAsync({
			imports: [ConfigModule],
			useFactory: (config: ConfigService) => {
				return {
					secret: config.get('SECRET'),
					signOptions: {
						expiresIn: '30d',
					},
				};
			},
			inject: [ConfigService],
		}),
		UserModule,
	],
	controllers: [AuthController],
	providers: [AuthService, SessionService, JwtStrategy, FortyTwoStrategy],
	exports: [AuthService, SessionService],
})
export class AuthModule {}
