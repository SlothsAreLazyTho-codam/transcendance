import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import {
	ApiTags,
	ApiOperation,
	ApiBearerAuth,
	ApiResponse,
} from '@nestjs/swagger';
import { Public } from './auth/decorators/public.decorator';

@ApiTags('App')
@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Public()
	@Get('health')
	@ApiResponse({ status: 200, description: 'Success' })
	@ApiOperation({ summary: 'Healthcheck' })
	getHealthcheck(): string {
		return this.appService.getHello();
	}
}
