'use server';

import type { ProjecaoParametrosDTO, ProjecaoResultadoDTO } from '@financas-pessoais/shared';
import { apiRequest, type ApiResult } from '../core';

export async function calcularProjecao(
  parametros: ProjecaoParametrosDTO,
): Promise<ApiResult<ProjecaoResultadoDTO>> {
  return apiRequest<ProjecaoResultadoDTO>('/projecoes/calcular', {
    method: 'POST',
    body: JSON.stringify(parametros),
  });
}
