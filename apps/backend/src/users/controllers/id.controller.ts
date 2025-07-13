import {
	Controller,
	Get,
	Param,
	Query,
	NotImplementedException,
	NotFoundException,
	ParseIntPipe,
	BadRequestException,
	StreamableFile,
	Header,
} from '@nestjs/common';
import { UserService } from '@/users/user.service';
import {
	ApiTags,
	ApiOperation,
	ApiResponse,
	ApiParam,
	ApiQuery,
	ApiBearerAuth,
} from '@nestjs/swagger';
import { MatchesService } from '@/matches/matches.service';
import { Match } from '@/database/schema';

@ApiTags('Users')
@Controller('users')
export class UserIdController {
	constructor(
		private readonly userService: UserService,
		private readonly matchService: MatchesService,
	) {}

	//#region id
	// Get all users
	@ApiOperation({ summary: 'Get all users' })
	@ApiResponse({ status: 200, description: 'Returns all users' })
	@ApiResponse({ status: 501, description: 'Not Implemented' })
	@ApiBearerAuth()
	@Get('/')
	async getAllUsers() {
		// return await this.userService.getAllUsers();
		throw new NotImplementedException();
	}

	// Search users by name
	@ApiOperation({ summary: 'Search users by name' })
	@ApiQuery({
		name: 'name',
		type: 'string',
		description: 'User name to search for',
	})
	@ApiResponse({
		status: 200,
		description: 'Returns users matching the search',
	})
	@ApiBearerAuth()
	@Get('search')
	async searchUsers(@Query('name') name: string) {
		return await this.userService.getUserByName(name);
	}

	// Get user by ID
	@ApiOperation({ summary: 'Get user by ID' })
	@ApiParam({ name: 'id', type: 'number', description: 'User ID' })
	@ApiResponse({ status: 200, description: 'Returns a user by ID' })
	@ApiBearerAuth()
	@Get('/:id')
	async getUserById(@Param('id', ParseIntPipe) id: number) {
		if (isNaN(id)) {
			throw new BadRequestException('Invalid ID');
		}

		const user = await this.userService.getById(id);
		if (!user) {
			throw new NotFoundException(`User with ID ${id} not found`);
		}
		return user;
	}

	@ApiBearerAuth()
	@Get('/:id/avatar')
	@Header('Content-Type', 'image/*')
	async getAvatar(
		@Param('id', ParseIntPipe) id: number,
	): Promise<StreamableFile> {
		const avatar = await this.userService.getAvatar(id);
		if (!avatar) {
			throw new NotFoundException(`Avatar not found for user ID ${id}`);
		}
		const imageBuffer = Buffer.isBuffer(avatar.data)
			? avatar.data
			: Buffer.from(avatar.data, 'binary');

		return new StreamableFile(imageBuffer, {
			disposition: `inline; filename="${avatar.filename}"`,
			type: avatar.mimeType,
		});
	}

	@ApiOperation({ summary: 'Get matches by user ID' })
	@ApiResponse({
		status: 200,
		description: 'Returns all matches for a specific user',
		type: Object,
		isArray: true,
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@Get('/:id/matches')
	async findMatchesByUserId(
		@Param('id', ParseIntPipe) userId: number,
	): Promise<Match[]> {
		return await this.matchService.getByUserId(userId);
	}

	//#endregion
}
