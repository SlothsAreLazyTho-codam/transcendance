import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';

import { schema } from './schema';

export const DrizzleAsyncProvider = 'DrizzleAsyncProvider';

export const DrizzleProvider = {
	provide: DrizzleAsyncProvider,
	inject: [ConfigService],
	useFactory: async (config: ConfigService) => {
		const pool = new Pool({
			host: config.get('DB_HOSTNAME'),
			user: config.get('DB_USERNAME'),
			password: config.get('DB_PASSWORD'),
			database: config.get('DB_DATABASE'),
			port: config.get('DB_PORT'),
			ssl: false,
		});

		return drizzle(pool, { schema });
	},
};
