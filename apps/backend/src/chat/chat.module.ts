import { AuthModule } from '@/auth/auth.module';
import { ChatGateway } from './chat.gateway';
import { Module } from '@nestjs/common';
import { DrizzleModule } from '@/database/drizzle.module';
import { ChannelService } from './services/channel.service';
import { DirectMessageService } from './services/dm.service';
import { UserModule } from '@/users/user.module';
import { ChatController } from './controllers/chat.controller';

@Module({
	imports: [AuthModule, DrizzleModule, UserModule],
	providers: [ChatGateway, ChannelService, DirectMessageService],
	controllers: [ChatController],
})
export class ChatModule {}
