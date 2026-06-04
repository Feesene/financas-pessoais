import type { ConfigService } from '@nestjs/config';
import { buildTypeOrmConfig } from './typeorm.config';

/** Stub mínimo do ConfigService: lê de um mapa em memória. */
function fakeConfig(values: Record<string, string | undefined>): ConfigService {
  return { get: <T>(key: string) => values[key] as T } as ConfigService;
}

describe('buildTypeOrmConfig — branch postgres', () => {
  const baseUrl = 'postgres://user:pass@host:6543/postgres';

  it('habilita SSL e mantém synchronize=false em produção', () => {
    const config = buildTypeOrmConfig(
      fakeConfig({ DATABASE_TYPE: 'postgres', DATABASE_URL: baseUrl, NODE_ENV: 'production' }),
    );

    expect(config).toMatchObject({
      type: 'postgres',
      url: baseUrl,
      synchronize: false,
      ssl: { rejectUnauthorized: false },
    });
  });

  it('habilita SSL quando DATABASE_SSL=true mesmo fora de produção', () => {
    const config = buildTypeOrmConfig(
      fakeConfig({ DATABASE_TYPE: 'postgres', DATABASE_URL: baseUrl, DATABASE_SSL: 'true' }),
    );

    expect(config).toMatchObject({ ssl: { rejectUnauthorized: false } });
  });

  it('aplica o pool máximo de DATABASE_POOL_MAX (default 1)', () => {
    const comDefault = buildTypeOrmConfig(
      fakeConfig({ DATABASE_TYPE: 'postgres', DATABASE_URL: baseUrl }),
    );
    expect(comDefault).toMatchObject({ extra: { max: 1 } });

    const comValor = buildTypeOrmConfig(
      fakeConfig({ DATABASE_TYPE: 'postgres', DATABASE_URL: baseUrl, DATABASE_POOL_MAX: '5' }),
    );
    expect(comValor).toMatchObject({ extra: { max: 5 } });
  });

  it('mantém synchronize=true e SSL desligado em desenvolvimento', () => {
    const config = buildTypeOrmConfig(
      fakeConfig({ DATABASE_TYPE: 'postgres', DATABASE_URL: baseUrl, NODE_ENV: 'development' }),
    );

    expect(config).toMatchObject({ synchronize: true, ssl: false });
  });
});
