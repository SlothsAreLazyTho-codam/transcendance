export enum GameMode {
	CLASSIC = 'pong_1v1',
	MODIFIED = 'bong_1v1',
}

export interface GameState {
	ball: { x: number; y: number; vx: number; vy: number };
	paddles: { player1: { y: number }; player2: { y: number } };
	scores: { player1: number; player2: number };
}

export interface Player {
	id: string; // Corresponds to User ID from auth
	socketId: string;
	username: string;
	role?: 'player1' | 'player2' | 'spectator'; // Example roles
}

export interface GameRoom {
	matchId: string;
	gameMode: GameMode;
	players: Map<string, Player>; // Map socketId to Player object
	gameState: GameState;
	playerRolesAssigned: number; // To track if player1 and player2 are assigned
	createdAt: number; // Timestamp when the game room was created
}
