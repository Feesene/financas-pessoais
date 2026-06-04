/**
 * Sessão no contexto de Server Components / server actions (Node Runtime).
 *
 * Combina as funções puras de `token.ts` (Edge-safe) com os helpers de cookie baseados
 * em `next/headers`. O `middleware.ts` NÃO deve importar este arquivo (usa `token.ts`
 * diretamente) para não arrastar o módulo server-only `next/headers` ao Edge.
 */
import { cookies } from 'next/headers';
import { SESSION_COOKIE, getAuthConfig } from './config';
import { verifySessionToken, type SessionClaims } from './token';

// Reexporta as funções puras para consumidores Node manterem um único ponto de import.
export { signSession, verifySessionToken, sanitizeRedirectTo } from './token';
export type { SessionClaims } from './token';

/**
 * Lê o cookie de sessão (via `next/headers`) e valida o token.
 * Uso em Server Components e server actions.
 */
export async function getSession(): Promise<SessionClaims | null> {
  const token = cookies().get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

/** Grava o cookie de sessão com os atributos de segurança da spec (§4.4). */
export async function setSessionCookie(token: string): Promise<void> {
  const config = getAuthConfig();
  if (!config) return;

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: config.secureCookie,
    sameSite: 'lax',
    path: '/',
    maxAge: config.sessionTtlSeconds,
  });
}

/** Remove o cookie de sessão (logout / invalidação). */
export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}
