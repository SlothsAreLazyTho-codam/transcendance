import 'dotenv/config';
import * as dotenv from 'dotenv';
import { Config } from 'drizzle-kit';

dotenv.config();

export default {
	schema: './src/database/schema',
	out: './src/database/migrations',
	dialect: 'postgresql',
	dbCredentials: {
		host: process.env.DB_HOSTNAME ?? 'localhost',
		user: process.env.DB_USERNAME ?? 'postgres',
		password: process.env.DB_PASSWORD ?? 'postgres',
		database: process.env.DB_DATABASE ?? 'postgres',
		port: parseInt(process.env.DB_PORT ?? '5432'),
		ssl: false,
	},
} satisfies Config;
