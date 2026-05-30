import type { ProjecaoParametrosDTO, ProjecaoResultadoDTO } from '@financas-pessoais/shared';
import { request } from './http';

export const projecoesApi = {
  calcular(parametros: ProjecaoParametrosDTO): Promise<ProjecaoResultadoDTO> {
    return request<ProjecaoResultadoDTO>('/projecoes/calcular', {
      method: 'POST',
      body: JSON.stringify(parametros),
    });
  },
};
