import {
	Body,
	Controller,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Req,
} from '@nestjs/common';
import {
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
	ApiTags,
} from '@nestjs/swagger';
import { TextChannel } from '../interfaces/textChannel.interface';
import { ChannelService } from '../services/channel.service';
import { ChangeChannelPassword } from '../interfaces/changePassword.interface';

@ApiTags('channel')
@Controller('channel')
@ApiBearerAuth()
export class ChatController {
	constructor(private readonly textChannelService: ChannelService) {}

	@ApiOperation({ summary: 'Get all channels' })
	@ApiResponse({
		status: 200,
		description:
			'Returns all text channels, excluding passwords, only for display',
		// type: [TextChannel], // TODO check why this cant use interface.
	})
	@Get('/')
	getAllChannels(): Promise<TextChannel[]> {
		return this.textChannelService.getAllChannels();
	}

	// TODO: check if this should take user object or just id
	@ApiOperation({ summary: 'create a channel' })
	@ApiResponse({
		status: 200,
		description: 'Returns the created channel',
		type: [TextChannel],
	})
	@ApiResponse({
		status: 403,
		description: 'returns if an error occurs with description',
	})
	@ApiResponse({
		status: 409,
		description: 'Channel already exists',
	})
	@ApiResponse({
		status: 500,
		description: 'Internal Server Error',
	})
	@Post('/')
	createChannel(
		@Req() req: any,
		@Body() channel: TextChannel,
	): Promise<TextChannel> {
		console.log(
			'[ChatController] createChannel called with channel:',
			channel,
		);
		return this.textChannelService.createChannel(req.user.id, channel);
	}

	// TODO: check if this should take user object or just id
	@ApiOperation({ summary: 'Update channel password' })
	@ApiResponse({
		status: 200,
		description: 'Returns the updated channel',
		type: TextChannel,
	})
	@ApiResponse({
		status: 400,
		description: 'Bad request missing data',
	})
	@ApiResponse({
		status: 401,
		description: 'Unauthorized: wrong password',
	})
	@ApiResponse({
		status: 403,
		description: 'returns if an error occurs with description',
	})
	@ApiResponse({
		status: 404,
		description: 'Channel not found',
	})
	@ApiResponse({
		status: 500,
		description: 'Internal Server Error',
	})
	@Post(':id/change/')
	changePass(
		@Req() req: any,
		@Param('id', ParseIntPipe) id: number,
		@Body() pass: ChangeChannelPassword,
	): Promise<void> {
		return this.textChannelService.changePassword(req.user.id, id, pass);
	}
}
