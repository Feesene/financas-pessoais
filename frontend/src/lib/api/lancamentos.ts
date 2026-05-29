import type {
  AtualizarLancamentoDTO,
  LancamentoDTO,
  ResumoMensalDTO,
} from '@financas-pessoais/shared';

/** Corpo de criação de lançamento (mesma forma do de edição). */
export type CriarLancamentoBody = AtualizarLancamentoDTO;

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new ApiError(response.status, await extractErrorMessage(response));
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

async function extractErrorMessage(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { message?: string | string[] };
    if (Array.isArray(body.message)) return body.message.join('; ');
    if (body.message) return body.message;
  } catch {
    // corpo sem JSON; cai no fallback abaixo.
  }
  return `Erro ${response.status} ao chamar a API.`;
}

export { ApiError };

export const lancamentosApi = {
  listar(competencia: string): Promise<LancamentoDTO[]> {
    return request<LancamentoDTO[]>(`/lancamentos?competencia=${encodeURIComponent(competencia)}`);
  },

  resumo(competencia: string): Promise<ResumoMensalDTO> {
    return request<ResumoMensalDTO>(
      `/lancamentos/resumo?competencia=${encodeURIComponent(competencia)}`,
    );
  },

  criar(body: CriarLancamentoBody): Promise<LancamentoDTO> {
    return request<LancamentoDTO>('/lancamentos', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  atualizar(id: string, body: AtualizarLancamentoDTO): Promise<LancamentoDTO> {
    return request<LancamentoDTO>(`/lancamentos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  excluir(id: string): Promise<void> {
    return request<void>(`/lancamentos/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
