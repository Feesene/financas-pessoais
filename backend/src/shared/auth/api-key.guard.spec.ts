import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ApiKeyGuard } from './api-key.guard';

/** Monta um ExecutionContext mínimo com path e header x-api-key controlados. */
function contextWith(path: string, apiKey?: string): ExecutionContext {
  const request = {
    path,
    header: (name: string) =>
      name.toLowerCase() === 'x-api-key' ? apiKey : undefined,
  } as unknown as Request;

  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('ApiKeyGuard', () => {
  const ORIGINAL = process.env.API_KEY;

  afterEach(() => {
    process.env.API_KEY = ORIGINAL;
  });

  it('libera /health/* sem exigir x-api-key, mesmo com API_KEY definida', () => {
    process.env.API_KEY = 'secreta';
    const guard = new ApiKeyGuard();

    expect(guard.canActivate(contextWith('/health/keepalive'))).toBe(true);
  });

  it('libera tudo quando API_KEY não está definida (dev local)', () => {
    delete process.env.API_KEY;
    const guard = new ApiKeyGuard();

    expect(guard.canActivate(contextWith('/relatorios/consolidado'))).toBe(true);
  });

  it('exige x-api-key correto nas rotas de domínio quando API_KEY está definida', () => {
    process.env.API_KEY = 'secreta';
    const guard = new ApiKeyGuard();

    expect(guard.canActivate(contextWith('/relatorios/consolidado', 'secreta'))).toBe(true);
  });

  it('rejeita rota de domínio sem x-api-key quando API_KEY está definida', () => {
    process.env.API_KEY = 'secreta';
    const guard = new ApiKeyGuard();

    expect(() => guard.canActivate(contextWith('/relatorios/consolidado'))).toThrow(
      UnauthorizedException,
    );
  });
});
