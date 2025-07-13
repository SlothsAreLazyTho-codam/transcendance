import { ApiProperty } from '@nestjs/swagger';

export class DMChannel {
	@ApiProperty({ example: 42 })
	user1Id: number;

	@ApiProperty({ example: 57 })
	user2Id: number;

	user1?: {
		id: number;
		blockedUsers: any[];
		blockedBy: any[];
		// other user properties
	};

	user2?: {
		id: number;
		blockedUsers: any[];
		blockedBy: any[];
		// other user properties
	};

	messages?: {
		id: number;
		content: string;
		// other message properties
	}[];
}
