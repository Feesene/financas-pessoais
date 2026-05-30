import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

export function buildTypeOrmConfig(config: ConfigService): TypeOrmModuleOptions {
  const databaseType = config.get<string>('DATABASE_TYPE') ?? (config.get<string>('DATABASE_URL') ? 'postgres' : 'sqlite');

  if (databaseType === 'postgres') {
    return {
      type: 'postgres',
      url: config.get<string>('DATABASE_URL'),
      autoLoadEntities: true,
      synchronize: config.get<string>('NODE_ENV') === 'development',
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
