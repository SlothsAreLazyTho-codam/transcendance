import { Module, forwardRef } from '@nestjs/common';
import { UserIdController } from './controllers/id.controller';
import { UserMeController } from './controllers/me.controller';
import { UserService } from './user.service';
import { DrizzleModule } from '@/database/drizzle.module';
import { MatchesModule } from '@/matches/matches.module';

@Module({
	imports: [DrizzleModule, forwardRef(() => MatchesModule)],
	controllers: [UserMeController, UserIdController],
	providers: [UserService],
	exports: [UserService],
})
export class UserModule {}
