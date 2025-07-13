import {
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
	ConnectedSocket,
	OnGatewayConnection,
	MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChannelService } from '@/chat/services/channel.service';
import { DirectMessageService } from '@/chat/services/dm.service';
import { UserService } from '@/users/user.service';
import { User } from '@/database/schema/Users';
import { AuthService } from '@/auth/services/auth.service';
import { UserStatusType } from '../database/enums/users.status';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const bcrypt = require('bcryptjs');
import { randomBytes } from 'crypto';

// interfaces
import {
	TextMessage,
	TextMessageResponse,
	TextMessageError,
	newTextMessage,
	newTextMessageResponse,
} from './interfaces/message.interface';
import {
	DirectMessage,
	DirectMessageError,
	DirectMessageResponse,
} from './interfaces/directMessage.interface';
import { TextChannel } from './interfaces/textChannel.interface';
import * as GameQueueInterface from './interfaces/gameQueue.interface';
import { GameMode } from '@/gameserver/game.interface';

@WebSocketGateway({
	origin: [
		'https://localhost:8080',
		'http://localhost:8080',
		'http://frontend:3000',
		'http://backend:3001',
		'https://thor.home:8080',
		'https://thor.home',
		'ws://localhost:8080',
		'wss://localhost:8080',
		'ws://thor.home:8080',
		'wss://thor.home:8080',
	],
	credentials: true,
	namespace: '/ws/v1/chat',
	pingInterval: 10000,
	pingTimeout: 30000,
})
export class ChatGateway implements OnGatewayConnection {
	constructor(
		private readonly authService: AuthService,
		private readonly userService: UserService,
		private readonly textChannelService: ChannelService,
		private readonly directMessageService: DirectMessageService,
	) {}
	@WebSocketServer()
	server!: Server;

	private userSockets: Map<string, Socket> = new Map();
	private gameQueues: Map<GameMode, GameQueueInterface.QueuedPlayer[]> =
		new Map(); // <gameMode, queue>
	private pendingMatches: Map<
		string,
		GameQueueInterface.PendingMatchPayload
	> = new Map(); // <matchId, match>

	// Handle connection
	async handleConnection(@ConnectedSocket() client: Socket) {
		try {
			const user =
				await this.authService.getUserFromSocketPayload(client);

			if (!user || !user.id) {
				console.warn(
					`[Chatserver]: Invalid user data for client ${client.id}`,
				);
				await new Promise((resolve) => setTimeout(resolve, 200));
				client.emit('error', {
					message: 'Authentication failed',
				});

				return client.disconnect();
			}

			client.data.user = user;

			this.userSockets.set(user.id.toString(), client);

			await this.userService.setStatus(
				client.data.user.id,
				'ONLINE' as UserStatusType,
			);

			// get all channels user is in
			// get all DMs user is in
			// get all channels currently active
			// Fetch user data in parallel
			const [
				activeTextChannels,
				directMessageChannels,
				availableChannels,
			] = await Promise.all([
				this.textChannelService.getChannelsForUser(user.id),
				this.directMessageService.getDirectMessageChannels(user.id),
				this.textChannelService.getAllChannels(),
			]);

			client.emit('info', {
				user,
				activeTextChannels,
				directMessageChannels,
				availableChannels,
			});
			client.emit('connected', { message: 'Connected to server' });
		} catch (error) {
			console.error(
				`[Chatserver]: Error during handleConnection for client ${client.id}: ${error.message}`,
			);
			client.disconnect();
		}
	}

	// Handle disconnection
	async handleDisconnect(@ConnectedSocket() client: Socket) {
		try {
			if (!client.data.user) return;

			const user = client.data.user;
			this.userSockets.delete(user.id.toString());

			// Remove user from any game queues
			for (const [gameMode, queue] of this.gameQueues.entries()) {
				const playerIndex = queue.findIndex(
					(p) => p.userId === user.id,
				);
				if (playerIndex !== -1) {
					queue.splice(playerIndex, 1);
				}
			}

			// Remove user from any pending matches
			for (const [matchId, match] of this.pendingMatches.entries()) {
				const playerIndex = match.players.findIndex(
					(p) => p.userId === user.id,
				);
				if (playerIndex !== -1) {
					clearTimeout(match.timeoutId);
					this.pendingMatches.delete(matchId);
				}
			}

			await this.userService.setStatus(
				client.data.user.id,
				'OFFLINE' as UserStatusType,
			);

			return;
		} catch (error) {
			console.error(
				`[Chatserver]: Error during handleDisconnect for client ${client.id}: ${error.message}`,
			);
		}
	}

	// unused currently but could be used to emit from one to another client (ie.e invite etc.)
	@SubscribeMessage('notify')
	handleNotify(client: Socket, data: any): void {
		try {
			if (!client.data.user) return;

			const sender = client.data.user;
			const targetSocket: Socket | undefined = this.userSockets.get(
				data.targetId || data.id,
			);

			if (!targetSocket) {
				client.emit('error', 'User not found');
				return;
			}

			// Keep target ID and add sender info
			const notificationData = {
				...data,
				senderId: sender.id,
			};

			targetSocket.emit('notify', notificationData);
		} catch (error) {
			console.error('Error in handleNotify:', error);
			client.emit('error', 'Failed to send notification');
		}
	}

	//#region Shared

	@SubscribeMessage('text')
	async handleUnifiedMessages(
		@ConnectedSocket() client: Socket,
		@MessageBody() message: newTextMessage,
	): Promise<void> {
		try {
			const user = client.data.user as User;
			if (!user) {
				client.emit('text', {
					error: 'User not found',
				} as TextMessageError);
				return;
			}

			// first check message lenght as it applies to all messages
			if (message.value.length >= 256) {
				// could use 1 << 8 or 1 << 9 (256 or 512)
				client.emit('text', {
					error: 'Message too long',
				} as TextMessageError);
				return;
			}

			if (message.receiverType === 'CHANNEL') {
				await this.handleChannelMessage(client, message);
			} else if (message.receiverType === 'USER') {
				await this.handleDMMessage(client, message);
			} else {
				client.emit('text', {
					error: 'Invalid receiver type',
				} as TextMessageError);
			}
			return;
		} catch (error) {
			console.error(error);
			client.emit('text', {
				error: 'Error sending message',
			} as TextMessageError);
		}
	}

	async handleChannelMessage(client: Socket, message: newTextMessage) {
		try {
			const user = client.data.user as User;
			const channel = await this.textChannelService.getChannel(
				message.receiverId,
			);
			if (!channel) {
				client.emit('text', {
					error: 'Channel not found',
				} as TextMessageError);
				return;
			}

			//add message
			const newMessage = await this.textChannelService.createMessage(
				user.id,
				message.receiverId,
				message.value,
			);

			//emit message to channel
			this.emitChannel(channel, 'text', {
				id: newMessage.id,
				senderId: user.id,
				senderName: user.username,
				receiverId: message.receiverId,
				receiverType: message.receiverType,
				value: message.value,
			} as newTextMessageResponse);
		} catch (error) {
			console.error(error);
			client.emit('text', {
				error: 'Error sending message',
			} as TextMessageError);
		}
	}

	async handleDMMessage(client: Socket, message: newTextMessage) {
		try {
			const user = client.data.user;
			const channel = await this.directMessageService.getChannel(
				user.id,
				message.receiverId,
			);

			const otherUserId =
				channel.user1Id === user.id ? channel.user2Id : channel.user1Id;
			const otherUser = await this.userService.getById(otherUserId);
			if (!channel || !otherUser) {
				client.emit('text', { error: 'Channel not found' });
				return;
			}
			if (otherUser) {
				const isBlocked = user.blockedBy.some(
					(block) => block.userId === user.id,
				);
				const hasBlocked = user.blockedUsers.some(
					(block) => block.blockedId === user.id,
				);

				if (isBlocked || hasBlocked) {
					client.emit('blocked', {
						error: 'User is blocked',
					});
				}
			}

			//add message
			const channelMessage =
				await this.directMessageService.createMessage(
					user.id,
					otherUser.id,
					message.value,
				);

			const vid = this.generateDmChannelId(
				channel.user1Id,
				channel.user2Id,
			);

			//emit message to channel
			this.emitDmChannel(channel, 'text', {
				id: channelMessage.id,
				senderId: user.id,
				senderName: user.username,
				receiverId: vid,
				receiverType: message.receiverType,
				value: channelMessage.content,
				dmUser1Id: channel.user1Id,
				dmUser2Id: channel.user2Id,
			} as newTextMessageResponse);
		} catch (error) {
			console.error(error);
			client.emit('text', {
				error: 'Error sending message',
			} as DirectMessageError);
		}
	}

	//#endregion

	//#region Channel

	emitChannel(channel: TextChannel, event: string, ...args: any): void {
		try {
			if (!channel?.members) {
				console.warn('Invalid channel or missing members');
				return;
			}

			// Get a set of user IDs in this channel for faster lookups
			const channelUserIds = new Set(
				channel.members.map((member) => member.user.id),
			);

			// Only iterate through sockets whose users are in the channel
			channelUserIds.forEach((userId) => {
				const userSocket = this.userSockets.get(userId.toString());
				if (userSocket) {
					userSocket.emit(event, ...args);
				}
			});
		} catch (error) {
			console.error('Error emitting to channel:', error);
		}
	}

	@SubscribeMessage('channel')
	async getChannel(client: Socket, id: number): Promise<void> {
		try {
			const channel = await this.textChannelService.getChannel(id);
			if (!channel) {
				client.emit('channel', { error: 'Channel not found' });
				return;
			}
			client.emit('channel', channel);
		} catch (error) {
			console.error(error);
			client.emit('channel', { error: 'Error fetching channel' });
		}
	}

	@SubscribeMessage('channelMe')
	async getChannelMe(client: Socket): Promise<void> {
		try {
			const channels = await this.textChannelService.getChannelsForUser(
				client.data.user.id,
			);
			if (!channels) {
				client.emit('channelMe', { error: 'Channel not found' });
				return;
			}
			client.emit('channelMe', channels);
		} catch (error) {
			console.error(error);
			client.emit('channelMe', { error: 'Error fetching channel' });
		}
	}

	@SubscribeMessage('channelAll')
	async getAllChannels(client: Socket): Promise<void> {
		try {
			const channels = await this.textChannelService.getAllChannels();
			if (!channels) {
				client.emit('channelAll', { error: 'Channels not found' });
				return;
			}
			client.emit('channelAll', channels);
		} catch (error) {
			console.error(error);
			client.emit('channelAll', { error: 'Error fetching all channels' });
		}
	}

	@SubscribeMessage('join')
	async joinChannel(client: Socket, joinChannel: TextChannel): Promise<void> {
		async function validatePassword(
			channelPassword: string,
			inputPassword: string,
		): Promise<boolean> {
			try {
				return await bcrypt.compare(inputPassword, channelPassword);
			} catch (error) {
				console.error('Error comparing passwords:', error);
				return false;
			}
		}
		// type sohuld maybe be updated to type of channel based on drizzle schema?
		try {
			const user = client.data.user;
			let channel = await this.textChannelService.getChannel(
				joinChannel.id,
				true,
			);

			// dirty check for password but works for now
			if (channel.type !== 'PUBLIC') {
				if (channel.password && joinChannel.password) {
					const isPasswordValid = await validatePassword(
						channel.password,
						joinChannel.password,
					);
					client.emit('passwordValid', isPasswordValid);
					if (!isPasswordValid) {
						client.emit('join', {
							error: 'Invalid password',
						});
						return;
					}
				} else {
					client.emit('passwordValid', false);
					client.emit('join', {
						error: 'Channel is private and requires a password',
					});
					return;
				}
			}

			const isUserBanned = channel.bannedMembers?.some(
				(ban) => ban.user.id === user.id,
			);
			if (isUserBanned) {
				client.emit('join', {
					error: 'You are banned from this channel',
				});
				return;
			}

			// add user to channel
			await this.textChannelService.addUserToChannel(
				client.data.user.id,
				joinChannel,
			);

			channel = await this.textChannelService.getChannel(
				channel.id,
				false,
			);

			// Send success response to the joining user with channel data
			client.emit('join', {
				channel: channel,
				message: 'Successfully joined channel',
			});

			// emit join event to channel
			this.emitChannel(channel, 'join', {
				channelId: channel.id,
				user: user.id,
				username: user.username,
			});
		} catch (error) {
			console.error(error);
			client.emit('join', { error: 'Error joining channel' });
		}
	}

	@SubscribeMessage('leave')
	async leaveChannel(
		client: Socket,
		leaveChannel: TextChannel,
	): Promise<void> {
		try {
			const user = client.data.user;
			const channel = await this.textChannelService.getChannel(
				leaveChannel.id,
			);

			// remove user from channel
			await this.textChannelService.removeUserFromChannel(
				channel.ownerId, // special case use owner id as auth to leave channel
				leaveChannel.id,
				client.data.user.id,
			);

			const shouldDelete =
				channel.ownerId === client.data.user.id ? true : false;

			// emit leave event to channel
			this.emitChannel(channel, 'leave', {
				channel,
				user,
				shouldDelete: shouldDelete,
			});
		} catch (error) {
			console.error(error);
			client.emit('leave', { error: 'Error leaving channel' });
		}
	}

	@SubscribeMessage('admin')
	async toggleAdmin(client: Socket, data: any): Promise<void> {
		try {
			const userToBeAdmin = await this.userService.getById(data.user.id);
			if (!userToBeAdmin) {
				client.emit('admin', { error: 'User not found' });
				return;
			}
			const owner = client.data.user;
			let channel = await this.textChannelService.getChannel(
				data.channel.id,
			);

			await this.textChannelService.toggleAdminRights(
				owner.id,
				userToBeAdmin.id,
				channel.id,
			);

			channel = await this.textChannelService.getChannel(channel.id);

			// emit admin event to channel
			this.emitChannel(channel, 'admin', {
				channel: {
					id: channel.id,
					name: channel.name,
					admin: owner.id,
				},
				admin_user: {
					id: userToBeAdmin.id,
					username: userToBeAdmin.username,
				},
			});
		} catch (error) {
			console.error(error);
			client.emit('admin', { error: 'Error toggling admin' });
		}
	}

	@SubscribeMessage('kick')
	async kickUser(client: Socket, data: any): Promise<void> {
		try {
			const userToBeKicked = await this.userService.getById(data.userId);
			if (!userToBeKicked) {
				client.emit('kick', { error: 'User not found' });
				return;
			}
			const ownerOrAdmin = client.data.user;
			let channel = await this.textChannelService.getChannel(
				data.channelId,
			);

			await this.textChannelService.removeUserFromChannel(
				ownerOrAdmin.id,
				data.channelId,
				userToBeKicked.id,
			);

			// Stuur een specifiek event naar de GEKICKTE gebruiker
			const kickedUserSocket = this.userSockets.get(
				userToBeKicked.id.toString(),
			);
			if (kickedUserSocket) {
				kickedUserSocket.emit('youWereKicked', {
					// Nieuw eventnaam!
					channelId: channel.id,
					channelName: channel.name,
					reason: 'You have been kicked from the channel.',
				});
				// Optioneel: laat de gebruiker direct de room verlaten als je Socket.IO rooms gebruikt
				// kickedUserSocket.leave(channel.id.toString());
			}

			// Haal het kanaal opnieuw op (nodig om de bijgewerkte members te krijgen na removeUserFromChannel)
			channel = await this.textChannelService.getChannel(channel.id);

			// Stuur een update naar de OVERIGE gebruikers in het kanaal (inclusief de kicker)
			// over wie er gekickt is, of een algemene channel update
			this.emitChannel(channel, 'channelUpdate', {
				// Gebruik 'channelUpdate' of een specifiekere naam
				channelId: channel.id,
				members: channel.members, // Stuur de bijgewerkte lijst met leden
				message: `${userToBeKicked.username} has been kicked from the channel.`,
				action: 'kicked', // Voeg een actie toe voor de client om te reageren
				kickedUserId: userToBeKicked.id,
			});

			// Als de kicker succesvol was, geef dan een bevestiging
			client.emit('kickSuccessful', {
				channelId: channel.id,
				kickedUsername: userToBeKicked.username,
				message: `${userToBeKicked.username} has been successfully kicked.`,
			});

			channel = await this.textChannelService.getChannel(channel.id);

			// emit kick event to channel
			this.emitChannel(channel, 'kick', {
				channel: {
					id: channel.id,
					name: channel.name,
					admin: ownerOrAdmin.id,
				},
				kicked_user: {
					id: userToBeKicked.id,
					username: userToBeKicked.username,
				},
			});
		} catch (error) {
			console.error(error);
			client.emit('kick', { error: 'Error kicking user' });
		}
	}

	@SubscribeMessage('ban')
	// { userId: number:playerToBan, channelId: number:curChannelId }
	async toggleBan(client: Socket, data: any): Promise<void> {
		try {
			const userToBeBanned = await this.userService.getById(
				data.playerToBan,
			);
			if (!userToBeBanned) {
				client.emit('ban', { error: 'User not found' });
				return;
			}
			const ownerOrAdmin = client.data.user;
			// let channel = await this.textChannelService.getChannel(
			// 	data.curChannelId,
			// );
			let channel = await this.textChannelService.getChannel(
				data.channel.id,
			);

			//check if user is already banned if so unban
			const member = channel.members?.find(
				(member) => member.user.id === userToBeBanned.id,
			);
			if (!member) {
				return;
			}
			const isUserBanned = channel.bannedMembers?.find(
				(member) => member.user.id === userToBeBanned.id,
			);
			// if user is already banned unban
			if (isUserBanned) {
				await this.textChannelService.unbanUserInChannel(
					ownerOrAdmin.id,
					channel.id,
					isUserBanned.user.id,
				);
			} else {
				await this.textChannelService.banUserInChannel(
					ownerOrAdmin.id,
					userToBeBanned.id,
					channel.id,
				);

				const userSocket = this.userSockets.get(
					userToBeBanned.id.toString(),
				);
				if (userSocket) {
					userSocket.emit('ban', {
						reason: 'You have been banned from this channel',
						channelId: channel.id,
					});

					// Optioneel: gebruik room-leave als je Socket.IO rooms gebruikt
					userSocket.leave(channel.id.toString());
				}

				await this.textChannelService.removeUserFromChannel(
					ownerOrAdmin.id,
					channel.id,
					userToBeBanned.id,
				);
			}
			channel = await this.textChannelService.getChannel(data.channel.id);
			// emit ban event to channel
			this.emitChannel(channel, 'ban', {
				channel: {
					id: channel.id,
					name: channel.name,
					admin: ownerOrAdmin.id,
				},
				user: { id: ownerOrAdmin.id, username: ownerOrAdmin.username },
				banned_user: {
					id: userToBeBanned.id,
					username: userToBeBanned.username,
				},
			});
		} catch (error) {
			console.error(error);
			client.emit('ban', { error: 'Error banning user' });
		}
	}

	@SubscribeMessage('mute')
	async toggleMute(client: Socket, data: any): Promise<void> {
		try {
			const userToBeMuted = await this.userService.getById(data.userId);
			if (!userToBeMuted) {
				client.emit('mute', { error: 'User not found' });
				return;
			}
			const ownerOrAdmin = client.data.user;
			// Zorg ervoor dat data.channelId wordt gebruikt, consistent met de client
			let channel = await this.textChannelService.getChannel(
				data.channelId,
			);

			if (!channel) {
				client.emit('mute', { error: 'Channel not found' });
				return;
			}

			// Controleer of de gebruiker al gemuteerd is
			const isUserMuted = channel.mutedMembers?.some(
				(m) => m.user.id === userToBeMuted.id,
			);

			if (isUserMuted) {
				// Als de gebruiker al gemuteerd is, unmute hem dan
				// Zorg dat deze functie (unmuteUserInChannel) bestaat in je ChannelService
				await this.textChannelService.unmuteUserInChannel(
					ownerOrAdmin.id,
					userToBeMuted.id,
					channel.id,
				);
			} else {
				// Als de gebruiker niet gemuteerd is, mute hem dan
				// Zorg dat deze functie (muteUserInChannel) bestaat in je ChannelService
				await this.textChannelService.muteUserInChannel(
					ownerOrAdmin.id,
					userToBeMuted.id,
					channel.id,
				);
			}

			// Haal het kanaal opnieuw op om de bijgewerkte status te krijgen
			channel = await this.textChannelService.getChannel(channel.id);

			// Verstuur een update naar alle leden van het kanaal
			this.emitChannel(channel, 'channelUpdate', {
				channelId: channel.id,
				mutedMembers: channel.mutedMembers, // Stuur de bijgewerkte lijst met gemuteerde leden mee
				// Optioneel: stuur de hele channel object mee als het nodig is voor andere updates
				// channel: channel,
			});

			// Stuur ook een specifieke "muteStatus" event naar de gemuteerde gebruiker
			const userSocket = this.userSockets.get(
				userToBeMuted.id.toString(),
			);
			if (userSocket) {
				userSocket.emit('muteStatus', {
					channelId: channel.id,
					isMuted: !isUserMuted, // Stuur de nieuwe mute status
				});
			}
		} catch (error) {
			console.error('Error toggling mute:', error);
			client.emit('mute', { error: 'Error toggling mute' });
		}
	}
	//#endregion

	/// Direct Messaging (DM) functions
	//#region DM functions

	private generateDmChannelId(user1Id: number, user2Id: number): number {
		// Cantor pairing function to create a unique number from two numbers
		// Ensures the same pair of users always gets the same ID
		const max = Math.max(user1Id, user2Id);
		const min = Math.min(user1Id, user2Id);
		// Add 10000 offset to avoid mixing with channel IDs
		return 10000 + ((max + min) * (max + min + 1)) / 2 + min;
	}

	emitDmChannel(channel: any, event: string, ...args: any): void {
		try {
			// Create an array with the two user IDs from the DM channel
			const userIds: number[] = [];

			if (channel.user1?.id) userIds.push(channel.user1.id);
			if (channel.user2?.id) userIds.push(channel.user2.id);

			// If we don't have exactly 2 users yet, try direct ID properties
			if (userIds.length < 2) {
				if (
					channel.user1Id !== undefined &&
					!userIds.includes(channel.user1Id)
				) {
					userIds.push(channel.user1Id);
				}
				if (
					channel.user2Id !== undefined &&
					!userIds.includes(channel.user2Id)
				) {
					userIds.push(channel.user2Id);
				}
			}
			// Emit to each user in the DM channel using the userSockets map
			userIds.forEach((userId) => {
				const userSocket = this.userSockets.get(userId.toString());
				if (userSocket) {
					userSocket.emit(event, ...args);
				}
			});
		} catch (error) {
			// Log the error instead of silent catch
			console.error('Error emitting to DM channel:', error);
		}
	}

	@SubscribeMessage('channelDM')
	async getDMChannel(client: Socket, id: number): Promise<void> {
		try {
			const tChannel = await this.directMessageService.getChannel(
				client.data.user.id,
				id,
			);
			if (!tChannel) {
				client.emit('channelDM', { error: 'Channel not found' });
				return;
			}

			// Add synthetic ID to the DM channel
			const channel = {
				...tChannel,
				vid: this.generateDmChannelId(
					tChannel.user1Id,
					tChannel.user2Id,
				),
			};
			client.emit('channelDM', channel);
		} catch (error) {
			console.error(error);
		}
	}

	@SubscribeMessage('channelMeDM')
	async getDMChannelMe(client: Socket): Promise<void> {
		try {
			const tChannels =
				await this.directMessageService.getDirectMessageChannels(
					client.data.user.id,
				);
			if (!tChannels) {
				client.emit('channelMeDM', { error: 'Channels not found' });
				return;
			}
			// Add synthetic ID to each DM channel
			const channels = tChannels.map((channel) => {
				return {
					...channel,
					vid: this.generateDmChannelId(
						channel.user1Id,
						channel.user2Id,
					),
				};
			});
			client.emit('channelMeDM', channels);
		} catch (error) {
			console.error(error);
		}
	}

	// goes into joinChannel in dm.service.ts
	@SubscribeMessage('joinDM')
	async joinDMChannel(client: Socket, otherUser: any): Promise<void> {
		try {
			const user = client.data.user;
			const otherUserId = otherUser.id;
			const tChannel = await this.directMessageService.joinChannel(
				user.id,
				otherUserId,
			);

			if (!tChannel) {
				client.emit('joinDM', { error: 'Channel not found' });
				return;
			}

			// Add synthetic ID to the DM channel
			const channel = {
				...tChannel,
				vid: this.generateDmChannelId(
					tChannel.user1Id,
					tChannel.user2Id,
				),
			};

			// emit join event to channel
			this.emitDmChannel(channel, 'joinDM', { status: 'ok' }, { status: 'ok' });
		} catch (error) {
			console.error(error);
			client.emit('joinDM', { error: 'Error joining channel' });
		}
	}

	//#region Game Queue

	// Helper to find a user in any queue
	private findUserInAnyQueue(userId: number): {
		gameMode: GameMode;
		player: GameQueueInterface.QueuedPlayer;
		queue: GameQueueInterface.QueuedPlayer[];
	} | null {
		for (const [gameMode, queue] of this.gameQueues.entries()) {
			const player = queue.find((p) => p.userId === userId);
			if (player) {
				return { gameMode, player, queue };
			}
		}
		return null;
	}

	// Helper to try and create matches for a given game mode
	private tryMatchmaking(gameMode: GameMode): void {
		const queue = this.gameQueues.get(gameMode);
		if (!queue) return;

		const playersNeededForMatch = 2;

		while (queue.length >= playersNeededForMatch) {
			const matchedPlayers = queue.splice(0, playersNeededForMatch); // Get and remove players from queue

			const matchId = randomBytes(16).toString('hex');

			const matchPayload: GameQueueInterface.MatchFoundPayload = {
				gameMode,
				matchId,
				players: matchedPlayers.map((p) => ({
					userId: p.userId,
					username: p.username,
				})),
				acceptTimeoutInSeconds: 15,
				status: 'PENDING',
			};

			// Create timeout to cancel match after 15 seconds
			const timeoutId = setTimeout(() => {
				this.cancelMatch(matchId);
			}, 15000);

			// Track this match
			this.pendingMatches.set(matchId, {
				players: matchedPlayers,
				acceptedPlayers: new Set<number>(),
				timeoutId,
				gameMode,
				status: 'PENDING',
			});

			// Notify matched players
			matchedPlayers.forEach((player) => {
				player.socket?.emit('match_found', matchPayload);
				console.log(
					`Match found for ${player.username} in ${gameMode}. Match ID: ${matchId}`,
				);
			});
		}
	}

	@SubscribeMessage('join_queue')
	async handleJoinQueue(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: GameQueueInterface.JoinQueueRequest,
	): Promise<GameQueueInterface.JoinQueueResponse> {
		try {
			const user = client.data.user as User;
			if (!user || !user.id) {
				return { status: 'ERROR', message: 'User not authenticated.' };
			}
			const { gameMode } = data;

			if (!gameMode) {
				return { status: 'ERROR', message: 'Game mode not specified.' };
			}

			// Check if user is already in any queue
			const existingQueueInfo = this.findUserInAnyQueue(user.id);
			if (existingQueueInfo) {
				if (existingQueueInfo.gameMode === gameMode) {
					return {
						status: 'ERROR',
						message: `You are already in the queue for ${gameMode}.`,
						gameMode,
						time: existingQueueInfo.player.joinedAt,
						pos:
							existingQueueInfo.queue.findIndex(
								(p) => p.userId === user.id,
							) + 1,
					};
				} else {
					// As per frontend logic, client should leave previous queue first.
					// If not, could auto-leave them or return an error.
					// For now, let's assume client handles leaving.
					return {
						status: 'ERROR',
						message: `You are already in a queue for ${existingQueueInfo.gameMode}. Please leave it first.`,
						gameMode: existingQueueInfo.gameMode,
					};
				}
			}

			if (!this.gameQueues.has(gameMode)) {
				this.gameQueues.set(gameMode, []);
			}

			const queue = this.gameQueues.get(gameMode)!;
			const joinedAt = Date.now();
			const queuedPlayer: GameQueueInterface.QueuedPlayer = {
				userId: user.id,
				username: user.username!, // this ! is bad but we know the username is never null (don;t have time to update the database, table/ type)
				socket: client,
				joinedAt,
			};

			queue.push(queuedPlayer);
			const position = queue.length;

			console.log(
				`${user.username} (ID: ${user.id}) joined queue for ${gameMode}. Position: ${position}`,
			);

			// Attempt to make a match
			this.tryMatchmaking(gameMode);

			return {
				status: 'OK',
				gameMode,
				time: joinedAt,
				pos: position,
			};
		} catch (error) {
			console.error('Error in handleJoinQueue:', error);
			return { status: 'ERROR', message: 'Failed to join queue.' };
		}
	}

	@SubscribeMessage('leave_queue')
	async handleLeaveQueue(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: GameQueueInterface.LeaveQueueRequest,
	): Promise<GameQueueInterface.QueueResponse> {
		try {
			const user = client.data.user as User;
			if (!user || !user.id) {
				return { status: 'ERROR', message: 'User not authenticated.' };
			}
			const { gameMode } = data;

			if (!gameMode) {
				return { status: 'ERROR', message: 'Game mode not specified.' };
			}

			const queue = this.gameQueues.get(gameMode);
			if (!queue) {
				return {
					status: 'ERROR',
					message: `Not in queue for ${gameMode} (queue does not exist).`,
				};
			}

			const playerIndex = queue.findIndex((p) => p.userId === user.id);

			if (playerIndex === -1) {
				return {
					status: 'ERROR',
					message: `You are not in the queue for ${gameMode}.`,
				};
			}

			queue.splice(playerIndex, 1);
			console.log(
				`${user.username} (ID: ${user.id}) left queue for ${gameMode}.`,
			);

			return { status: 'OK' };
		} catch (error) {
			console.error('Error in handleLeaveQueue:', error);
			return { status: 'ERROR', message: 'Failed to leave queue.' };
		}
	}

	// accept match
	@SubscribeMessage('accept_match')
	async handleAcceptMatch(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { matchId: string },
	): Promise<{ status: string; message?: string }> {
		try {
			const user = client.data.user as User;
			if (!user || !user.id) {
				return { status: 'ERROR', message: 'User not authenticated.' };
			}

			const matchInfo = this.pendingMatches.get(data.matchId);
			if (!matchInfo) {
				return {
					status: 'ERROR',
					message: 'Match not found or has expired.',
				};
			}

			// Check if this user is part of the match
			const playerInMatch = matchInfo.players.find(
				(p) => p.userId === user.id,
			);
			if (!playerInMatch) {
				return {
					status: 'ERROR',
					message: 'You are not part of this match.',
				};
			}

			// Mark this player as accepted
			matchInfo.acceptedPlayers.add(user.id);

			// If all players have accepted, create the game
			if (matchInfo.acceptedPlayers.size === matchInfo.players.length) {
				clearTimeout(matchInfo.timeoutId);
				this.pendingMatches.delete(data.matchId);

				// Notify all players that match is starting
				const startPayload: GameQueueInterface.StartMatchPayload = {
					matchId: data.matchId,
					gameMode: matchInfo.gameMode,
					players: matchInfo.players.map((p) => ({
						userId: p.userId,
						username: p.username,
						joinedAt: p.joinedAt,
					})),
					status: 'STARTING',
				};

				matchInfo.players.forEach((player) => {
					player.socket?.emit('match_start', startPayload);
				});

				return { status: 'OK' };
			}

			return { status: 'OK' };
		} catch (error) {
			console.error('Error in handleAcceptMatch:', error);
			return { status: 'ERROR', message: 'Failed to accept match.' };
		}
	}

	private cancelMatch(matchId: string): void {
		const matchInfo = this.pendingMatches.get(matchId);
		if (!matchInfo) return;

		console.log(`Match ${matchId} timed out and was canceled`);

		// Notify all players that the match was canceled
		const cancelPayload: GameQueueInterface.CancelMatchPayload = {
			matchId: matchId,
			status: 'CANCELED',
			reason: 'Not all players accepted in time',
		};

		matchInfo.players.forEach((player) => {
			player.socket?.emit('match_canceled', cancelPayload);
		});

		// Option: Add players back to queue if they accepted
		// matchInfo.players.forEach((player) => {
		// 	if (matchInfo.acceptedPlayers.has(player.userId)) {
		// 		const gameMode = matchInfo.gameMode;
		// 		if (!this.gameQueues.has(gameMode)) {
		// 			this.gameQueues.set(gameMode, []);
		// 		}

		// 		const queue = this.gameQueues.get(gameMode)!;
		// 		queue.push({
		// 			...player,
		// 			joinedAt: Date.now(),
		// 		});

		// 		player.socket.emit('auto_requeued', { gameMode });
		// 	}
		// });

		// Clean up
		this.pendingMatches.delete(matchId);
	}
	//#endregion
}
