import { Injectable, HttpStatus, HttpException, Inject } from '@nestjs/common';
import { DrizzleAsyncProvider } from '@/database/drizzle.provider';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, ilike } from 'drizzle-orm';
import { schema } from '@/database/schema';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');

// interface imports
import { TextChannel } from '../interfaces/textChannel.interface';
import { ChangeChannelPassword } from '../interfaces/changePassword.interface';
import { ChannelMessage } from '@/database/schema';

@Injectable()
export class ChannelService {
	constructor(
		@Inject(DrizzleAsyncProvider)
		private readonly db: NodePgDatabase<typeof schema>,
	) {}

	// relations to include in channel queries
	private getChannelRelations() {
		const relations = {
			members: {
				with: {
					user: true,
					mutedStatus: true,
					bannedStatus: true,
				},
			},
			bannedMembers: {
				with: {
					user: true,
				},
			},
			mutedMembers: {
				with: {
					user: true,
				},
			},
			messages: {
				with: {
					sender: true,
				},
			},
		} as const;

		return relations;
	}

	async getChannel(id: number, returnPass?: boolean): Promise<TextChannel> {
		if (!id) {
			throw new HttpException(
				'Channel ID not provided',
				HttpStatus.BAD_REQUEST,
			);
		}

		const channel = await this.db.query.Channels.findFirst({
			where: (channels) => eq(channels.id, id),
			with: this.getChannelRelations(),
		});

		// if returnPass is not provided, or false, password will not be returned
		if (channel && !returnPass) {
			channel.password = null;
		}

		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		return channel;
	}

	async getAllChannels(): Promise<TextChannel[]> {
		const channels = await this.db.query.Channels.findMany({
			with: this.getChannelRelations(),
		});

		// Remove password from return object
		// todo - possibly set to undefined and map a bool to return protection status
		channels.forEach((channel) => {
			channel.password = null;
		});

		return channels;
	}

	async getChannelsForUser(userId: number): Promise<TextChannel[]> {
		const channels = await this.db.query.Channels.findMany({
			where: (channels, { exists }) =>
				exists(
					this.db
						.select()
						.from(schema.ChannelMembers)
						.where(
							and(
								eq(
									schema.ChannelMembers.channelId,
									channels.id,
								),
								eq(schema.ChannelMembers.userId, userId),
							),
						),
				),
			with: this.getChannelRelations(),
		});
		// Remove password from return object
		// todo - possibly set to undefined and map a bool to return protection status
		channels.forEach((channel) => {
			channel.password = null;
		});

		return channels;
	}

	async createChannel(
		userId: number,
		channel: TextChannel,
	): Promise<TextChannel> {
		// strip whitespace from channel name
		if (channel.name == undefined) {
			throw new HttpException(
				'Channel name must be provided.',
				HttpStatus.FORBIDDEN,
			);
		}

		channel.name = channel.name.replace(/\s+/g, '');

		let hashedPassword: string | null = null;
		if (channel.type === 'PRIVATE') {
			if (!channel.password) {
				throw new HttpException(
					'Password required for private channel.',
					HttpStatus.FORBIDDEN,
				);
			}

			if (channel.password.length < 3 || channel.password.length > 16) {
				throw new HttpException(
					'Password must be at least 3 characters and no more than 16 characters.',
					HttpStatus.FORBIDDEN,
				);
			}

			try {
				hashedPassword = bcrypt.hashSync(channel.password, 10);
			} catch (err) {
				throw new HttpException(
					`Error hashing password: ${err}`,
					HttpStatus.INTERNAL_SERVER_ERROR,
				);
			}
		}
		// check if channel with name already exists (not constrained by db) - case insensitive
		const existingChannel = await this.db.query.Channels.findFirst({
			where: (channels) => ilike(channels.name, channel.name),
		});

		if (existingChannel) {
			throw new HttpException(
				'Channel with that name already exists.',
				HttpStatus.CONFLICT,
			);
		}

		//TODO: possibly add Zod schema validation here

		// if all checks pass, create channel
		try {
			// Start a transaction to ensure both operations succeed or fail together
			const result = await this.db.transaction(async (tx) => {
				// Create the channel first
				const [createdChannel] = await tx
					.insert(schema.Channels)
					.values({
						name: channel.name,
						type: channel.type,
						password: hashedPassword,
						ownerId: userId,
					})
					.returning();

				// Add the owner as an admin member
				await tx.insert(schema.ChannelMembers).values({
					userId: userId,
					channelId: createdChannel.id,
					isAdmin: true,
				});

				// TODO: test if channelwithmembers works as expected
				// if (createdChannel.password) {
				// 	createdChannel.password = null;
				// }
				// return createdChannel;

				// Query the channel with its members
				const channelWithMembers = await tx.query.Channels.findFirst({
					where: (channels) => eq(channels.id, createdChannel.id),
					with: {
						members: {
							with: {
								user: true, // Include user details if needed
							},
						},
					},
				});

				if (channelWithMembers?.password) {
					channelWithMembers.password = null;
				}

				return channelWithMembers;
			});

			if (!result) {
				throw new HttpException(
					'Failed to create channel',
					HttpStatus.INTERNAL_SERVER_ERROR,
				);
			}
			return result;
		} catch (err) {
			throw new HttpException(
				`Error creating channel: ${err}`,
				HttpStatus.INTERNAL_SERVER_ERROR,
			);
		}
	}

	async deleteChannel(userId: number, channelId: number): Promise<void> {
		if (!channelId) {
			throw new HttpException(
				'Channel ID not provided',
				HttpStatus.BAD_REQUEST,
			);
		}

		const channel = await this.db.query.Channels.findFirst({
			where: (channels) => eq(channels.id, channelId),
		});

		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		if (channel.ownerId !== userId) {
			throw new HttpException(
				'User is not the owner of this channel',
				HttpStatus.FORBIDDEN,
			);
		}

		await this.db
			.delete(schema.Channels)
			.where(eq(schema.Channels.id, channel.id));
	}

	async removeUserFromChannel(
		adminId: number,
		channelId: number,
		userToRemoveId,
	): Promise<void> {
		const channel = await this.db.query.Channels.findFirst({
			where: (channels) => eq(channels.id, channelId),
			with: {
				members: {
					with: {
						user: true,
					},
				},
			},
		});

		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		const isOwner = channel.ownerId === adminId;
		const isAdmin = channel.members.some(
			(member) => member.userId === adminId && member.isAdmin === true,
		);

		const userToRemoveIsAdmin = channel.members.some(
			(member) => member.id === userToRemoveId && member.isAdmin === true,
		);

		const isTargetOwner = channel.ownerId === userToRemoveId;

		if (isTargetOwner) {
			if (isOwner) {
				// Owner is removing themselves - delete the channel
				return await this.deleteChannel(adminId, channel.id);
			}
			// Someone else trying to remove owner
			throw new HttpException(
				'Cannot kick the channel owner',
				HttpStatus.FORBIDDEN,
			);
		}

		// Owner can remove anyone
		// Admin can only remove non-admin members
		if (!isOwner && (!isAdmin || userToRemoveIsAdmin)) {
			throw new HttpException(
				'Insufficient permissions: Only owner can remove admins',
				HttpStatus.FORBIDDEN,
			);
		}

		await this.db
			.delete(schema.ChannelMembers)
			.where(
				and(
					eq(schema.ChannelMembers.channelId, channel.id),
					eq(schema.ChannelMembers.userId, userToRemoveId),
				),
			);
	}

	async changePassword(
		userId: number,
		channelId: number,
		pass: ChangeChannelPassword,
	): Promise<void> {
		if (!pass) {
			throw new HttpException(
				'Password not provided',
				HttpStatus.BAD_REQUEST,
			);
		}

		const channel = await this.db.query.Channels.findFirst({
			where: (channels) => eq(channels.id, channelId),
		});

		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		if (channel.ownerId !== userId) {
			throw new HttpException(
				'User is not the owner of this channel',
				HttpStatus.FORBIDDEN,
			);
		}

		// ===== Scenario 1: Er is een wachtwoord (PRIVATE) =====
		if (channel.password) {
			// Oude wachtwoord verplicht - FIXED: Check if oldPassword is provided and valid
			if (!pass.oldPassword) {
				throw new HttpException(
					'Old password required for password-protected channels',
					HttpStatus.BAD_REQUEST,
				);
			}

			// Verify the old password is correct
			if (!bcrypt.compareSync(pass.oldPassword, channel.password)) {
				throw new HttpException(
					'Incorrect current password',
					HttpStatus.UNAUTHORIZED,
				);
			}

			// Verwijderen (newPassword leeg of null) - Remove password protection
			if (!pass.newPassword || pass.newPassword.trim() === '') {
				await this.db
					.update(schema.Channels)
					.set({ password: null, type: 'PUBLIC' })
					.where(eq(schema.Channels.id, channelId));
				return;
			}

			// Wachtwoord veranderen - Change password
			if (pass.newPassword.length < 3 || pass.newPassword.length > 16) {
				throw new HttpException(
					'Password must be at least 3 characters and no more than 16 characters.',
					HttpStatus.FORBIDDEN,
				);
			}
			const hashedPassword = bcrypt.hashSync(pass.newPassword, 10);
			await this.db
				.update(schema.Channels)
				.set({ password: hashedPassword, type: 'PRIVATE' })
				.where(eq(schema.Channels.id, channelId));
			return;
		}

		// ===== Scenario 2: Er is GEEN wachtwoord (PUBLIC) =====
		// Adding password to public channel - no old password required
		if (!pass.newPassword || pass.newPassword.trim() === '') {
			throw new HttpException(
				'New password required to protect public channel',
				HttpStatus.BAD_REQUEST,
			);
		}

		if (pass.newPassword.length < 3 || pass.newPassword.length > 16) {
			throw new HttpException(
				'Password must be at least 3 characters and no more than 16 characters.',
				HttpStatus.FORBIDDEN,
			);
		}

		const hashedPassword = bcrypt.hashSync(pass.newPassword, 10);
		await this.db
			.update(schema.Channels)
			.set({ password: hashedPassword, type: 'PRIVATE' })
			.where(eq(schema.Channels.id, channelId));
	}

	// async changePassword(
	// 	userId: number,
	// 	channelId: number,
	// 	pass: ChangeChannelPassword,
	// ): Promise<void> {
	// 	if (!pass) {
	// 		throw new HttpException(
	// 			'Password not provided',
	// 			HttpStatus.BAD_REQUEST,
	// 		);
	// 	}

	// 	const channel = await this.db.query.Channels.findFirst({
	// 		where: (channels) => eq(channels.id, channelId),
	// 	});

	// 	if (!channel) {
	// 		throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
	// 	}

	// 	if (channel.type !== 'PRIVATE') {
	// 		throw new HttpException(
	// 			'Channel is not a private channel',
	// 			HttpStatus.FORBIDDEN,
	// 		);
	// 	}

	// 	if (channel.ownerId !== userId) {
	// 		throw new HttpException(
	// 			'User is not the owner of this channel',
	// 			HttpStatus.FORBIDDEN,
	// 		);
	// 	}

	// 	if (!pass.newPassword) {
	// 		throw new HttpException(
	// 			'New password not provided',
	// 			HttpStatus.BAD_REQUEST,
	// 		);
	// 	}

	// 	if (pass.newPassword.length < 3 || pass.newPassword.length > 16) {
	// 		throw new HttpException(
	// 			'Password must be at least 3 characters and no more than 16 characters.',
	// 			HttpStatus.FORBIDDEN,
	// 		);
	// 	}

	// 	//check pass.oldPassword against channel.password
	// 	if (
	// 		!channel.password ||
	// 		!bcrypt.compareSync(pass.oldPassword, channel.password)
	// 	) {
	// 		throw new HttpException(
	// 			'Incorrect current password.',
	// 			HttpStatus.UNAUTHORIZED,
	// 		);
	// 	}

	// 	try {
	// 		const hashedPassword = bcrypt.hashSync(pass.newPassword, 10);
	// 		await this.db
	// 			.update(schema.Channels)
	// 			.set({ password: hashedPassword })
	// 			.where(eq(schema.Channels.id, channelId));
	// 	} catch (err) {
	// 		throw new HttpException(
	// 			`Error updating password: ${err}`,
	// 			HttpStatus.INTERNAL_SERVER_ERROR,
	// 		);
	// 	}
	// }

	// Should take partial channel object as input from client/frontend
	async addUserToChannel(
		userId: number,
		toJoinChannel: TextChannel,
	): Promise<void> {
		const channel = await this.db.query.Channels.findFirst({
			where: (channels) => eq(channels.id, toJoinChannel.id),
			with: this.getChannelRelations(),
		});

		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		if (channel.type === 'PRIVATE') {
			if (!toJoinChannel.password) {
				throw new HttpException(
					'Password required for private channel.',
					HttpStatus.FORBIDDEN,
				);
			}

			if (
				!channel.password ||
				!bcrypt.compareSync(toJoinChannel.password, channel.password)
			) {
				throw new HttpException(
					'Incorrect password',
					HttpStatus.UNAUTHORIZED,
				);
			}
		}

		//check if user is banned
		const existingBannedUser = channel.bannedMembers.find(
			(bannedMember) => bannedMember.bannedUserId === userId,
		);

		if (existingBannedUser) {
			const now = new Date();
			if (
				existingBannedUser.expiresAt &&
				existingBannedUser.expiresAt > now
			) {
				throw new HttpException(
					'User is banned from this channel',
					HttpStatus.FORBIDDEN,
				);
			}
			// Auto-unban expired ban using channel owner as admin
			await this.unbanUserInChannel(
				channel.ownerId,
				existingBannedUser.bannedUserId,
				channel.id,
			);
		}

		//check if user is in channel
		const isUserInChannel = channel.members.some(
			(member) => member.userId === userId,
		);

		if (isUserInChannel) {
			throw new HttpException(
				'User is already in this channel',
				HttpStatus.CONFLICT,
			);
		}

		// Add user to channel
		await this.db.insert(schema.ChannelMembers).values({
			userId: userId,
			channelId: channel.id,
		});
	}

	async toggleAdminRights(
		ownerId: number,
		userToPromoteId: number,
		channelId: number,
	): Promise<void> {
		const channel = await this.db.query.Channels.findFirst({
			where: (channels) => eq(channels.id, channelId),
			with: this.getChannelRelations(),
		});

		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		if (channel.ownerId !== ownerId) {
			throw new HttpException(
				'User is not the owner of this channel',
				HttpStatus.FORBIDDEN,
			);
		}

		if (channel.ownerId === userToPromoteId) {
			throw new HttpException(
				'Cannot change owner admin rights',
				HttpStatus.FORBIDDEN,
			);
		}

		const userToPromote = channel.members.find(
			(member) => member.userId === userToPromoteId,
		);

		if (!userToPromote) {
			throw new HttpException(
				'User is not in this channel',
				HttpStatus.NOT_FOUND,
			);
		}

		// flip the bit - if user is admin, set to false, if not, set to true
		await this.db
			.update(schema.ChannelMembers)
			.set({ isAdmin: !userToPromote.isAdmin })
			.where(
				and(
					eq(schema.ChannelMembers.userId, userToPromote.userId),
					eq(schema.ChannelMembers.channelId, channel.id),
				),
			);
	}

	async banUserInChannel(
		adminId: number,
		userToBanId: number,
		channelId: number,
		duration?: Date,
		reason?: string,
	): Promise<void> {
		if (adminId === userToBanId) {
			throw new HttpException(
				'Cannot ban yourself, silly!',
				HttpStatus.FORBIDDEN,
			);
		}

		const channel = await this.db.query.Channels.findFirst({
			where: (channels) => eq(channels.id, channelId),
			with: this.getChannelRelations(),
		});
		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		const existingUser = channel.members.some(
			(user) => user.userId === userToBanId,
		);
		if (!existingUser) {
			throw new HttpException(
				'User is not in this channel',
				HttpStatus.NOT_FOUND,
			);
		}

		// Check if requesting user is owner or admin
		const isOwner = channel.ownerId === adminId;
		const isAdmin = channel.members.some(
			(member) => member.userId === adminId && member.isAdmin === true,
		);

		console.log(
			`pisOwner: ${isOwner}, isAdmin: ${isAdmin}, executorId: ${adminId}, targetId: ${userToBanId}, channelOwnerId: ${channel.ownerId}`,
		);

		if (!isOwner && !isAdmin) {
			throw new HttpException(
				'User is not an badmin or owner of this channel',
				HttpStatus.FORBIDDEN,
			);
		}

		// If admin, check they're not trying to ban an owner or another admin
		if (isAdmin && !isOwner) {
			const isTargetOwner = channel.ownerId === userToBanId;
			const isTargetAdmin = channel.members.some(
				(member) =>
					member.userId === userToBanId && member.isAdmin === true,
			);

			if (isTargetOwner || isTargetAdmin) {
				throw new HttpException(
					'Admins cannot ban owners or other admins',
					HttpStatus.FORBIDDEN,
				);
			}
		}

		// Check if user is already banned
		const existingBannedUser = channel.bannedMembers.find(
			(bannedUser) => bannedUser.bannedUserId === userToBanId,
		);
		if (existingBannedUser) {
			throw new HttpException(
				'User is already banned from this channel',
				HttpStatus.CONFLICT,
			);
		}

		// Ban user
		const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
		await this.db.insert(schema.BannedMembers).values({
			bannedUserId: userToBanId,
			channelId: channel.id,
			reason: reason,
			expiresAt: expiresAt,
		});
	}

	async unbanUserInChannel(
		adminId: number,
		userToUnbanId: number,
		channelId: number,
	): Promise<void> {
		const channel = await this.db.query.Channels.findFirst({
			where: (channels) => eq(channels.id, channelId),
			with: this.getChannelRelations(),
		});

		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		// Check if user is admin
		const isAdmin = channel.members.some(
			(member) => member.userId === adminId && member.isAdmin === true,
		);

		if (!isAdmin) {
			throw new HttpException(
				'User is not an admin of this channel',
				HttpStatus.FORBIDDEN,
			);
		}

		const existingBannedUser = channel.bannedMembers.find(
			(bannedUser) => bannedUser.bannedUserId === userToUnbanId,
		);

		const isOwner = channel.ownerId === adminId;
		if (existingBannedUser) {
			const isTargetAdmin = channel.members.some(
				(member) =>
					member.userId === existingBannedUser.bannedUserId &&
					member.isAdmin === true,
			);
			if (isTargetAdmin && !isOwner) {
				throw new HttpException(
					'Admins cannot unban other admins',
					HttpStatus.FORBIDDEN,
				);
			}
			// Unban user
			await this.db
				.delete(schema.BannedMembers)
				.where(
					and(
						eq(
							schema.BannedMembers.bannedUserId,
							existingBannedUser.bannedUserId,
						),
						eq(schema.BannedMembers.channelId, channel.id),
					),
				);
		}
	}

	async muteUserInChannel(
		adminId: number,
		userToMuteId: number,
		channelId: number,
		duration?: Date,
		reason?: string,
	): Promise<void> {
		if (adminId === userToMuteId) {
			throw new HttpException(
				'Cannot mute yourself, silly!',
				HttpStatus.FORBIDDEN,
			);
		}

		const channel = await this.db.query.Channels.findFirst({
			where: (channels) => eq(channels.id, channelId),
			with: this.getChannelRelations(),
		});
		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		const existingUser = channel.members.some(
			(user) => user.userId === userToMuteId,
		);
		if (!existingUser) {
			throw new HttpException(
				'User is not in this channel',
				HttpStatus.NOT_FOUND,
			);
		}

		// Check if requesting user is owner or admin
		const isOwner = channel.ownerId === adminId;
		const isAdmin = channel.members.some(
			(member) => member.userId === adminId && member.isAdmin === true,
		);

		if (!isOwner && !isAdmin) {
			throw new HttpException(
				'User is not an admin or owner of this channel',
				HttpStatus.FORBIDDEN,
			);
		}

		// If admin, check they're not trying to mute an owner or another admin
		if (isAdmin && !isOwner) {
			const isTargetOwner = channel.ownerId === userToMuteId;
			const isTargetAdmin = channel.members.some(
				(member) =>
					member.userId === userToMuteId && member.isAdmin === true,
			);

			if (isTargetOwner || isTargetAdmin) {
				throw new HttpException(
					'Admins cannot mute owners or other admins',
					HttpStatus.FORBIDDEN,
				);
			}
		}

		// Check if user is already muted
		const existingMutedUser = channel.mutedMembers.find(
			(mutedUser) => mutedUser.mutedUserId === userToMuteId,
		);
		if (existingMutedUser) {
			throw new HttpException(
				'User is already muted in this channel',
				HttpStatus.CONFLICT,
			);
		}

		// Mute user
		const expiresAt = new Date(Date.now() + 30 * 1000);
		await this.db.insert(schema.MutedMembers).values({
			mutedUserId: userToMuteId,
			channelId: channel.id,
			reason: reason,
			expiresAt: expiresAt,
		});
	}

	async unmuteUserInChannel(
		adminId: number,
		userToUnmuteId: number, // or id || MutedUser object?
		channelId: number,
	): Promise<void> {
		const channel = await this.db.query.Channels.findFirst({
			where: (channels) => eq(channels.id, channelId),
			with: this.getChannelRelations(),
		});

		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		// Check if user is admin
		const isAdmin = channel.members.some(
			(member) => member.userId === adminId && member.isAdmin === true,
		);

		if (!isAdmin) {
			throw new HttpException(
				'User is not an admin of this channel',
				HttpStatus.FORBIDDEN,
			);
		}

		const existingMutedUser = channel.mutedMembers.find(
			(mutedUser) => mutedUser.mutedUserId === userToUnmuteId,
		);

		const isOwner = channel.ownerId === adminId;
		if (existingMutedUser) {
			const isTargetAdmin = channel.members.some(
				(member) =>
					member.userId === existingMutedUser.mutedUserId &&
					member.isAdmin === true,
			);
			if (isTargetAdmin && !isOwner) {
				throw new HttpException(
					'Admins cannot unmute other admins',
					HttpStatus.FORBIDDEN,
				);
			}
		}

		if (existingMutedUser) {
			// Unmute user
			await this.db
				.delete(schema.MutedMembers)
				.where(
					and(
						eq(
							schema.MutedMembers.mutedUserId,
							existingMutedUser.mutedUserId,
						),
						eq(schema.MutedMembers.channelId, channel.id),
					),
				);
		}
	}

	async createMessage(
		userId: number,
		channelId: number,
		text: string,
	): Promise<any> {
		//ChannelMessage
		if (!text) {
			throw new HttpException(
				'Message text not provided',
				HttpStatus.BAD_REQUEST,
			);
		}

		const channel = await this.db.query.Channels.findFirst({
			where: (channels) => eq(channels.id, channelId),
			with: this.getChannelRelations(),
		});

		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		const channelMember = channel.members.find(
			(member) => member.userId === userId,
		);

		if (!channelMember) {
			throw new HttpException(
				'User is not in this channel',
				HttpStatus.FORBIDDEN,
			);
		}

		// Check if user is muted or banned
		// if (channelMember.mutedStatus) {
		// 	const now = new Date();
		// 	if (
		// 		channelMember.mutedStatus.expiresAt &&
		// 		channelMember.mutedStatus.expiresAt > now
		// 	) {
		// 		throw new HttpException(
		// 			`User is muted until ${channelMember.mutedStatus.expiresAt}`,
		// 			HttpStatus.FORBIDDEN,
		// 		);
		// 	}
		// 	// Auto-unmute expired mute using channel owner as admin
		// 	await this.unmuteUserInChannel(channel.ownerId, userId, channelId);
		// }

		// Altijd de mute status live uit de DB halen:
		const mute = await this.db.query.MutedMembers.findFirst({
		    where: (muted) => and(
		        eq(muted.channelId, channelId),
		        eq(muted.mutedUserId, userId),
		    ),
		});
		const now = new Date();
		if (mute && mute.expiresAt && mute.expiresAt > now) {
			console.log('User is nog gemute totTTT:', mute.expiresAt);
		    throw new HttpException(
		        `User is muted until ${mute.expiresAt}`,
		        HttpStatus.FORBIDDEN,
		    );
		}
		if (mute && mute.expiresAt && mute.expiresAt <= now) {
		    // Mute is verlopen, verwijder hem!
		    await this.unmuteUserInChannel(channel.ownerId, userId, channelId);
		}






		// Send message
		const [message] = await this.db
			.insert(schema.ChannelMessages)
			.values({
				channelId: channelId,
				content: text,
				senderId: userId,
			})
			.returning();

		return message;
	}
}
