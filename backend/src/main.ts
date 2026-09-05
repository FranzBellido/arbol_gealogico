import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import * as express from 'express';
import * as fs from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Ensure uploads directory exists
  const uploadsDir = join(__dirname, '..', 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Serve static files
  app.use('/uploads', express.static(uploadsDir));

  // Enable CORS — restrict to FRONTEND_URL(s) in production, allow all in dev
  const frontendUrlStr = process.env.FRONTEND_URL;
  let origin: string | string[] = '*';
  if (frontendUrlStr) {
    origin = frontendUrlStr.split(',').map(url => url.trim());
  }

  app.enableCors({
    origin: origin,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useGlobalPipes(new ValidationPipe({ transform: true }));

  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  // Bind to 0.0.0.0 — required for Railway and container environments
  await app.listen(port, '0.0.0.0');
  console.log(`Application is running on port ${port}`);
}
bootstrap();
