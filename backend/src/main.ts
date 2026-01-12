import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // ✅ Validación global con seguridad
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,              // Elimina propiedades no definidas en DTO
      forbidNonWhitelisted: true,    // Lanza error si hay propiedades extra
      transform: true,               // Transforma tipos automáticamente
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const origins = configService.get<string>('CORS_ORIGINS')?.split(',') || ['http://localhost:5173'];

  // CORS
  app.enableCors({
    origin: origins,
    credentials: true,
  });

  // Global prefix for all routes
  app.setGlobalPrefix('api');

  const port = configService.get<number>('PORT') || 3000;
  await app.listen(port);

  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(`API prefix: /api`);
  logger.log(`CORS Origins: ${origins.join(', ')}`);
}
bootstrap();
