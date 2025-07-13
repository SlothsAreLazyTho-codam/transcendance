import { DrizzleAsyncProvider } from '@/database/drizzle.provider';
import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { DirectMessageChannels, schema } from '@/database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { and, eq, or } from 'drizzle-orm';
import { DMChannel } from '@/chat/interfaces/dmChannel.interface';

@Injectable()
export class DirectMessageService {
	constructor(
		@Inject(DrizzleAsyncProvider) private db: NodePgDatabase<typeof schema>,
	) {}

	private getChannelRelations() {
		return {
			user1: {
				with: {
					blockedUsers: true,
					blockedBy: true,
				},
			},
			user2: {
				with: {
					blockedUsers: true,
					blockedBy: true,
				},
			},
			messages: {
				with: {
					sender: true, // Add this to include sender information
				},
			},
		} as const;
	}

	// gets the direct message channel between two users, lower id first
	async getChannel(userId: number, targetUserId: number): Promise<DMChannel> {
		const [userId1, userId2] = [
			Math.min(targetUserId, userId),
			Math.max(targetUserId, userId),
		];

		const channel = await this.db.query.DirectMessageChannels.findFirst({
			where: (channels, { and, eq }) =>
				and(
					eq(channels.user1Id, userId1),
					eq(channels.user2Id, userId2),
				),
			with: this.getChannelRelations(),
		});

		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}
		return channel;
	}

	// gets all direct message channels for a user
	async getDirectMessageChannels(userId: number): Promise<DMChannel[]> {
		return await this.db.query.DirectMessageChannels.findMany({
			where: (channels) =>
				or(eq(channels.user1Id, userId), eq(channels.user2Id, userId)),
			with: this.getChannelRelations(),
		});
	}

	// creates a direct message channel between two users
	async createChannel(compoundId: [number, number]): Promise<DMChannel> {
		const [userId1, userId2] = compoundId;
		const [newChannel] = await this.db
			.insert(schema.DirectMessageChannels)
			.values({
				user1Id: userId1,
				user2Id: userId2,
			})
			.returning();

		if (!newChannel) {
			throw new Error('Channel creation failed');
		}

		// Fetch the channel again with relations
		const channel = await this.db.query.DirectMessageChannels.findFirst({
			where: (channels, { and, eq }) =>
				and(
					eq(channels.user1Id, userId1),
					eq(channels.user2Id, userId2),
				),
			with: this.getChannelRelations(),
		});

		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		return channel;
	}

	// deletes a direct message channel
	async deleteChannel(userId: number, targetUserId: number): Promise<void> {
		const [userId1, userId2] = [
			Math.min(targetUserId, userId),
			Math.max(targetUserId, userId),
		];

		await this.db
			.delete(DirectMessageChannels)
			.where(
				and(
					eq(DirectMessageChannels.user1Id, userId1),
					eq(DirectMessageChannels.user2Id, userId2),
				),
			);
	}

	// join a direct message channel
	async joinChannel(
		userId: number,
		targetUserId: number,
	): Promise<DMChannel> {
		const compoundId: [number, number] = [
			Math.min(targetUserId, userId),
			Math.max(targetUserId, userId),
		];

		return await this.createChannel(compoundId);
	}

	// create message in direct message channel
	async createMessage(
		userId: number,
		targetUserId: number,
		text: string,
	): Promise<any> {
		const [lowerUserId, higherUserId] = [
			Math.min(targetUserId, userId),
			Math.max(targetUserId, userId),
		];
		const channel = await this.db.query.DirectMessageChannels.findFirst({
			where: (channels, { and, eq }) =>
				and(
					eq(channels.user1Id, lowerUserId),
					eq(channels.user2Id, higherUserId),
				),
			with: this.getChannelRelations(),
		});
		if (!channel) {
			throw new HttpException('Channel not found', HttpStatus.NOT_FOUND);
		}

		// First determine if the sender is user1 (who has blocked info) or user2
		const senderIsUser1 = channel.user1Id === userId;

		const sender = senderIsUser1 ? channel.user1 : channel.user2;
		const receiver = senderIsUser1 ? channel.user2 : channel.user1;

		if (!sender || !receiver) {
			throw new HttpException('Users not found', HttpStatus.NOT_FOUND);
		}

		// Now you can safely check blocked status using user1's data
		if (senderIsUser1) {
			// Sender has blocked info, check if receiver is blocked
			const isBlocked = sender.blockedUsers.some(
				(bu) => bu.blockedId === receiver.id,
			);
			if (isBlocked) {
				throw new HttpException(
					'User is blocked',
					HttpStatus.FORBIDDEN,
				);
			}
		} else {
			// Receiver has blocked info, check if sender is blocked
			const isBlocked = receiver.blockedUsers.some(
				(bu) => bu.blockedId === sender.id,
			);
			if (isBlocked) {
				throw new HttpException(
					'User is blocked',
					HttpStatus.FORBIDDEN,
				);
			}
		}

		const [message] = await this.db
			.insert(schema.DirectMessages)
			.values({
				content: text,
				senderId: userId,
				dmUser1Id: lowerUserId,
				dmUser2Id: higherUserId,
			})
			.returning();

		if (!message) {
			throw new Error('Message creation failed');
		}

		return message;
	}
}
