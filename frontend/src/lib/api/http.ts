export type ApiResult<T> = { ok: true; data: T } | { ok: false; status: number; message: string };

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/** Desempacota o resultado de uma server action, lançando ApiError em caso de falha. */
export function unwrap<T>(result: ApiResult<T>): T {
  if (!result.ok) {
    // Sessão expirada/ausente durante uso no cliente: redireciona para o login
    // preservando a rota atual (RF-011). No servidor, o middleware já redirecionou
    // antes do render, então só agimos no navegador.
    if (result.status === 401 && typeof window !== 'undefined') {
      const redirectTo = `${window.location.pathname}${window.location.search}`;
      window.location.href = `/login?redirectTo=${encodeURIComponent(redirectTo)}`;
    }
    throw new ApiError(result.status, result.message);
  }
  return result.data;
}

export { ApiError };
