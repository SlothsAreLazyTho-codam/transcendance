import { ApiProperty } from '@nestjs/swagger';

export class MockLoginDto {
	@ApiProperty({
		example: 'testuser',
		description: 'The username to login with',
	})
	username!: string;
}
