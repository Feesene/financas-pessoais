/**
 * Funções puras de token de sessão — Edge-safe (NÃO importam `next/headers`).
 *
 * Separadas de `session.ts` justamente para que o `middleware.ts` (Edge Runtime) possa
 * validar o token sem arrastar o módulo server-only `next/headers`. Usa apenas `jose`
 * (Web Crypto) + a config de ambiente.
 */
import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { getAuthConfig } from './config';

const ALG = 'HS256';
const SUBJECT = 'owner';

export interface SessionClaims extends JWTPayload {
  sub: string;
}

/**
 * Assina um novo JWT de sessão válido por `sessionTtlSeconds`.
 * @returns o token assinado, ou `null` se a auth não estiver configurada (fail-safe).
 */
export async function signSession(): Promise<string | null> {
  const config = getAuthConfig();
  if (!config) return null;

  return new SignJWT({})
    .setProtectedHeader({ alg: ALG })
    .setSubject(SUBJECT)
    .setIssuedAt()
    .setExpirationTime(`${config.sessionTtlSeconds}s`)
    .sign(config.secret);
}

/**
 * Valida a assinatura e a expiração de um token. Função pura — não toca cookies.
 * @returns os claims quando válido; `null` quando ausente, adulterado, expirado ou
 *          quando a auth não está configurada (EC-2, EC-3, EC-5).
 */
export async function verifySessionToken(
  token: string | undefined | null,
): Promise<SessionClaims | null> {
  if (!token) return null;
  const config = getAuthConfig();
  if (!config) return null;

  try {
    const { payload } = await jwtVerify(token, config.secret, { algorithms: [ALG] });
    if (payload.sub !== SUBJECT) return null;
    return payload as SessionClaims;
  } catch {
    // Assinatura inválida, expirado ou malformado -> tratado como "sem sessão".
    return null;
  }
}

/**
 * Valida um `redirectTo` para evitar open redirect (EC-6 / RF-009): aceita apenas
 * caminhos internos da mesma origem (começam com `/`, mas não com `//`).
 * @returns o caminho seguro, ou `'/'` como fallback.
 */
export function sanitizeRedirectTo(redirectTo: string | undefined | null): string {
  if (!redirectTo) return '/';
  // Rejeita protocolo-relativo (//host), URLs absolutas e backslashes.
  if (!redirectTo.startsWith('/') || redirectTo.startsWith('//')) return '/';
  if (redirectTo.includes('\\')) return '/';
  // Rejeita caracteres de controle (code point < 0x20) que poderiam quebrar o header.
  for (let i = 0; i < redirectTo.length; i++) {
    if (redirectTo.charCodeAt(i) < 0x20) return '/';
  }
  return redirectTo;
}
