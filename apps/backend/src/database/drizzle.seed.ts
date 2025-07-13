import { drizzle } from 'drizzle-orm/node-postgres';
import { seed, reset } from 'drizzle-seed';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import { join } from 'path';

import { schema, Users } from './schema';
import { userSeeds } from './seeders';
import { UserSchemas } from './validators/user.validator.schema';

// Load env variables when running standalone
const projectRoot = join(__dirname, '../../../');
dotenv.config({
	path: join(projectRoot, '.env'),
});

export async function seedDatabase() {
	const pool = new Pool({
		host: process.env.DB_HOSTNAME,
		user: process.env.DB_USERNAME,
		password: process.env.DB_PASSWORD,
		database: process.env.DB_DATABASE,
		port: parseInt(process.env.DB_PORT ?? '5432'),
		ssl: false,
		max: 1,
	});
	const seedClient = await pool.connect();
	const db = drizzle(seedClient);

	try {
		// // First reset (clear) all tables
		await reset(db, schema);
		// Check if database is already seeded
		const existingUsers = await db.select().from(Users);

		if (existingUsers.length === 0) {
			console.log('🌱 Starting database seeding...');

			// Validate seed data with Zod
			const InsertSchema = UserSchemas.insert;

			const validatedUsers = userSeeds
				.map((user) => {
					const result = InsertSchema.safeParse(user);
					if (!result.success) {
						console.error(`❌ Skipping invalid user:`, {
							user,
							errors: result.error.format(),
						});
						return null; // Skip invalid entries
					}
					return result.data; // Return validated user
				})
				.filter((user): user is (typeof userSeeds)[0] => user !== null); // Filter out nulls

			// Insert Custom Seed Data
			await db.insert(Users).values(validatedUsers).onConflictDoNothing(); //ingore the eslint warning

			// Seed database with random data
			// await seed(db, schema); // currently not working due to issues with identity columns
			await seed(db, schema).refine((f) => ({
				Users: {
					columns: {
						id: f.int({
							isUnique: true,
							minValue: 0,
							maxValue: 20000,
						}),
						fortytwoId: f.int({
							minValue: 0,
							maxValue: 20000,
							isUnique: true,
						}),
					},
				},
			}));

			console.log('✅ Database seeded successfully');
		} else {
			console.log('ℹ️ Database already contains data, skipping seed');
		}
	} catch (error) {
		console.error('❌ Error seeding database:', error);
		throw error;
	} finally {
		seedClient.release();
		await pool.end();
	}
}

// Allow running seeder directly
if (require.main === module) {
	seedDatabase()
		.then(() => process.exit(0))
		.catch((error) => {
			console.error('Failed to seed database:', error);
			process.exit(1);
		});
}
