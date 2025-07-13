import { integer, pgTable, text, timestamp } from 'drizzle-orm/pg-core';
import { Users } from './Users';
import { Channels } from './Channels';
import { InferSelectModel, relations } from 'drizzle-orm';

export type ChannelMessage = InferSelectModel<typeof ChannelMessages>;

export const ChannelMessages = pgTable('channel_messages', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	content: text('content').notNull(),
	senderId: integer('sender_id')
		.references(() => Users.id, { onDelete: 'cascade' })
		.notNull(),
	channelId: integer('channel_id').references(() => Channels.id, {
		onDelete: 'cascade',
	}),
	createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const channelMessageRelations = relations(
	ChannelMessages,
	({ one }) => ({
		sender: one(Users, {
			fields: [ChannelMessages.senderId],
			references: [Users.id],
		}),
		channel: one(Channels, {
			fields: [ChannelMessages.channelId],
			references: [Channels.id],
		}),
	}),
);
