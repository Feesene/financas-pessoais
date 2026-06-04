import { INestApplication, ValidationPipe } from '@nestjs/common';
import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';

/**
 * Lê `CORS_ORIGINS` (lista separada por vírgula) e devolve as origens permitidas.
 *
 * Falha fechada em produção: sem `CORS_ORIGINS` definido, retorna `[]` (bloqueia tudo)
 * em vez de cair em `*`. Fora de produção, libera qualquer origem para o fluxo de dev.
 * (spec §4.3, RF-006, EC-7)
 */
export function parseCorsOrigins(env: NodeJS.ProcessEnv = process.env): string[] {
  const raw = env.CORS_ORIGINS?.trim();

  if (!raw) {
    return env.NODE_ENV === 'production' ? [] : ['*'];
  }

  return raw
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/** Monta as opções de CORS a partir das origens resolvidas. */
function buildCorsOptions(env: NodeJS.ProcessEnv = process.env): CorsOptions {
  const origins = parseCorsOrigins(env);
  const allowAny = origins.length === 1 && origins[0] === '*';

  return {
    origin: allowAny ? true : origins,
    credentials: true,
  };
}

/**
 * Configuração compartilhada do app Nest — fonte única usada pelo bootstrap local
 * (`main.ts`) e pelo entrypoint serverless (`api/index.ts`). (spec §4.3)
 */
export function configureApp(app: INestApplication): void {
  app.enableCors(buildCorsOptions());
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
}
