'use server';

import type {
  AtualizarLancamentoDTO,
  LancamentoDTO,
  RegistrarPagamentoDTO,
  ResumoMensalDTO,
} from '@financas-pessoais/shared';
import { apiRequest, type ApiResult } from '../core';
import type { CriarLancamentoBody } from '../lancamentos';

export async function listarLancamentos(competencia: string): Promise<ApiResult<LancamentoDTO[]>> {
  return apiRequest<LancamentoDTO[]>(`/lancamentos?competencia=${encodeURIComponent(competencia)}`);
}

export async function resumoLancamentos(competencia: string): Promise<ApiResult<ResumoMensalDTO>> {
  return apiRequest<ResumoMensalDTO>(
    `/lancamentos/resumo?competencia=${encodeURIComponent(competencia)}`,
  );
}

export async function criarLancamento(
  body: CriarLancamentoBody,
): Promise<ApiResult<LancamentoDTO>> {
  return apiRequest<LancamentoDTO>('/lancamentos', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function atualizarLancamento(
  id: string,
  body: AtualizarLancamentoDTO,
): Promise<ApiResult<LancamentoDTO>> {
  return apiRequest<LancamentoDTO>(`/lancamentos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function registrarPagamento(
  id: string,
  body: RegistrarPagamentoDTO,
): Promise<ApiResult<LancamentoDTO>> {
  return apiRequest<LancamentoDTO>(`/lancamentos/${encodeURIComponent(id)}/pagamento`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

export async function excluirLancamento(id: string): Promise<ApiResult<void>> {
  return apiRequest<void>(`/lancamentos/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
