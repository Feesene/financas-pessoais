import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function buildTypeOrmConfig(config: ConfigService): TypeOrmModuleOptions {
  const databaseType = config.get<string>('DATABASE_TYPE') ?? (config.get<string>('DATABASE_URL') ? 'postgres' : 'sqlite');

  if (databaseType === 'postgres') {
    const nodeEnv = config.get<string>('NODE_ENV');
    const sslEnabled = config.get<string>('DATABASE_SSL') === 'true' || nodeEnv === 'production';
    const poolMax = Number(config.get<string>('DATABASE_POOL_MAX')) || 1;

    return {
      type: 'postgres',
      url: config.get<string>('DATABASE_URL'),
      autoLoadEntities: true,
      synchronize: nodeEnv === 'development',
      // Supabase exige TLS na nuvem; o pooler apresenta certificado próprio (spec §4.4, EC-5).
      ssl: sslEnabled ? { rejectUnauthorized: false } : false,
      // Pool enxuto por instância serverless para não esgotar o pooler do Supabase (spec §4.4, EC-1).
      extra: { max: poolMax },
    };
  }

  const databasePath = resolve(config.get<string>('DATABASE_PATH') ?? './data/financas.db');
  mkdirSync(dirname(databasePath), { recursive: true });

  return {
    type: 'better-sqlite3',
    database: databasePath,
    autoLoadEntities: true,
    synchronize: config.get<string>('DB_SYNCHRONIZE') !== 'false',
  };
}
