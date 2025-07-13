import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

// Load env variables when running standalone
const projectRoot = join(__dirname, '../../../../');
dotenv.config({
	path: join(projectRoot, '.env'),
});

export async function runMigrations() {
	const pool = new Pool({
		host: process.env.DB_HOSTNAME,
		user: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		port: parseInt(process.env.DB_PORT ?? '5432'),
		ssl: false,
		max: 1,
	});
	const migrationClient = await pool.connect();
	const db = drizzle(migrationClient);

	try {
		console.log('🔄 Running migrations...');
		await migrate(db, {
			migrationsFolder: './src/database/migrations',
		});
		console.log('✅ Migrations completed');
	} catch (error: unknown) {
		console.error('❌ Error running migrations:', error);
		// Log more details about the error
		if (error && typeof error === 'object' && 'code' in error) {
			console.error('Error code:', (error as { code: unknown }).code);
			console.error(
				'Error detail:',
				(error as unknown as { detail: unknown }).detail,
			);
		}
		process.exit(1);
	} finally {
		migrationClient.release();
		await pool.end();
	}
}

// Run migrations if file is executed directly
if (require.main === module) {
	runMigrations()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error('Failed to seed database:', error);
			process.exit(1);
		});
}
