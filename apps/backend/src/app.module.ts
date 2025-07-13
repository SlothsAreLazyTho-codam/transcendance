import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './auth/guards/jwt.guard';

import { AuthModule } from './auth/auth.module';
import { DrizzleModule } from './database/drizzle.module';
import { UserModule } from './users/user.module';

import { AppService } from './app.service';

import { AppController } from './app.controller';
import { ChatModule } from './chat/chat.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { MatchesModule } from './matches/matches.module';
import { GameserverModule } from './gameserver/gameserver.module';

@Module({
	imports: [
		DrizzleModule,
		ConfigModule.forRoot({
			isGlobal: true,
		}),
		AuthModule,
		UserModule,
		ChatModule,
		LeaderboardModule,
		MatchesModule,
		GameserverModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_GUARD,
			useClass: JwtAuthGuard,
		},
	],
})
export class AppModule {}
