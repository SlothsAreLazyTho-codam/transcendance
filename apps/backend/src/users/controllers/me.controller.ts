import {
	Controller,
	Get,
	Param,
	StreamableFile,
	Req,
	Body,
	Put,
	UploadedFile,
	UseInterceptors,
	NotFoundException,
	UnauthorizedException,
} from '@nestjs/common';
import { UserService } from '@/users/user.service';
import {
	ApiTags,
	ApiBearerAuth,
	ApiOperation,
	ApiResponse,
} from '@nestjs/swagger';
import { Match, NewUser, User } from '@/database/schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { MatchesService } from '@/matches/matches.service';

@ApiTags('Users')
@Controller('users')
@ApiBearerAuth()
export class UserMeController {
	constructor(
		private readonly userService: UserService,
		private readonly matchService: MatchesService,
	) {}
	//#region me

	@ApiOperation({ summary: 'Get current user' })
	@ApiResponse({ status: 200, description: 'Returns the current user' })
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'User not found' })
	@Get('/me')
	async getUser(@Req() req: any): Promise<any> {
		// console.log(JSON.stringify(req, getCircularReplacer()));
		// return JSON.stringify(req, getCircularReplacer());
		// // Add this helper function
		// function getCircularReplacer() {
		// 	const seen = new WeakSet();
		// 	return (key: any, value: any) => {
		// 		if (typeof value === 'object' && value !== null) {
		// 			if (seen.has(value)) {
		// 				return '[Circular]';
		// 			}
		// 			seen.add(value);
		// 		}
		// 		return value;
		// 	};
		// }
		if (!req.user) {
			throw new UnauthorizedException(`Unauthorized`);
		}

		const user = await this.userService.getById(req.user.id);
		if (!user) {
			throw new NotFoundException(`User not found`);
		}
		return user;
	}

	@ApiOperation({ summary: 'Get current user avatar' })
	@ApiResponse({
		status: 200,
		description: 'Returns the current user avatar',
		type: StreamableFile,
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 404, description: 'Avatar not found' })
	@Get('/me/avatar')
	async getAvatar(@Req() req: any): Promise<StreamableFile> {
		if (!req.user) {
			throw new UnauthorizedException(`Unauthorized`);
		}
		const avatar = await this.userService.getAvatar(req.user.id);

		// Ensure we're working with a Buffer
		const imageBuffer = Buffer.isBuffer(avatar.data)
			? avatar.data
			: Buffer.from(avatar.data, 'binary');

		return new StreamableFile(imageBuffer, {
			disposition: 'inline',
			type: avatar.mimeType,
		});
	}

	@ApiOperation({ summary: 'Get current user matches' })
	@ApiResponse({
		status: 200,
		description: 'Returns the current user matches',
		type: Object, // Using Object as a temporary solution, swagger can't take type as input needs to be a class
		isArray: true,
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@Get('/me/matches')
	async getMatches(@Req() req: any): Promise<Match[]> {
		if (!req.user) {
			throw new UnauthorizedException(`Unauthorized`);
		}
		const matches = await this.matchService.getByUserId(req.user.id);
		return matches;
	}

	@ApiOperation({ summary: 'Update current user' })
	@ApiResponse({
		status: 200,
		type: Object,
		description: 'User updated successfully',
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 403, description: 'Forbidden' })
	@ApiResponse({ status: 404, description: 'User not found' })
	@ApiResponse({ status: 500, description: 'Internal Server Error' })
	@Put('/me')
	async updateUser(@Req() req: any, @Body() user: NewUser): Promise<User> {
		if (!req.user) {
			throw new UnauthorizedException(`Unauthorized`);
		}
		return await this.userService.update(req.user.id, user);
	}

	@ApiOperation({ summary: 'Update current user avatar' })
	@ApiResponse({
		status: 200,
		description: 'Avatar updated successfully',
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 500, description: 'Internal Server Error' })
	@Put('me/avatar')
	@UseInterceptors(FileInterceptor('file'))
	async updateAvatar(
		@Req() req: any,
		@UploadedFile() file: Express.Multer.File,
	): Promise<void> {
		if (!req.user) {
			throw new UnauthorizedException(`Unauthorized`);
		}
		return await this.userService.setAvatar(req.user.id, file);
	}

	@ApiOperation({ summary: 'follow/unfollow user' })
	@ApiResponse({
		status: 200,
		description: 'Returns the list of followed users',
		type: Object,
		isArray: true,
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 500, description: 'Internal Server Error' })
	@Put('/me/follow/:id')
	async toggleUserFollowed(
		@Req() req: any,
		@Param('id') id: number,
	): Promise<number[]> {
		if (!req.user) {
			throw new UnauthorizedException(`Unauthorized`);
		}
		return await this.userService.toggleFollow(req.user.id, +id);
	}

	@ApiOperation({ summary: 'block/unblock user' })
	@ApiResponse({
		status: 200,
		description: 'Returns the list of blocked users',
		type: Object,
		isArray: true,
	})
	@ApiResponse({ status: 401, description: 'Unauthorized' })
	@ApiResponse({ status: 500, description: 'Internal Server Error' })
	@Put('/me/block/:id')
	async toggleUserBlocked(
		@Req() req: any,
		@Param('id') id: number,
	): Promise<number[]> {
		if (!req.user) {
			throw new UnauthorizedException(`Unauthorized`);
		}
		return await this.userService.toggleBlock(req.user.id, id);
	}

	//#endregion
}
