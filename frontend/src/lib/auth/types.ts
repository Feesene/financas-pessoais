/** Resultado da `loginAction` (ver spec §4.1). Em caso de sucesso a action redireciona. */
export type LoginResult =
  | { ok: false; code: 'invalid' }
  | { ok: false; code: 'config' }
  | { ok: false; code: 'rate_limited'; retryAfterMs: number };
