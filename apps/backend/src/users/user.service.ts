import { Injectable, Inject, HttpException, HttpStatus } from '@nestjs/common';
import { DrizzleAsyncProvider } from '@/database/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq } from 'drizzle-orm';

import {
	schema,
	Users,
	User,
	NewUser,
	BlockedUsers,
	FollowedUsers,
} from '@/database/schema';
import { UserStatusType } from '@/database/enums/users.status';
import { Avatar, Avatars } from '@/database/schema/Avatars';

// TODO: Possibly split into IPublicUserService (API endpoints) and IInternalUserService (service-to-service) interfaces

@Injectable()
export class UserService {
	constructor(
		@Inject(DrizzleAsyncProvider)
		private readonly db: NodePgDatabase<typeof schema>,
	) {}

	async getAllUsers(): Promise<User[]> {
		const users = (await this.db.query.Users.findMany()) as User[];

		return users;
	}

	// @public - public api method
	async getUserByName(name: string): Promise<User | null> {
		// // this promise return doesnt work?
		const user = await this.db.query.Users.findFirst({
			where: eq(Users.username, name),
			// with: {
			// 	avatar: true,
			// 	blockedUsers: true,
			// 	followedUsers: true,
			// },
		});

		return user ?? null;
	}

	async getById(id: number): Promise<User | null> {
		const user = await this.db.query.Users.findFirst({
			where: eq(Users.id, id),
			with: {
				avatar: true,
				blockedUsers: true,
				blockedBy: true,
				followedUsers: true,
				// directMessageChannels: true,
			},
		});

		return user ?? null;
	}

	// should promise the schema user type or null later import from database/schemas/User.ts
	// @internal - internal method
	async getByFortyTwoId(fortyTwoId: number): Promise<User | null> {
		const user = await this.db.query.Users.findFirst({
			where: eq(Users.fortytwoId, fortyTwoId),
			with: {
				avatar: true,
				blockedUsers: true,
				followedUsers: true,
			},
		});

		return user ?? null;
	}

	async getByFortyTwoIdForJWT(fortyTwoId: number): Promise<User | null> {
		const user = await this.db.query.Users.findFirst({
			where: eq(Users.fortytwoId, fortyTwoId),
		});

		return user ?? null;
	}

	async create(userData: NewUser): Promise<User> {
		// // Validate input using Zod schema
		// const parsed = UserSchemas.insert.parse(userData);

		// Insert the user and return the first result
		const [insertedUser] = await this.db
			.insert(Users)
			.values(userData)
			.returning();

		return insertedUser;
	}

	async update(id: number, userData: Partial<NewUser>): Promise<User> {
		if (!userData) {
			throw new HttpException(
				'No data provided for update',
				HttpStatus.BAD_REQUEST,
			);
		}

		const existingUser = await this.db
			.select()
			.from(Users)
			.where(eq(Users.id, id))
			.limit(1);

		if (!existingUser.length) {
			throw new HttpException('User not found', HttpStatus.NOT_FOUND);
		}

		const canBeUpdated = ['username'];

		for (const key of Object.keys(userData)) {
			if (!canBeUpdated.includes(key)) {
				throw new HttpException(
					`Field ${key} cannot be modified`,
					HttpStatus.FORBIDDEN,
				);
			}
		}

		if (userData.username) {
			userData.username = userData.username.replace(/\s+/g, '');
			if (!userData.username.length) {
				throw new HttpException(
					'Username cannot be empty',
					HttpStatus.FORBIDDEN,
				);
			}
		}

		try {
			const [updatedUser] = await this.db
				.update(Users)
				.set(userData)
				.where(eq(Users.id, id))
				.returning();

			return updatedUser;
		} catch (error) {
			throw new HttpException(
				`Failed to update user: ${error}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async setAvatar(userId: number, file: Express.Multer.File): Promise<void> {
		try {
			// Check if user exists
			const user = await this.getById(userId);
			if (!user) {
				throw new HttpException(
					`User with id ${userId} not found`,
					HttpStatus.NOT_FOUND,
				);
			}

			// Delete existing avatar if any
			await this.db
				.delete(Avatars)
				.where(eq(Avatars.userId, userId))
				.execute();

			// Insert new avatar
			await this.db.insert(Avatars).values({
				userId,
				filename: file.originalname,
				data: file.buffer,
				mimeType: file.mimetype,
			});
		} catch (error) {
			throw new HttpException(
				`Failed to update avatar: ${error}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async getAvatar(userId: number): Promise<Avatar> {
		const user = await this.db.query.Users.findFirst({
			where: eq(Users.id, userId),
			with: { avatar: true },
		});
		if (!user?.avatar)
			throw new HttpException(
				'User and/or avatar not found',
				HttpStatus.NOT_FOUND,
			);

		// Handle binary data conversion
		if (typeof user.avatar.data === 'string') {
			// Remove PostgreSQL bytea format prefix and decode
			const cleanHex = (user.avatar.data as string).replace(/^\\x/, '');
			user.avatar.data = Buffer.from(cleanHex, 'hex');
		}

		return user.avatar;
	}

	async deleteAvatar(userId: number): Promise<void> {
		try {
			const result = await this.db
				.delete(Avatars)
				.where(eq(Avatars.userId, userId))
				.execute();

			if (result.rowCount === 0) {
				throw new HttpException(
					'Avatar not found',
					HttpStatus.NOT_FOUND,
				);
			}
		} catch (error) {
			throw new HttpException(
				`Failed to delete avatar: ${error}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	// possible create match or some method if not handled in other service.
	// async getMatches(userId: number): Promise<Type and Table to be defined later>
	// gets user obj with wonMatches, LostMatches relation attached or return only the matches

	async toggleBlock(
		userId: number,
		blockedUserId: number,
		reason?: string,
	): Promise<number[]> {
		const existingBlock = await this.db.query.BlockedUsers.findFirst({
			where: and(
				eq(BlockedUsers.userId, userId),
				eq(BlockedUsers.blockedId, blockedUserId),
			),
		});

		if (existingBlock) {
			// Unblock the user
			await this.db
				.delete(BlockedUsers)
				.where(
					and(
						eq(BlockedUsers.userId, userId),
						eq(BlockedUsers.blockedId, blockedUserId),
					),
				)
				.execute();
		} else {
			// Block the user
			await this.db.insert(BlockedUsers).values({
				userId: userId,
				blockedId: blockedUserId,
				reason: reason,
			});
		}
		const userblocks = await this.db.query.BlockedUsers.findMany({
			where: eq(BlockedUsers.userId, userId),
		});

		return userblocks.map((block) => block.blockedId);
	}

	async toggleFollow(
		userId: number,
		followedUserId: number,
	): Promise<number[]> {
		const existingFollow = await this.db.query.FollowedUsers.findFirst({
			where: and(
				eq(FollowedUsers.userId, userId),
				eq(FollowedUsers.followingId, followedUserId),
			),
		});

		if (existingFollow) {
			// Unfollow the user
			await this.db
				.delete(FollowedUsers)
				.where(
					and(
						eq(FollowedUsers.userId, userId),
						eq(FollowedUsers.followingId, followedUserId),
					),
				)
				.execute();
		} else {
			// Follow the user
			await this.db.insert(FollowedUsers).values({
				userId: userId,
				followingId: followedUserId,
			});
		}

		const userfollows = await this.db.query.FollowedUsers.findMany({
			where: eq(FollowedUsers.userId, userId),
		});

		return userfollows.map((follow) => follow.followingId);
	}

	async setStatus(id: number, status: UserStatusType): Promise<void> {
		const existingUser = await this.db.query.Users.findFirst({
			where: and(eq(Users.id, id), eq(Users.status, status)),
		});

		// Check if the user already has the status
		if (existingUser) {
			return;
		}

		try {
			await this.db
				.update(Users)
				.set({ status })
				.where(eq(Users.id, id))
				.execute();

			// this.statusService.emitStatus(id, status);
		} catch (error) {
			throw new HttpException(
				`Failed to update user status: ${error}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async updateOTP(userId: number, secret?: string): Promise<void> {
		try {
			const user = await this.getById(userId);
			if (!user) {
				throw new HttpException(
					`User with id ${userId} not found`,
					HttpStatus.NOT_FOUND,
				);
			}

			console.log('User enabled 2FA!');

			await this.db
				.update(Users)
				.set({ otp: secret ?? null })
				.where(eq(Users.id, userId))
				.execute();
		} catch (error) {
			throw new HttpException(
				`Failed to update user OTP: ${error}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}
}
