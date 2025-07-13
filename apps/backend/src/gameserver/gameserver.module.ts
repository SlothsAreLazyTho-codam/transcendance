import { Module } from '@nestjs/common';
import { GameserverGateway } from './gameserver.gateway';
import { AuthModule } from '@/auth/auth.module';

@Module({
	imports: [AuthModule],
	providers: [GameserverGateway],
})
export class GameserverModule {}
