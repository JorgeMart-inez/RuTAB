import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common'; // 1. Importa esto
import { AppModule } from 'app.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/'
  });

  // 1. Confirmación de zona horaria (útil para debug en producción)
  console.log(
    `🌍 Zona horaria del servidor: ${process.env.TZ || 'No definida (usando sistema)'}`,
  );
  console.log(`⏰ Hora actual del servidor: ${new Date().toISOString()}`);

  // 2. Agrega esta configuración de validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Remueve campos que no estén en el DTO
      forbidNonWhitelisted: true, // Lanza error si mandan campos de más
      transform: true, // Convierte tipos (ej: string a number) automáticamente
      transformOptions: {
        enableImplicitConversion: true, // Ayuda con las conversiones automáticas
      },
    }),
  );

  app.enableCors({
    origin: process.env.FRONTEND_URL || '*', // En producción tomará la variable, en local permitirá todo
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  await app.listen(3000);
  console.log(`Backend corriendo en: http://localhost:3000`);
}
bootstrap();
