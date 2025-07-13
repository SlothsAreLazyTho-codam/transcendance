import {
	DrizzleAsyncProvider,
	DrizzleProvider,
} from '@/database/drizzle.provider';
import { Module, OnModuleInit } from '@nestjs/common';
import { runMigrations } from './drizzle.migrate';
import { seedDatabase } from './drizzle.seed';

@Module({
	providers: [DrizzleProvider],
	exports: [DrizzleAsyncProvider],
})
export class DrizzleModule implements OnModuleInit {
	async onModuleInit() {
		await runMigrations();

		// Add seed data after migrations
		if (process.env.NODE_ENV === 'development') {
			// await seedDatabase();
		}
	}
}
