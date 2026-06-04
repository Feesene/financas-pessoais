import type { ProjecaoParametrosDTO, ProjecaoResultadoDTO } from '@financas-pessoais/shared';
import { unwrap } from './http';
import * as actions from './actions/projecoes';

export const projecoesApi = {
  async calcular(parametros: ProjecaoParametrosDTO): Promise<ProjecaoResultadoDTO> {
    return unwrap(await actions.calcularProjecao(parametros));
  },
};
