/**
 * Contrato de cache do entrypoint serverless (spec §4.1, §8).
 *
 * O `AppModule` deste projeto usa TypeORM com driver nativo (better-sqlite3) que não
 * inicializa sob ts-jest — por isso os e2e existentes usam repositórios em memória e
 * nunca bootam o app real. Aqui mockamos `NestFactory` para validar a garantia central
 * do handler: a instância é criada UMA vez e reaproveitada entre invocações (warm).
 */
jest.mock('@nestjs/core', () => ({
  NestFactory: { create: jest.fn() },
}));
jest.mock('../src/shared/config/app-setup', () => ({
  configureApp: jest.fn(),
}));

import { NestFactory } from '@nestjs/core';
import { configureApp } from '../src/shared/config/app-setup';

describe('bootstrapServer (api/index.ts)', () => {
  it('cria a instância uma vez e reusa entre invocações', async () => {
    const fakeApp = { init: jest.fn().mockResolvedValue(undefined) };
    (NestFactory.create as jest.Mock).mockResolvedValue(fakeApp);

    const { bootstrapServer } = await import('../api/index');

    const server = await bootstrapServer();
    const serverAgain = await bootstrapServer();

    expect(serverAgain).toBe(server);
    expect(NestFactory.create).toHaveBeenCalledTimes(1);
    expect(configureApp).toHaveBeenCalledTimes(1);
    expect(fakeApp.init).toHaveBeenCalledTimes(1);
    // Retorna o app Express (callable), não o app Nest.
    expect(typeof server).toBe('function');
  });
});
