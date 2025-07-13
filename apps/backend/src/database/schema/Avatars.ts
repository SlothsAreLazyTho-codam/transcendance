import {
	pgTable,
	serial,
	integer,
	varchar,
	timestamp,
	customType,
} from 'drizzle-orm/pg-core';
import { Users } from './Users';
import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';

// Define a custom bytea type
const bytea = customType<{
	data: Buffer;
	notNull: true;
}>({
	dataType() {
		return 'bytea';
	},
});

export const Avatars = pgTable('avatars', {
	id: serial('id').primaryKey(),
	userId: integer('user_id')
		.references(() => Users.id, { onDelete: 'cascade' })
		.notNull(),
	filename: varchar('filename', { length: 255 }),
	data: bytea('data').notNull(),
	mimeType: varchar('mime_type', { length: 50 }).notNull(),
	createdAt: timestamp('created_at').defaultNow(),
});

// Avatar relations
export const AvatarsRelations = relations(Avatars, ({ one }) => ({
	user: one(Users, {
		fields: [Avatars.userId],
		references: [Users.id],
	}),
}));

// Define the types for Avatars
export type Avatar = InferSelectModel<typeof Avatars>;
export type NewAvatar = InferInsertModel<typeof Avatars>;
