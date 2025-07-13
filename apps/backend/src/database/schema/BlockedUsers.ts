import {
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { Users } from './Users';
import { relations } from 'drizzle-orm';

export const BlockedUsers = pgTable(
	'blocked_users',
	{
		userId: integer('user_id')
			.references(() => Users.id, { onDelete: 'cascade' })
			.notNull(),
		blockedId: integer('blocked_id')
			.references(() => Users.id, { onDelete: 'cascade' })
			.notNull(),
		reason: text('reason'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.blockedId] })],
);

export const BlockedUsersRelations = relations(BlockedUsers, ({ one }) => ({
	blocker: one(Users, {
		fields: [BlockedUsers.userId],
		references: [Users.id],
		relationName: 'userBlocks',
	}),
	blocked: one(Users, {
		fields: [BlockedUsers.blockedId],
		references: [Users.id],
		relationName: 'userBlockedBy',
	}),
}));
