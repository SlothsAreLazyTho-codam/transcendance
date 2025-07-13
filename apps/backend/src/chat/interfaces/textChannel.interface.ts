import { ApiProperty } from '@nestjs/swagger';

export class TextChannel {
	@ApiProperty({ example: 1 })
	id: number;

	@ApiProperty({ example: 'General' })
	name: string;

	@ApiProperty({ example: 'PUBLIC' })
	type: string;

	@ApiProperty({ example: 'Welkom01!' })
	password: string | null;

	@ApiProperty({ example: '14160' })
	ownerId: number;
	members?: {
		user: {
			id: number;
			// other user properties
		};
	}[];
	bannedMembers?: {
		user: {
			id: number;
			// other user properties
		};
	}[];
	mutedMembers?: {
		user: {
			id: number;
			// other user properties
		};
	}[];
	messages?: {
		id: number;
		content: string;
		// other message properties
	}[];
}
