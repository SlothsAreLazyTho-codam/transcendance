import { Socket } from 'socket.io';
import { GameMode } from '@/gameserver/game.interface';

export interface QueuedPlayer {
	userId: number;
	username: string;
	socket?: Socket;
	joinedAt: number;
}

export interface JoinQueueRequest {
	gameMode: GameMode;
}

export interface QueueResponse {
	status: 'OK' | 'ERROR';
	message?: string; // Optional message for error or success
}

// Extended response for join queue operations
export interface JoinQueueResponse extends QueueResponse {
	gameMode?: GameMode;
	time?: number; // Time when the player joined the queue
	pos?: number; // Position in queue
}

// Request for leaving the queue
export interface LeaveQueueRequest {
	gameMode: GameMode;
}

// Leave queue response should use base QueueResponse
// why? because it doesn't need to be extended

export interface MatchFoundPayload {
	gameMode: GameMode;
	matchId: string;
	players: Array<{ userId: number; username: string }>;
	acceptTimeoutInSeconds: number; // information for frontend to show a countdown
	status: string;
}

// when user accepts the match
export interface AcceptMatchPayload {
	matchId: string;
	gameMode: GameMode;
	status: string;
	// You can add more details here, like a game server endpoint if applicable
}

export interface CancelMatchPayload {
	matchId: string;
	status: string;
	reason: string;
}

export interface PendingMatchPayload {
	players: QueuedPlayer[];
	acceptedPlayers: Set<number>;
	timeoutId: NodeJS.Timeout;
	gameMode: GameMode;
	status: string;
}

export interface StartMatchPayload {
	matchId: string;
	gameMode: GameMode;
	players: QueuedPlayer[];
	status: string;
	// You can add more details here, like a game server endpoint if applicable
}
