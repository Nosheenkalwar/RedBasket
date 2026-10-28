import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { AppModule } from './app.module';
import { ErrorFilter } from './common/error.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.setGlobalPrefix('api');
  app.enableCors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' });
  // whitelist drops any field that is not in the DTO, so clients cannot set things like role or isActive by surprise
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
  app.useGlobalFilters(new ErrorFilter());
  app.useStaticAssets(join(process.cwd(), 'uploads'), { prefix: '/uploads' });
  const port = Number(process.env.PORT) || 3000;
  await app.listen(port);
  console.log(`RedBasket API running on http://localhost:${port}/api`);
}
bootstrap();
