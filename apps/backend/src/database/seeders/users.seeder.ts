import { NewUser } from '../schema/Users';

export const userSeeds: NewUser[] = [
	{
		username: 'testuser', // matches schema's 'username'
		fortytwoId: 12345, // corrected from fortytwo_id
		// signupCompleted: true, // corrected from signup_completed
	},
	{
		username: 'mockUser', // corrected from name
		fortytwoId: 42, // corrected from fortytwoid
		// signupCompleted: true, // corrected from signup_completed
	},
];
