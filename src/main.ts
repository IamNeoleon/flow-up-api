import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.setGlobalPrefix('api');

	app.use(cookieParser());

	app.enableCors({
		origin: [
			'http://localhost:5173',
			'http://localhost:4173',
			'https://flow-up-web.vercel.app'
		],
		methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
		credentials: true,
	});

	app.useGlobalPipes(
		new ValidationPipe({
			whitelist: true,
			forbidNonWhitelisted: true,
			transform: true,
		}),
	);

	const port = Number(process.env.PORT) || 10000;
	await app.listen(port, '0.0.0.0');
}
bootstrap();