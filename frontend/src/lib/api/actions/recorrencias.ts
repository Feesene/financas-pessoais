'use server';

import type { MaterializarResultadoDTO, RegraRecorrenteDTO } from '@financas-pessoais/shared';
import { apiRequest, type ApiResult } from '../core';
import type { CriarRegraBody, EditarRegraBody } from '../recorrencias';

export async function listarRecorrencias(): Promise<ApiResult<RegraRecorrenteDTO[]>> {
  return apiRequest<RegraRecorrenteDTO[]>('/recorrencias');
}

export async function criarRecorrencia(
  body: CriarRegraBody,
): Promise<ApiResult<RegraRecorrenteDTO>> {
  return apiRequest<RegraRecorrenteDTO>('/recorrencias', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function editarRecorrencia(
  id: string,
  body: EditarRegraBody,
): Promise<ApiResult<RegraRecorrenteDTO>> {
  return apiRequest<RegraRecorrenteDTO>(`/recorrencias/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export async function encerrarRecorrencia(id: string): Promise<ApiResult<RegraRecorrenteDTO>> {
  return apiRequest<RegraRecorrenteDTO>(`/recorrencias/${encodeURIComponent(id)}/encerrar`, {
    method: 'POST',
  });
}

export async function materializarRecorrencias(
  competencia: string,
  ate?: string,
): Promise<ApiResult<MaterializarResultadoDTO>> {
  return apiRequest<MaterializarResultadoDTO>('/recorrencias/materializar', {
    method: 'POST',
    body: JSON.stringify(ate ? { competencia, ate } : { competencia }),
  });
}
