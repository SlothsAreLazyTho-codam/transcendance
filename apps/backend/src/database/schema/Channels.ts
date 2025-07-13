import {
	pgTable,
	varchar,
	text,
	integer,
	timestamp,
} from 'drizzle-orm/pg-core';
import { Users } from './Users';
import { relations, sql } from 'drizzle-orm';
import { ChannelMembers } from './ChannelMembers';
import { ChannelMessages } from './ChannelMessages';
import { MutedMembers } from './MutedMembers';
import { BannedMembers } from './BannedMembers';

export const Channels = pgTable('channels', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	name: varchar('name', { length: 255 }).notNull(),
	type: varchar('type', { length: 20 }).notNull(), // PUBLIC, PRIVATE
	password: text('password'), // Optional for non-protected channels //hash
	ownerId: integer('owner_id')
		.notNull()
		.references(() => Users.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
		.notNull()
		.defaultNow()
		.$onUpdate(() => sql`now()`),
});

export const channelsRelations = relations(Channels, ({ many }) => ({
	members: many(ChannelMembers),
	bannedMembers: many(BannedMembers),
	mutedMembers: many(MutedMembers),
	messages: many(ChannelMessages),
}));
