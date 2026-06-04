/**
 * Configuração de autenticação derivada do ambiente (não persistida).
 *
 * Carrega e valida `APP_PASSWORD`, `AUTH_SECRET` e `AUTH_SESSION_TTL`. Conforme a spec
 * (fail-safe, EC-1/EC-11), o app nunca deve subir "aberto": se a senha ou o segredo
 * estiverem ausentes, a autenticação é recusada.
 *
 * Todo este módulo é exclusivamente server-side; nunca deve ser importado por código
 * de cliente para não vazar senha/segredo ao bundle.
 */

/** Nome do cookie que carrega o JWT de sessão. */
export const SESSION_COOKIE = 'session';

/** TTL padrão da sessão em segundos (7 dias). */
export const DEFAULT_SESSION_TTL = 604800;

/** Tamanho mínimo recomendado do segredo, em bytes. */
const MIN_SECRET_BYTES = 32;

export interface AuthConfig {
  /** Senha de acesso (valor bruto de `APP_PASSWORD`). */
  password: string;
  /** Segredo de assinatura do JWT, já codificado em bytes. */
  secret: Uint8Array;
  /** Tempo de vida da sessão em segundos. */
  sessionTtlSeconds: number;
  /** Marca o cookie como `Secure` (produção/HTTPS). */
  secureCookie: boolean;
}

function parseTtl(raw: string | undefined): number {
  if (raw === undefined || raw.trim() === '') return DEFAULT_SESSION_TTL;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    console.warn(
      `[auth] AUTH_SESSION_TTL inválido ("${raw}"); usando padrão de ${DEFAULT_SESSION_TTL}s.`,
    );
    return DEFAULT_SESSION_TTL;
  }
  return Math.floor(parsed);
}

/**
 * Indica se a autenticação está corretamente configurada. Quando `false`, o login
 * deve ser recusado (fail-safe) — ver EC-1.
 */
export function isAuthConfigured(): boolean {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;
  return Boolean(password && password.length > 0 && secret && secret.length > 0);
}

/** `true` quando o cookie deve usar o atributo `Secure` (produção). */
export function isSecureCookie(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Lê e valida a configuração de auth do ambiente.
 *
 * @returns A configuração quando completa, ou `null` quando `APP_PASSWORD`/`AUTH_SECRET`
 *          estiverem ausentes (fail-safe). O chamador deve tratar `null` como
 *          "config ausente" e nunca conceder acesso.
 */
export function getAuthConfig(): AuthConfig | null {
  const password = process.env.APP_PASSWORD;
  const secret = process.env.AUTH_SECRET;

  if (!password || password.length === 0 || !secret || secret.length === 0) {
    return null;
  }

  const secretBytes = new TextEncoder().encode(secret);
  if (secretBytes.length < MIN_SECRET_BYTES) {
    console.warn(
      `[auth] AUTH_SECRET tem ${secretBytes.length} bytes; recomendado >= ${MIN_SECRET_BYTES}.`,
    );
  }

  return {
    password,
    secret: secretBytes,
    sessionTtlSeconds: parseTtl(process.env.AUTH_SESSION_TTL),
    secureCookie: isSecureCookie(),
  };
}
