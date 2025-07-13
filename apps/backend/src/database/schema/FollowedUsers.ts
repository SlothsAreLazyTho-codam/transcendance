import {
	integer,
	pgTable,
	primaryKey,
	text,
	timestamp,
} from 'drizzle-orm/pg-core';
import { Users } from './Users';
import { relations } from 'drizzle-orm';

export const FollowedUsers = pgTable(
	'followed_users',
	{
		userId: integer('user_id')
			.references(() => Users.id, { onDelete: 'cascade' })
			.notNull(),
		followingId: integer('following_id')
			.references(() => Users.id, { onDelete: 'cascade' })
			.notNull(),
		reason: text('reason'),
		createdAt: timestamp('created_at').notNull().defaultNow(),
	},
	(table) => [primaryKey({ columns: [table.userId, table.followingId] })],
);

export const FollowedUsersRelations = relations(FollowedUsers, ({ one }) => ({
	follower: one(Users, {
		fields: [FollowedUsers.userId],
		references: [Users.id],
		relationName: 'userFollows',
	}),
	following: one(Users, {
		fields: [FollowedUsers.followingId],
		references: [Users.id],
		relationName: 'userFollowedBy',
	}),
}));
