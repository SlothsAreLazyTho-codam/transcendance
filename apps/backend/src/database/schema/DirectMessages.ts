import {
	foreignKey,
	integer,
	pgTable,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { Users } from './Users';
import { DirectMessageChannels } from './DirectMessageChannels';
import { relations } from 'drizzle-orm';

export const DirectMessages = pgTable(
	'direct_messages',
	{
		id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
		content: text('content').notNull(),
		senderId: integer('sender_id')
			.references(() => Users.id, { onDelete: 'cascade' })
			.notNull(),
		dmUser1Id: integer('dm_user1_id').notNull(),
		dmUser2Id: integer('dm_user2_id').notNull(),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => [
		foreignKey({
			name: 'fk_direct_message_channel',
			columns: [table.dmUser1Id, table.dmUser2Id],
			foreignColumns: [
				DirectMessageChannels.user1Id,
				DirectMessageChannels.user2Id,
			],
		}).onDelete('cascade'),
	],
);

export const DirectMessagesRelations = relations(DirectMessages, ({ one }) => ({
	sender: one(Users, {
		fields: [DirectMessages.senderId],
		references: [Users.id],
	}),
	channel: one(DirectMessageChannels, {
		fields: [DirectMessages.dmUser1Id, DirectMessages.dmUser2Id],
		references: [
			DirectMessageChannels.user1Id,
			DirectMessageChannels.user2Id,
		],
	}),
}));
