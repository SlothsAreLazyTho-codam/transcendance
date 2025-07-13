import {
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { Users } from './Users';
import { Channels } from './Channels';
import { relations } from 'drizzle-orm';

export const MutedMembers = pgTable(
	'muted_members',
	{
		channelId: integer('channel_id')
			.references(() => Channels.id, { onDelete: 'cascade' })
			.notNull(),
		mutedUserId: integer('muted_user_id')
			.references(() => Users.id, { onDelete: 'cascade' })
			.notNull(),
		reason: text('reason'),
		expiresAt: timestamp('expires_at'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.channelId, table.mutedUserId] })],
);

export const MutedMembersRelations = relations(MutedMembers, ({ one }) => ({
	channel: one(Channels, {
		fields: [MutedMembers.channelId],
		references: [Channels.id],
	}),
	user: one(Users, {
		fields: [MutedMembers.mutedUserId],
		references: [Users.id],
	}),
}));
