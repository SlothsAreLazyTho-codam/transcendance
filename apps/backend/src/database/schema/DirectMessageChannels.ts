import { pgTable, integer, timestamp, primaryKey } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { Users } from './Users';
import { DirectMessages } from './DirectMessages';

export const DirectMessageChannels = pgTable(
	'direct_message_channels',
	{
		user1Id: integer('user1_id')
			.notNull()
			.references(() => Users.id, { onDelete: 'cascade' }),
		user2Id: integer('user2_id')
			.notNull()
			.references(() => Users.id, { onDelete: 'cascade' }),
		createdAt: timestamp('created_at', {
			withTimezone: true,
			mode: 'string',
		})
			.notNull()
			.defaultNow(),
		updatedAt: timestamp('updated_at', {
			withTimezone: true,
			mode: 'string',
		})
			.notNull()
			.defaultNow()
			.$onUpdate(() => sql`now()`),
	},
	(table) => [primaryKey({ columns: [table.user1Id, table.user2Id] })],
);

export const DirectMessageChannelsRelations = relations(
	DirectMessageChannels,
	({ one, many }) => ({
		user1: one(Users, {
			fields: [DirectMessageChannels.user1Id],
			references: [Users.id],
		}),
		user2: one(Users, {
			fields: [DirectMessageChannels.user2Id],
			references: [Users.id],
		}),
		messages: many(DirectMessages),
	}),
);
