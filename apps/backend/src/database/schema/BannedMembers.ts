import {
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { Users } from './Users';
import { Channels } from './Channels';

export const BannedMembers = pgTable(
	'banned_members',
	{
		channelId: integer('channel_id')
			.references(() => Channels.id, { onDelete: 'cascade' })
			.notNull(),
		bannedUserId: integer('banned_user_id')
			.references(() => Users.id, { onDelete: 'cascade' })
			.notNull(),
		reason: text('reason'),
		expiresAt: timestamp('expires_at'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.channelId, table.bannedUserId] })],
);

export const bannedMembersRelations = relations(BannedMembers, ({ one }) => ({
	channel: one(Channels, {
		fields: [BannedMembers.channelId],
		references: [Channels.id],
	}),
	user: one(Users, {
		fields: [BannedMembers.bannedUserId],
		references: [Users.id],
	}),
}));
