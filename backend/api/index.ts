import 'reflect-metadata';
import express, { type Express, type Request, type Response } from 'express';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/shared/config/app-setup';

/**
 * Entrypoint serverless do backend NestJS na Vercel (spec §4.1).
 *
 * A instância Express/Nest é criada uma vez e CACHEADA em escopo de módulo: instâncias
 * "warm" da função reaproveitam o app e o pool TypeORM, evitando recriar conexões a cada
 * invocação e esgotar o pooler do Supabase (spec §2, EC-1/EC-9). Não usa `app.listen` —
 * a Vercel controla o socket; entregamos o request direto ao Express via `app.init()`.
 */
let cachedServer: Express | undefined;

export async function bootstrapServer(): Promise<Express> {
  if (!cachedServer) {
    const expressApp = express();
    const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
      logger: ['error', 'warn'],
    });
    configureApp(app);
    await app.init();
    cachedServer = expressApp;
  }
  return cachedServer;
}

export default async function handler(req: Request, res: Response): Promise<void> {
  const server = await bootstrapServer();
  server(req, res);
}
