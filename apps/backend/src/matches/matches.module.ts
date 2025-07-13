import { Module } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { DrizzleModule } from '@/database/drizzle.module';

@Module({
	imports: [DrizzleModule],
	controllers: [MatchesController],
	providers: [MatchesService],
	exports: [MatchesService],
})
export class MatchesModule {}
