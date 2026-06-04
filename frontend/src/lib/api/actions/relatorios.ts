'use server';

import type {
  ComparacaoMesesDTO,
  ConsolidadoDTO,
  EvolucaoMensalItemDTO,
  FormatoExportacao,
  GastoPorCategoriaItemDTO,
  PrevistoPagoItemDTO,
} from '@financas-pessoais/shared';
import { apiRequest, apiRequestBinary, type ApiResult } from '../core';

function intervalo(de: string, ate: string): string {
  return `de=${encodeURIComponent(de)}&ate=${encodeURIComponent(ate)}`;
}

export async function consolidadoPorAno(ano: number): Promise<ApiResult<ConsolidadoDTO>> {
  return apiRequest<ConsolidadoDTO>(`/relatorios/consolidado?ano=${ano}`);
}

export async function consolidadoPorIntervalo(
  de: string,
  ate: string,
): Promise<ApiResult<ConsolidadoDTO>> {
  return apiRequest<ConsolidadoDTO>(`/relatorios/consolidado?${intervalo(de, ate)}`);
}

export async function porCategoria(
  de: string,
  ate: string,
): Promise<ApiResult<GastoPorCategoriaItemDTO[]>> {
  return apiRequest<GastoPorCategoriaItemDTO[]>(`/relatorios/por-categoria?${intervalo(de, ate)}`);
}

export async function evolucao(
  de: string,
  ate: string,
): Promise<ApiResult<EvolucaoMensalItemDTO[]>> {
  return apiRequest<EvolucaoMensalItemDTO[]>(`/relatorios/evolucao?${intervalo(de, ate)}`);
}

export async function previstoPago(
  de: string,
  ate: string,
): Promise<ApiResult<PrevistoPagoItemDTO[]>> {
  return apiRequest<PrevistoPagoItemDTO[]>(`/relatorios/previsto-pago?${intervalo(de, ate)}`);
}

export async function comparar(a: string, b: string): Promise<ApiResult<ComparacaoMesesDTO>> {
  return apiRequest<ComparacaoMesesDTO>(
    `/relatorios/comparar?a=${encodeURIComponent(a)}&b=${encodeURIComponent(b)}`,
  );
}

export async function exportarRelatorio(
  formato: FormatoExportacao,
  de: string,
  ate: string,
): Promise<ApiResult<{ base64: string; contentType: string }>> {
  return apiRequestBinary(`/relatorios/exportar?formato=${formato}&${intervalo(de, ate)}`);
}
