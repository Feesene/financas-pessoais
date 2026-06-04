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
    throw new ApiError(result.status, result.message);
  }
  return result.data;
}

export { ApiError };
