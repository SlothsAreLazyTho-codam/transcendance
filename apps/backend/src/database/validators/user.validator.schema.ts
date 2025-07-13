import { z } from 'zod';
import {
	createInsertSchema,
	createSelectSchema,
	createUpdateSchema,
} from 'drizzle-zod';
import { Users } from '../schema';

// Select schema
const UserSelectSchema = createSelectSchema(Users);

// Insert schema
const UserInsertSchema = createInsertSchema(Users).extend({
	fortytwoId: z.number().int().positive({
		message: '42 ID must be a positive integer',
	}),
});

// Update schema
const UserUpdateSchema = createUpdateSchema(Users);

// Custom Update schema - dont export this, this is just an example
// const CustomUpdateSchemaExample = createUpdateSchema(Users).extend({
// 	// Add new fields or override existing ones
// 	email: z.string().email().optional(),
// 	password: z.string().min(8).optional(),

// 	// Add custom fields
// 	roleUpdate: z.enum(['admin', 'user']).optional(),
// 	age: z
// 		.number()
// 		.refine((age) => age >= 18, {
// 			message: 'You must be at least 18 years old',
// 		})
// 		.refine((age) => age <= 110, {
// 			message: 'You must be at most 110 years old',
// 		})
// 		.optional(),

// 	// Add custom validation
// 	metadata: z
// 		.object({
// 			lastUpdated: z.date(),
// 			updatedBy: z.string(),
// 		})
// 		.optional(),
// });

export type UserSelect = z.infer<typeof UserSelectSchema>;
export type UserInput = z.infer<typeof UserInsertSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;

// Export all
export const UserSchemas = {
	select: UserSelectSchema,
	insert: UserInsertSchema,
	update: UserUpdateSchema,
};
