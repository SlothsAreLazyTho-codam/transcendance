import { boolean, integer, pgTable, timestamp } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';
import { Channels } from './Channels';
import { Users } from './Users';
import { MutedMembers } from './MutedMembers';
import { BannedMembers } from './BannedMembers';

export const ChannelMembers = pgTable('channel_members', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	userId: integer('user_id')
		.references(() => Users.id, { onDelete: 'cascade' })
		.notNull(),
	channelId: integer('channel_id')
		.references(() => Channels.id, { onDelete: 'cascade' })
		.notNull(),
	isAdmin: boolean('is_admin').default(false).notNull(),
	joinedAt: timestamp('joined_at').notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
		.notNull()
		.defaultNow()
		.$onUpdate(() => sql`now()`),
});

export const channelMemberRelations = relations(ChannelMembers, ({ one }) => ({
	user: one(Users, {
		fields: [ChannelMembers.userId],
		references: [Users.id],
	}),
	channel: one(Channels, {
		fields: [ChannelMembers.channelId],
		references: [Channels.id],
	}),
	mutedStatus: one(MutedMembers, {
		fields: [ChannelMembers.channelId, ChannelMembers.userId],
		references: [MutedMembers.channelId, MutedMembers.mutedUserId],
	}),
	bannedStatus: one(BannedMembers, {
		fields: [ChannelMembers.channelId, ChannelMembers.userId],
		references: [BannedMembers.channelId, BannedMembers.bannedUserId],
	}),
}));
