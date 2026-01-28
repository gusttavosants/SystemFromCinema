import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Enable API versioning
  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'api/v',
  });

  // Configure Swagger
  const config = new DocumentBuilder()
    .setTitle('Cinema Booking API')
    .setDescription('API for cinema seat reservations and payments')
    .setVersion('1.0')
    .addTag('sessions', 'Session management endpoints')
    .addTag('reservations', 'Reservation management endpoints')
    .addTag('payments', 'Payment processing endpoints')
    .addTag('users', 'User-related endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  await app.listen(process.env.PORT ?? 3000);
  console.log('🚀 Application started successfully!');
  console.log(
    '📚 Swagger documentation available at: http://localhost:3000/api-docs',
  );
}

bootstrap().catch((error: Error) => {
  console.error('Failed to start application:', error);
  process.exit(1);
});
