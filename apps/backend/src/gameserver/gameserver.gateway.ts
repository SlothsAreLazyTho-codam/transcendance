import {
	WebSocketGateway,
	SubscribeMessage,
	OnGatewayConnection,
	OnGatewayDisconnect,
	WebSocketServer,
	ConnectedSocket,
	MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
// import { GameserverService } from './gameserver.service';
import * as GameInterface from './game.interface';
import { User } from '@/database/schema';
import { AuthService } from '@/auth/services/auth.service';

@WebSocketGateway({
	cors: {
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
	},
	credentials: true,
	namespace: '/ws/v1/gameserver',
})
export class GameserverGateway
	implements OnGatewayConnection, OnGatewayDisconnect
{
	@WebSocketServer() server: Server;

	private gameRooms: Map<string, GameInterface.GameRoom> = new Map();

	constructor(private readonly authService: AuthService) {}

	async handleConnection(@ConnectedSocket() client: Socket) {
		console.log(`[Gameserver]: Client connected: ${client.id}`);
		try {
			const user =
				await this.authService.getUserFromSocketPayload(client);
			if (!user) {
				console.log(
					`[Gameserver]: Client ${client.id} failed authentication. Disconnecting.`,
				);
				await new Promise((resolve) => setTimeout(resolve, 200));
				client.emit('auth_error', {
					message: 'Authentication failed.',
				});
				client.disconnect(true);
				return;
			}
			client.data.user = user;
			console.log(
				`[Gameserver]: Client ${client.id} authenticated as ${user.username}`,
			);
			client.emit('connected', {
				message: 'Authenticated with gameserver',
			});
		} catch (error) {
			console.error(
				`[Gameserver]: Authentication error for ${client.id}:`,
				error,
			);
			client.emit('auth_error', { message: 'Authentication error.' });
			client.disconnect(true);
		}
		// if (this.players.size < 2) {
		// 	const playerRole = this.players.size === 0 ? 'player1' : 'player2';
		// 	this.players.set(client.id, playerRole);
		// 	client.emit('playerRole', playerRole);
		// 	if (this.players.size === 2) {
		// 		client.emit('gameStart');
		// 	}
		// } else {
		// 	client.emit('gameFull');
		// 	client.disconnect();
		// }
	}

	handleDisconnect(@ConnectedSocket() client: Socket) {
		console.log(`[Gameserver]: Client disconnected: ${client.id}`);
		this.gameRooms.forEach((room, matchId) => {
			if (room.players.has(client.id)) {
				const player = room.players.get(client.id)!;
				console.log(
					`[Gameserver]: Player ${player.username} (Socket: ${client.id}) removed from room ${matchId}`,
				);
				room.players.delete(client.id);

				// Notify other players in the room
				this.server.to(matchId).emit('player_left', {
					userId: player.id,
					username: player.username,
					matchId,
				});

				// If room becomes empty, clean it up
				if (room.players.size === 0) {
					console.log(
						`[Gameserver]: Room ${matchId} is empty. Removing.`,
					);
					this.gameRooms.delete(matchId);
				} else {
					// Handle game state changes, e.g., pause game, declare winner if opponent leaves
					// This is game-specific logic
					if (
						room.players.size < 2 &&
						room.playerRolesAssigned === 2
					) {
						// Check if it was a 2 player game
						this.server.to(matchId).emit('opponent_left', {
							message: `${player.username} has left the game.`,
						});
						// Potentially end the game or wait for reconnection (more complex)
					}
				}
			}
		});
	}

	@SubscribeMessage('join_game_room')
	async handleJoinGameRoom(
		@ConnectedSocket() client: Socket,
		@MessageBody()
		data: { matchId: string; gameMode: GameInterface.GameMode },
	) {
		const user = client.data.user as User;
		if (!user) {
			client.emit('error', {
				message: 'User not authenticated for game room.',
			});
			return { status: 'error', message: 'Authentication required.' };
		}

		const { matchId, gameMode } = data;
		if (!matchId || !gameMode) {
			client.emit('error', {
				message: 'matchId and gameMode are required.',
			});
			return { status: 'error', message: 'Missing matchId or gameMode.' };
		}

		let room = this.gameRooms.get(matchId);

		if (!room) {
			room = {
				matchId,
				gameMode,
				players: new Map<string, GameInterface.Player>(),
				gameState: {
					ball: { x: 576, y: 432, vx: 0, vy: 0 }, // TODO: center of the screen for res: 1152x864
					paddles: { player1: { y: 0 }, player2: { y: 0 } },
					scores: { player1: 0, player2: 0 },
				},
				playerRolesAssigned: 0,
				createdAt: Date.now(),
			};
			this.gameRooms.set(matchId, room);
			console.log(`Gameserver: Room ${matchId} created for ${gameMode}.`);
		}

		// Check if room is full (e.g., for a 1v1 game)
		const MAX_PLAYERS_FOR_MODE = 2;
		if (room.players.size >= MAX_PLAYERS_FOR_MODE) {
			client.emit('room_full', { matchId });
			console.log(
				`Gameserver: Room ${matchId} is full. User ${user.username} cannot join.`,
			);

			return { status: 'error', message: 'Room is full.' };
		}

		// Add player to room
		if (!room.players.has(client.id)) {
			const newPlayer: GameInterface.Player = {
				id: user.id.toString(),
				socketId: client.id,
				username: user.username!,
			};

			// Assign roles (simple player1/player2 for 1v1)
			if (room.playerRolesAssigned === 0) {
				newPlayer.role = 'player1';
				room.playerRolesAssigned++;
			} else {
				newPlayer.role = 'player2';
				room.playerRolesAssigned++;
			}

			room.players.set(client.id, newPlayer);
			client.join(matchId); // Socket.IO join room

			console.log(
				`Gameserver: User ${user.username} (Role: ${newPlayer.role}) joined room ${matchId}. Total players: ${room.players.size}`,
			);
			client.emit('joined_room', {
				matchId,
				role: newPlayer.role,
				players: Array.from(room.players.values()).map((p) => ({
					id: p.id,
					username: p.username,
					role: p.role,
				})),
			});
			client.emit('playerRole', newPlayer.role); // TODO: replace with joined_room..
			this.server.to(matchId).emit('player_joined', {
				userId: newPlayer.id,
				username: newPlayer.username,
				role: newPlayer.role,
				matchId,
			});

			if (
				room.players.size === MAX_PLAYERS_FOR_MODE &&
				room.playerRolesAssigned === MAX_PLAYERS_FOR_MODE
			) {
				console.log(
					`Gameserver: Room ${matchId} is now full with ${MAX_PLAYERS_FOR_MODE} players. Starting game.`,
				);
				this.server.to(matchId).emit('game_start', {
					matchId,
					gameState: room.gameState,
					players: Array.from(room.players.values()).map((p) => ({
						id: p.id,
						username: p.username,
						role: p.role,
					})),
				});
			}
			return {
				status: 'ok',
				message: 'Joined room successfully.',
				role: newPlayer.role,
			};
		} else {
			const existingPlayer = room.players.get(client.id);
			console.log(
				`Gameserver: User ${user.username} (Socket: ${client.id}) is already in room ${matchId} as ${existingPlayer?.role}.`,
			);
			client.emit('already_in_room', {
				matchId,
				role: existingPlayer?.role,
			});
			return {
				status: 'ok',
				message: 'Already in room.',
				role: existingPlayer?.role,
			};
		}
	}

	//#region Game Logic Handlers
	@SubscribeMessage('move_paddle') // Renamed from 'movePaddle' for consistency
	handlePaddleMove(
		@ConnectedSocket() client: Socket,
		@MessageBody() data: { matchId: string; y: number },
	) {
		const room = this.gameRooms.get(data.matchId);
		const player = room?.players.get(client.id);

		if (
			room &&
			player &&
			player.role &&
			(player.role === 'player1' || player.role === 'player2')
		) {
			room.gameState.paddles[player.role].y = data.y;
			// Emit to all in room except sender.
			this.server.to(data.matchId).emit('paddle_update', {
				id: player.role,
				y: data.y,
			});
		}
	}

	// @SubscribeMessage('movePaddle')
	// handlePaddleMove(client: Socket, { y }: { y: number }) {
	// 	const playerRole = this.players.get(client.id);
	// 	if (playerRole) {
	// 		this.gameState.paddles[playerRole].y = y;
	// 		this.server.emit('paddleUpdate', {
	// 			id: playerRole,
	// 			y,
	// 		});
	// 	}
	// }

	@SubscribeMessage('score_point') // Renamed
	handleScorePoint(
		@ConnectedSocket() client: Socket,
		@MessageBody()
		data: { matchId: string; scoringPlayerRole: 'player1' | 'player2' },
	) {
		const room = this.gameRooms.get(data.matchId);
		const player = room?.players.get(client.id); // The player reporting the score

		if (room && player) {
			// Ensure the reporting client is part of the room
			const { scoringPlayerRole } = data;
			if (room.gameState.scores[scoringPlayerRole] !== undefined) {
				room.gameState.scores[scoringPlayerRole]++;
				console.log(
					`Gameserver: Room ${data.matchId}, Score Update: ${JSON.stringify(room.gameState.scores)} by ${player.username} for ${scoringPlayerRole}`,
				);
				this.server.to(data.matchId).emit('score_update', {
					matchId: data.matchId,
					scores: room.gameState.scores,
				});

				// Check for game over condition
				const WINNING_SCORE = 5; // Example
				if (room.gameState.scores[scoringPlayerRole] >= WINNING_SCORE) {
					const winner = Array.from(room.players.values()).find(
						(p) => p.role === scoringPlayerRole,
					);
					console.log(
						`Gameserver: Room ${data.matchId}, Game Over! Winner: ${winner?.username || scoringPlayerRole}`,
					);
					this.server.to(data.matchId).emit('game_over', {
						matchId: data.matchId,
						winnerRole: scoringPlayerRole,
						scores: room.gameState.scores,
					});
					this.gameRooms.delete(data.matchId); // Or move to an "archived" state
				}
			}
		}
	}

	// @SubscribeMessage('scorePoint')
	// handleScorePoint(client: Socket, { winner }: { winner: string }) {
	// 	if (this.players.has(client.id)) {
	// 		this.gameState.scores[winner]++;
	// 		this.server.emit('scoreUpdate', this.gameState.scores);
	// 	}
	// 	if (this.gameState.scores[winner] >= 5) {
	// 		this.server.emit('gameOver', winner);
	// 	}
	// }

	@SubscribeMessage('ball_update_from_client') // If ball is client-authoritative for a player
	handleBallUpdate(
		@ConnectedSocket() client: Socket,
		@MessageBody()
		data: { matchId: string; x: number; y: number; vx: number; vy: number },
	) {
		const room = this.gameRooms.get(data.matchId);
		const player = room?.players.get(client.id);
		if (room && player && player.role === 'player1') {
			room.gameState.ball = {
				x: data.x,
				y: data.y,
				vx: data.vx,
				vy: data.vy,
			};
			// Emit to other players in the room
			client.to(data.matchId).emit('ball_update', {
				// client.to sends to others in room
				matchId: data.matchId,
				ball: room.gameState.ball,
			});
		}
	}

	// @SubscribeMessage('ballUpdate')
	// handleBallUpdate(
	// 	client: Socket,
	// 	{ x, y, vx, vy }: GameInterface.GameState['ball'],
	// ) {
	// 	this.gameState.ball = { x, y, vx, vy };
	// 	this.server.emit('ballUpdate', this.gameState.ball);
	// }

	//#endregion
}
