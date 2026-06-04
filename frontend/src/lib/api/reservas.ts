import type {
  BaldeDTO,
  EvolucaoBaldeDTO,
  EvolucaoReservaItemDTO,
  MovimentoReservaComBaldeDTO,
  MovimentoReservaDTO,
  SaldosReservaDTO,
  TipoMovimentoReserva,
} from '@financas-pessoais/shared';
import { unwrap } from './http';
import * as actions from './actions/reservas';

export interface CriarBaldeBody {
  nome: string;
  saldoInicial?: number;
  cor?: string | null;
}

export interface AtualizarBaldeBody {
  nome: string;
  saldoInicial: number;
  cor?: string | null;
}

export interface MovimentoBody {
  tipo: TipoMovimentoReserva;
  valor: number;
  competencia: string;
  descricao?: string | null;
}

export const reservasApi = {
  async listarBaldes(): Promise<BaldeDTO[]> {
    return unwrap(await actions.listarBaldes());
  },

  async criarBalde(body: CriarBaldeBody): Promise<BaldeDTO> {
    return unwrap(await actions.criarBalde(body));
  },

  async atualizarBalde(id: string, body: AtualizarBaldeBody): Promise<BaldeDTO> {
    return unwrap(await actions.atualizarBalde(id, body));
  },

  async excluirBalde(id: string): Promise<void> {
    return unwrap(await actions.excluirBalde(id));
  },

  async registrarMovimento(baldeId: string, body: MovimentoBody): Promise<MovimentoReservaDTO> {
    return unwrap(await actions.registrarMovimentoReserva(baldeId, body));
  },

  async atualizarMovimento(id: string, body: MovimentoBody): Promise<MovimentoReservaDTO> {
    return unwrap(await actions.atualizarMovimentoReserva(id, body));
  },

  async excluirMovimento(id: string): Promise<void> {
    return unwrap(await actions.excluirMovimentoReserva(id));
  },

  async saldos(competencia?: string): Promise<SaldosReservaDTO> {
    return unwrap(await actions.saldosReserva(competencia));
  },

  async evolucao(baldeId: string): Promise<EvolucaoBaldeDTO[]> {
    return unwrap(await actions.evolucaoBalde(baldeId));
  },

  async evolucaoAnual(ano: number): Promise<EvolucaoReservaItemDTO[]> {
    return unwrap(await actions.evolucaoAnualReserva(ano));
  },

  async listarMovimentosBalde(baldeId: string): Promise<MovimentoReservaDTO[]> {
    return unwrap(await actions.listarMovimentosBalde(baldeId));
  },

  async movimentosDoMes(competencia: string): Promise<MovimentoReservaComBaldeDTO[]> {
    return unwrap(await actions.movimentosDoMes(competencia));
  },
};
