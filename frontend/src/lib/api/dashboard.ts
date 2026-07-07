import type {
  ConsumoCategoriaDTO,
  EvolucaoMensalItemDTO,
  EvolucaoReservaItemDTO,
  GastoPorCategoriaItemDTO,
  PosicaoCarteiraDTO,
  PrevistoPagoItemDTO,
  ResumoMensalDTO,
  SaldosReservaDTO,
} from '@financas-pessoais/shared';
import { unwrap } from './http';
import * as actions from './actions/dashboard';

/** Conjunto completo de dados exibidos no painel inicial. */
export interface DashboardData {
  resumo: ResumoMensalDTO;
  consumo: ConsumoCategoriaDTO[];
  evolucao: EvolucaoMensalItemDTO[];
  porCategoria: GastoPorCategoriaItemDTO[];
  reservas: SaldosReservaDTO;
  carteira: PosicaoCarteiraDTO;
  evolucaoReservas: EvolucaoReservaItemDTO[];
  previstoPago: PrevistoPagoItemDTO[];
}

export const dashboardApi = {
  async carregar(competencia: string): Promise<DashboardData> {
    return unwrap(await actions.carregarDashboard(competencia));
  },
};
