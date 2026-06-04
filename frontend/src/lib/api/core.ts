import type { ApiResult } from './http';
import { getSession } from '../auth/session';

export type { ApiResult } from './http';

const API_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/** Resposta padrão quando não há sessão válida — não toca o backend (RF-005, CS-003). */
const UNAUTHORIZED: ApiResult<never> = {
  ok: false,
  status: 401,
  message: 'Sessão expirada. Faça login novamente.',
};

/** Executa uma requisição JSON ao backend a partir do servidor (server actions). */
export async function apiRequest<T>(path: string, init?: RequestInit): Promise<ApiResult<T>> {
  // Guarda de sessão centralizada: toda action de dados passa por aqui (spec §1, §4.3).
  if (!(await getSession())) {
    return UNAUTHORIZED;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
      cache: 'no-store',
    });
  } catch {
    return { ok: false, status: 0, message: 'Não foi possível conectar à API.' };
  }

  if (!response.ok) {
    return { ok: false, status: response.status, message: await extractErrorMessage(response) };
  }

  if (response.status === 204) {
    return { ok: true, data: undefined as T };
  }
  return { ok: true, data: (await response.json()) as T };
}

/** Baixa um recurso binário do backend e devolve em base64 para o cliente montar o download. */
export async function apiRequestBinary(
  path: string,
): Promise<ApiResult<{ base64: string; contentType: string }>> {
  if (!(await getSession())) {
    return UNAUTHORIZED;
  }

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, { cache: 'no-store' });
  } catch {
    return { ok: false, status: 0, message: 'Não foi possível conectar à API.' };
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      message: `Erro ${response.status} ao exportar relatório.`,
    };
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return {
    ok: true,
    data: {
      base64: buffer.toString('base64'),
      contentType: response.headers.get('content-type') ?? 'application/octet-stream',
    },
  };
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
