import type { ConfigService } from '@nestjs/config';
import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

/**
 * Construída como factory (não como constante de módulo) para ser avaliada
 * só depois que o ConfigModule carregar o `.env` no ambiente.
 */
export function buildTypeOrmConfig(config: ConfigService): TypeOrmModuleOptions {
  return {
    type: 'postgres',
    url: config.get<string>('DATABASE_URL'),
    autoLoadEntities: true,
    // synchronize só em desenvolvimento; em produção use migrations.
    synchronize: config.get<string>('NODE_ENV') === 'development',
  };
}
