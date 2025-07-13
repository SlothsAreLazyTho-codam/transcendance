import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
	getHello(): string {
		console.log("Health check request made from frontend")
		return 'OK';
	}
}
