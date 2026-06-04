'use server';

import type {
  BaldeDTO,
  EvolucaoBaldeDTO,
  EvolucaoReservaItemDTO,
  MovimentoReservaComBaldeDTO,
  MovimentoReservaDTO,
  SaldosReservaDTO,
} from '@financas-pessoais/shared';
import { apiRequest, type ApiResult } from '../core';
import type { AtualizarBaldeBody, CriarBaldeBody, MovimentoBody } from '../reservas';

export async function listarBaldes(): Promise<ApiResult<BaldeDTO[]>> {
  return apiRequest<BaldeDTO[]>('/baldes');
}

export async function criarBalde(body: CriarBaldeBody): Promise<ApiResult<BaldeDTO>> {
  return apiRequest<BaldeDTO>('/baldes', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function atualizarBalde(
  id: string,
  body: AtualizarBaldeBody,
): Promise<ApiResult<BaldeDTO>> {
  return apiRequest<BaldeDTO>(`/baldes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function excluirBalde(id: string): Promise<ApiResult<void>> {
  return apiRequest<void>(`/baldes/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function registrarMovimentoReserva(
  baldeId: string,
  body: MovimentoBody,
): Promise<ApiResult<MovimentoReservaDTO>> {
  return apiRequest<MovimentoReservaDTO>(`/baldes/${encodeURIComponent(baldeId)}/movimentos`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function atualizarMovimentoReserva(
  id: string,
  body: MovimentoBody,
): Promise<ApiResult<MovimentoReservaDTO>> {
  return apiRequest<MovimentoReservaDTO>(`/movimentos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function excluirMovimentoReserva(id: string): Promise<ApiResult<void>> {
  return apiRequest<void>(`/movimentos/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function saldosReserva(competencia?: string): Promise<ApiResult<SaldosReservaDTO>> {
  const qs = competencia ? `?competencia=${encodeURIComponent(competencia)}` : '';
  return apiRequest<SaldosReservaDTO>(`/reservas/saldos${qs}`);
}

export async function evolucaoBalde(baldeId: string): Promise<ApiResult<EvolucaoBaldeDTO[]>> {
  return apiRequest<EvolucaoBaldeDTO[]>(`/baldes/${encodeURIComponent(baldeId)}/evolucao`);
}

export async function evolucaoAnualReserva(
  ano: number,
): Promise<ApiResult<EvolucaoReservaItemDTO[]>> {
  return apiRequest<EvolucaoReservaItemDTO[]>(`/reservas/evolucao-anual?ano=${ano}`);
}

export async function listarMovimentosBalde(
  baldeId: string,
): Promise<ApiResult<MovimentoReservaDTO[]>> {
  return apiRequest<MovimentoReservaDTO[]>(`/baldes/${encodeURIComponent(baldeId)}/movimentos`);
}

export async function movimentosDoMes(
  competencia: string,
): Promise<ApiResult<MovimentoReservaComBaldeDTO[]>> {
  return apiRequest<MovimentoReservaComBaldeDTO[]>(
    `/reservas/movimentos?competencia=${encodeURIComponent(competencia)}`,
  );
}
