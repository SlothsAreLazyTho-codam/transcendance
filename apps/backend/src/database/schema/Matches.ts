import { integer, pgTable, serial, timestamp } from 'drizzle-orm/pg-core';
import { Users } from './Users';
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';

export type Match = InferSelectModel<typeof Matches>;
export type NewMatch = InferInsertModel<typeof Matches>;

export const Matches = pgTable('matches', {
	id: serial('id').primaryKey(),
	winnerId: integer('winner_id')
		.notNull()
		.references(() => Users.id),
	winnerScore: integer('winner_score').notNull(),
	loserId: integer('loser_id')
		.notNull()
		.references(() => Users.id),
	loserScore: integer('loser_score').notNull(),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
		.notNull()
		.defaultNow(),
});

export const MatchesRelations = relations(Matches, ({ one }) => ({
	winner: one(Users, {
		fields: [Matches.winnerId],
		references: [Users.id],
	}),
	loser: one(Users, {
		fields: [Matches.loserId],
		references: [Users.id],
	}),
}));
