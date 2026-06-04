'use server';

import type {
  AtivoDTO,
  CotacaoAtivoDTO,
  EvolucaoAtivoItemDTO,
  HistoricoCarteiraItemDTO,
  MovimentoCarteiraDTO,
  PosicaoCarteiraDTO,
  RegistrarCotacaoDTO,
} from '@financas-pessoais/shared';
import { apiRequest, type ApiResult } from '../core';
import type { AtualizarAtivoBody, CriarAtivoBody, MovimentoCarteiraBody } from '../investimentos';

export async function posicaoCarteira(): Promise<ApiResult<PosicaoCarteiraDTO>> {
  return apiRequest<PosicaoCarteiraDTO>('/carteira/posicao');
}

export async function historicoCarteira(
  de?: string,
  ate?: string,
): Promise<ApiResult<HistoricoCarteiraItemDTO[]>> {
  const params = new URLSearchParams();
  if (de) params.set('de', de);
  if (ate) params.set('ate', ate);
  const qs = params.toString() ? `?${params.toString()}` : '';
  return apiRequest<HistoricoCarteiraItemDTO[]>(`/carteira/historico${qs}`);
}

export async function criarAtivo(body: CriarAtivoBody): Promise<ApiResult<AtivoDTO>> {
  return apiRequest<AtivoDTO>('/ativos', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function atualizarAtivo(
  id: string,
  body: AtualizarAtivoBody,
): Promise<ApiResult<AtivoDTO>> {
  return apiRequest<AtivoDTO>(`/ativos/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function excluirAtivo(id: string): Promise<ApiResult<void>> {
  return apiRequest<void>(`/ativos/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function registrarMovimentoCarteira(
  ativoId: string,
  body: MovimentoCarteiraBody,
): Promise<ApiResult<MovimentoCarteiraDTO>> {
  return apiRequest<MovimentoCarteiraDTO>(`/ativos/${encodeURIComponent(ativoId)}/movimentos`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function atualizarMovimentoCarteira(
  id: string,
  body: MovimentoCarteiraBody,
): Promise<ApiResult<MovimentoCarteiraDTO>> {
  return apiRequest<MovimentoCarteiraDTO>(`/movimentos-carteira/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function excluirMovimentoCarteira(id: string): Promise<ApiResult<void>> {
  return apiRequest<void>(`/movimentos-carteira/${encodeURIComponent(id)}`, { method: 'DELETE' });
}

export async function registrarCotacao(
  ativoId: string,
  competencia: string,
  body: RegistrarCotacaoDTO,
): Promise<ApiResult<CotacaoAtivoDTO>> {
  return apiRequest<CotacaoAtivoDTO>(
    `/ativos/${encodeURIComponent(ativoId)}/cotacoes/${encodeURIComponent(competencia)}`,
    {
      method: 'PUT',
      body: JSON.stringify(body),
    },
  );
}

export async function listarCotacoes(ativoId: string): Promise<ApiResult<CotacaoAtivoDTO[]>> {
  return apiRequest<CotacaoAtivoDTO[]>(`/ativos/${encodeURIComponent(ativoId)}/cotacoes`);
}

export async function obterEvolucaoAtivo(
  ativoId: string,
): Promise<ApiResult<EvolucaoAtivoItemDTO[]>> {
  return apiRequest<EvolucaoAtivoItemDTO[]>(`/ativos/${encodeURIComponent(ativoId)}/evolucao`);
}

export async function excluirCotacao(
  ativoId: string,
  competencia: string,
): Promise<ApiResult<void>> {
  return apiRequest<void>(
    `/ativos/${encodeURIComponent(ativoId)}/cotacoes/${encodeURIComponent(competencia)}`,
    { method: 'DELETE' },
  );
}
