import { HttpException, HttpStatus, UnauthorizedException } from '@nestjs/common';
import type { DataSource } from 'typeorm';
import { HealthController } from './health.controller';

function makeDataSource(query: jest.Mock): DataSource {
  return { query } as unknown as DataSource;
}

describe('HealthController.keepalive', () => {
  const ORIGINAL = process.env.CRON_SECRET;

  afterEach(() => {
    process.env.CRON_SECRET = ORIGINAL;
  });

  it('responde { status: ok, db: up } quando SELECT 1 funciona', async () => {
    delete process.env.CRON_SECRET;
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const controller = new HealthController(makeDataSource(query));

    const result = await controller.keepalive();

    expect(query).toHaveBeenCalledWith('SELECT 1');
    expect(result.status).toBe('ok');
    expect(result.db).toBe('up');
    expect(typeof result.timestamp).toBe('string');
  });

  it('lança 503 { status: error, db: down } quando o banco falha', async () => {
    delete process.env.CRON_SECRET;
    const query = jest.fn().mockRejectedValue(new Error('connection refused'));
    const controller = new HealthController(makeDataSource(query));

    try {
      await controller.keepalive();
      fail('esperava HttpException');
    } catch (error) {
      expect(error).toBeInstanceOf(HttpException);
      const http = error as HttpException;
      expect(http.getStatus()).toBe(HttpStatus.SERVICE_UNAVAILABLE);
      expect(http.getResponse()).toMatchObject({ status: 'error', db: 'down' });
    }
  });

  it('rejeita com 401 quando CRON_SECRET definido e Authorization diverge', async () => {
    process.env.CRON_SECRET = 'segredo-cron';
    const query = jest.fn();
    const controller = new HealthController(makeDataSource(query));

    await expect(controller.keepalive('Bearer errado')).rejects.toThrow(
      UnauthorizedException,
    );
    expect(query).not.toHaveBeenCalled();
  });

  it('aceita quando CRON_SECRET definido e Authorization corresponde', async () => {
    process.env.CRON_SECRET = 'segredo-cron';
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const controller = new HealthController(makeDataSource(query));

    const result = await controller.keepalive('Bearer segredo-cron');

    expect(result.status).toBe('ok');
    expect(query).toHaveBeenCalledWith('SELECT 1');
  });

  it('libera sem Authorization quando CRON_SECRET não está definido (dev)', async () => {
    delete process.env.CRON_SECRET;
    const query = jest.fn().mockResolvedValue([{ '?column?': 1 }]);
    const controller = new HealthController(makeDataSource(query));

    const result = await controller.keepalive();

    expect(result.status).toBe('ok');
  });
});
