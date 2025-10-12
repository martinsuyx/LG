import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log'],
  });

  const config = app.get(ConfigService);
  const prisma = app.get(PrismaService);
  await prisma.enableShutdownHooks(app);

  const port = config.get<number>('PORT') ?? 3000;
  const host = config.get<string>('HOST') ?? '0.0.0.0';

  await app.listen(port, host);
  const url = await app.getUrl();
  console.log(`API server listening on ${url}`);
}

bootstrap().catch((error) => {
  console.error('Failed to bootstrap Nest application', error);
  process.exitCode = 1;
});
