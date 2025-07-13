import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	// Globals:
	app.setGlobalPrefix('api/v1', {
		exclude: ['ws/v*/**'],
	});

	app.enableCors({
		origin: [
			'https://localhost:8080',
			'http://localhost:8080',
			'http://frontend:3000',
			'http://backend:3001',
			'https://thor.home:8080',
			'https://thor.home',
			'ws://localhost:8080',
			'wss://localhost:8080',
			'ws://thor.home:8080',
			'wss://thor.home:8080',
		],
		credentials: true,
	});

	// Swagger:
	if (process.env.NODE_ENV !== 'production') {
		// possibly remove for evaluation so that the swagger docs are always available
		const swaggerConfig = new DocumentBuilder()
			.setTitle('Transcendence API')
			.setDescription('The Transcendence API description')
			.setVersion('1.0')
			.addBearerAuth()
			.build();

		const document = SwaggerModule.createDocument(app, swaggerConfig);
		SwaggerModule.setup('docs', app, document, {
			customCss: readFileSync('./swagger/swagger-dark.css', 'utf-8'),
		});
	}
	await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
