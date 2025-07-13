import { Controller, Get, Inject } from '@nestjs/common';
import { UserService } from '@/users/user.service';
import { sql } from 'drizzle-orm';
import { Users } from '../database/schema/Users';
import { Matches } from '../database/schema/Matches';
import { DrizzleAsyncProvider } from '@/database/drizzle.provider';
import { schema } from '@/database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { LeaderboardEntry } from './interfaces/LeaderboardEntry';

@Controller('/leaderboard')
export class LeaderboardController {
	constructor(
		@Inject(DrizzleAsyncProvider)
		private readonly db: NodePgDatabase<typeof schema>,
		private readonly userService: UserService,
	) {}

	@Get()
	async getLeaderboard(): Promise<LeaderboardEntry[]> {
		// raw sql for efficiency (1 query vs 1 + n queries)
		const leaderboardStats = await this.db
			.select({
				userId: Users.id,
				username: Users.username,
				matchesWon: sql<number>`count(DISTINCT CASE 
					WHEN ${Matches.winnerId} = ${Users.id} 
					THEN ${Matches.id} END
				)`,
				matchesLost: sql<number>`count(DISTINCT CASE
					WHEN ${Matches.loserId} = ${Users.id} 
					THEN ${Matches.id} END
				)`,
			})
			.from(Users)
			.leftJoin(
				Matches,
				sql`${Matches.winnerId} = ${Users.id} OR ${Matches.loserId} = ${Users.id}`,
			)
			.groupBy(Users.id, Users.username);

		// const leaderboardStats1 = await this.db.query.Users.findMany({
		// 	with: {
		// 		wonMatches: true,
		// 		lostMatches: true,
		// 	},
		// 	columns: {
		// 		id: true,
		// 		username: true,
		// 	},
		// }).then((users) =>
		// 	users.map((user) => ({
		// 		userId: user.id,
		// 		username: user.username,
		// 		matchesWon: user.wonMatches.length,
		// 		matchesLost: user.lostMatches.length,
		// 	})),
		// );

		// Transform and sort the results
		const leaderboard: LeaderboardEntry[] = leaderboardStats
			.map((stats) => ({
				position: 0, //set after sorting
				userId: stats.userId,
				username: stats.username ?? 'Unknown',
				matchesWon: Number(stats.matchesWon),
				matchesLost: Number(stats.matchesLost),
				winRate:
					stats.matchesWon + stats.matchesLost > 0
						? (Number(stats.matchesWon) /
								(Number(stats.matchesWon) +
									Number(stats.matchesLost))) *
							100
						: 0,
			}))
			.sort((a, b) => {
				// Sort by win rate first, then by total matches won
				if (b.winRate !== a.winRate) {
					return b.winRate - a.winRate;
				}
				return b.matchesWon - a.matchesWon;
			})
			.map((entry, index) => ({
				...entry,
				position: index + 1,
				winRate: Math.round(entry.winRate * 100) / 100, // Round to 2 decimal places
			}));

		return leaderboard;
	}
}
