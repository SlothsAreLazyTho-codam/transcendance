export class NewMatchDto {
	winnerId: number;
	winnerScore: number;
	loserId: number;
	loserScore: number;
}

export class MatchDto extends NewMatchDto {
	id: number;
	createdAt: Date;
}
// comented out for now as the Drizzle type should already be correct
// export class MatchResponseDto {
// 	id: number;
// 	winnerId: number;
// 	winnerScore: number;
// 	loserId: number;
// 	loserScore: number;
// 	createdAt: string; // Consider using Date instead of string
// 	winner: {
// 		id: number;
// 		name: string;
// 	};
// 	loser: {
// 		id: number;
// 		name: string;
// 	};
// }
