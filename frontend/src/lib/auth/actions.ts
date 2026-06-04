'use server';

import { createHash, timingSafeEqual } from 'node:crypto';
import { redirect } from 'next/navigation';
import { getAuthConfig, isAuthConfigured } from './config';
import { signSession, setSessionCookie, clearSessionCookie, sanitizeRedirectTo } from './session';
import { registerFailure, checkRateLimit, resetFailures } from './rateLimit';
import type { LoginResult } from './types';

/** sha256 de tamanho fixo (32 bytes) para comparar em tempo constante sem vazar comprimento. */
function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest();
}

/** Compara a senha digitada com `APP_PASSWORD` em tempo constante. */
function passwordMatches(input: string, expected: string): boolean {
  return timingSafeEqual(digest(input), digest(expected));
}

/**
 * Valida a senha enviada pelo formulário de login e, em caso de sucesso, cria a sessão
 * e redireciona. Roda no Node Runtime. Ver spec §4.1, RF-002/RF-008/RF-009.
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  // Fail-safe: sem configuração, nunca conceder acesso (EC-1 / RF-008).
  if (!isAuthConfigured()) {
    console.error('[auth] APP_PASSWORD ou AUTH_SECRET ausentes — login recusado.');
    return { ok: false, code: 'config' };
  }

  const rate = checkRateLimit();
  if (!rate.allowed) {
    return { ok: false, code: 'rate_limited', retryAfterMs: rate.retryAfterMs };
  }

  const config = getAuthConfig()!;
  const password = String(formData.get('password') ?? '').trim();
  const redirectTo = sanitizeRedirectTo(formData.get('redirectTo') as string | null);

  if (!passwordMatches(password, config.password)) {
    registerFailure();
    return { ok: false, code: 'invalid' };
  }

  resetFailures();
  const token = await signSession();
  if (!token) {
    console.error('[auth] Falha ao assinar a sessão — configuração inválida.');
    return { ok: false, code: 'config' };
  }
  await setSessionCookie(token);

  // `redirect` lança internamente; deve ficar fora de try/catch.
  redirect(redirectTo);
}

/** Invalida a sessão (remove o cookie) e volta para `/login`. Ver spec §4.2, RF-006. */
export async function logoutAction(): Promise<void> {
  clearSessionCookie();
  redirect('/login');
}
