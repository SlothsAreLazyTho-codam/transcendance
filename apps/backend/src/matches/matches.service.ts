import { Inject, Injectable } from '@nestjs/common';
import { schema, Match, NewMatch } from '@/database/schema';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
import { DrizzleAsyncProvider } from '@/database/drizzle.provider';
import { eq } from 'drizzle-orm';

@Injectable()
export class MatchesService {
	constructor(
		@Inject(DrizzleAsyncProvider)
		private readonly db: NodePgDatabase<typeof schema>,
	) {}

	async create(matchData: NewMatch): Promise<Match> {
		const [match] = await this.db
			.insert(schema.Matches)
			.values(matchData)
			.returning();

		return match;
	}

	async getAll(): Promise<Match[]> {
		const matches = await this.db.query.Matches.findMany({
			with: {
				winner: true,
				loser: true,
			},
			orderBy: (matches, { desc }) => [desc(matches.createdAt)],
		});

		return matches ?? [];
	}

	async getById(id: number): Promise<Match | undefined> {
		const match = await this.db.query.Matches.findFirst({
			where: (matches, { eq }) => eq(matches.id, id),
			with: {
				winner: true,
				loser: true,
			},
		});

		return match;
	}

	async getByUserId(userId: number): Promise<Match[]> {
		const matches = await this.db.query.Matches.findMany({
			where: (matches, { or, eq }) =>
				or(eq(matches.winnerId, userId), eq(matches.loserId, userId)),
			with: {
				winner: true,
				loser: true,
			},
			orderBy: (matches, { desc }) => [desc(matches.createdAt)],
		});

		return matches ?? [];
	}

	async remove(id: number): Promise<Match[]> {
		return await this.db
			.delete(schema.Matches)
			.where(eq(schema.Matches.id, id))
			.returning();
	}
}
