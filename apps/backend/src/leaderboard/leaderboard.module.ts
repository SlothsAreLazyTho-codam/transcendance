import { Module } from '@nestjs/common';
import { LeaderboardController } from './leaderboard.controller';
import { UserModule } from '@/users/user.module';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
	imports: [UserModule, DrizzleModule],
	controllers: [LeaderboardController],
	// No providers array needed since we're not providing any services specific to this module
})
export class LeaderboardModule {}
