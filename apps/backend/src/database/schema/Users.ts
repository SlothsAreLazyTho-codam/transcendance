import {
	type InferSelectModel,
	type InferInsertModel,
	sql,
	relations,
} from 'drizzle-orm';
import {
	pgTable,
	integer,
	varchar,
	timestamp,
	boolean,
} from 'drizzle-orm/pg-core';
import { UserStatus } from '@/database/enums/users.status';
import { BlockedUsers } from './BlockedUsers';
import { BannedMembers } from './BannedMembers';
import { MutedMembers } from './MutedMembers';
import { ChannelMembers } from './ChannelMembers';
import { DirectMessageChannels } from './DirectMessageChannels';
import { Avatars } from './Avatars';
import { Matches } from './Matches';
import { FollowedUsers } from './FollowedUsers';

// use for database operations
export type User = InferSelectModel<typeof Users>;

// TODO Notice: Drizzle-ORM has a bug where it doesn't infer the correct type fpr the inferInsertModel, it is missing the optional fields
// So we have to define the type manually
// Internal use for database operations
export type NewUser = InferInsertModel<typeof Users>;

export const Users = pgTable('users', {
	id: integer('id').primaryKey().generatedAlwaysAsIdentity(),
	username: varchar('name', { length: 255 }),
	fortytwoId: integer('fortytwo_id').notNull(),
	status: UserStatus('status').default('OFFLINE').notNull(),
	// signupCompleted: boolean('signup_completed').default(false).notNull(),
	otp: varchar('otp', { length: 255 }),
	createdAt: timestamp('created_at', { withTimezone: true, mode: 'string' })
		.notNull()
		.defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'string' })
		.notNull()
		.defaultNow()
		.$onUpdate(() => sql`now()`),
});

export const UsersRelations = relations(Users, ({ many, one }) => ({
	avatar: one(Avatars, {
		fields: [Users.id],
		references: [Avatars.userId],
	}),
	blockedUsers: many(BlockedUsers, {
		relationName: 'userBlocks',
	}),
	blockedBy: many(BlockedUsers, {
		relationName: 'userBlockedBy',
	}),
	followedUsers: many(FollowedUsers, {
		relationName: 'userFollows',
	}),
	followedBy: many(FollowedUsers, {
		relationName: 'userFollowedBy',
	}),
	channels: many(ChannelMembers),
	channelBans: many(BannedMembers),
	channelMutes: many(MutedMembers),
	directMessageChannels: many(DirectMessageChannels, {
		relationName: 'userDirectMessages',
	}),
	// matches: many(Matches),
	wonMatches: many(Matches, {
		relationName: 'winner',
	}),
	lostMatches: many(Matches, {
		relationName: 'loser',
	}),
}));
