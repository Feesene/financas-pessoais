/**
 * Backoff simples de tentativas de login (RF-010, EC-10).
 *
 * App single-user → um contador global em memória do processo é suficiente. Após
 * `THRESHOLD` falhas consecutivas, aplica uma janela de bloqueio que cresce
 * exponencialmente (limitada a `MAX_BLOCK_MS`), dificultando força bruta sem travar
 * permanentemente o dono. O contador zera a cada login bem-sucedido.
 *
 * Observação: estado em memória reinicia a cada cold start (serverless). É uma mitigação
 * básica, não um rate limiter distribuído.
 */
const THRESHOLD = 5;
const BASE_BLOCK_MS = 1000;
const MAX_BLOCK_MS = 30000;

const state = { failures: 0, blockedUntil: 0 };

export interface RateLimitCheck {
  allowed: boolean;
  retryAfterMs: number;
}

/** Verifica se uma nova tentativa é permitida agora. */
export function checkRateLimit(): RateLimitCheck {
  const now = Date.now();
  if (now < state.blockedUntil) {
    return { allowed: false, retryAfterMs: state.blockedUntil - now };
  }
  return { allowed: true, retryAfterMs: 0 };
}

/** Registra uma falha e, acima do limiar, agenda a próxima janela de bloqueio. */
export function registerFailure(): void {
  state.failures += 1;
  if (state.failures >= THRESHOLD) {
    const over = state.failures - THRESHOLD;
    const block = Math.min(BASE_BLOCK_MS * 2 ** over, MAX_BLOCK_MS);
    state.blockedUntil = Date.now() + block;
  }
}

/** Zera o contador (chamado após login bem-sucedido). */
export function resetFailures(): void {
  state.failures = 0;
  state.blockedUntil = 0;
}
