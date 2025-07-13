import { pgEnum } from 'drizzle-orm/pg-core';

export const UserStatus = pgEnum('user_status', [
	'OFFLINE',
	'ONLINE',
	'INGAME',
]);

export type UserStatusType = (typeof UserStatus.enumValues)[number];
