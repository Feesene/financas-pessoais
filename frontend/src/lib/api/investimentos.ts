import type {
  AtivoDTO,
  CotacaoAtivoDTO,
  EvolucaoAtivoItemDTO,
  HistoricoCarteiraItemDTO,
  MovimentoCarteiraDTO,
  PosicaoCarteiraDTO,
  RegistrarCotacaoDTO,
  TipoAtivo,
  TipoMovimentoCarteira,
} from '@financas-pessoais/shared';
import { unwrap } from './http';
import * as actions from './actions/investimentos';

export interface CriarAtivoBody {
  tipo: TipoAtivo;
  descricao: string;
  quantidade?: number | null;
  valorUnitario?: number | null;
  valorBruto?: number;
  rendimento?: number;
}

export interface AtualizarAtivoBody {
  descricao: string;
  quantidade?: number | null;
  valorUnitario?: number | null;
  valorBruto?: number;
  rendimento?: number;
}

export interface MovimentoCarteiraBody {
  tipo: TipoMovimentoCarteira;
  valor: number;
  competencia: string;
  descricao?: string | null;
}

export const investimentosApi = {
  async posicao(): Promise<PosicaoCarteiraDTO> {
    return unwrap(await actions.posicaoCarteira());
  },

  async historico(de?: string, ate?: string): Promise<HistoricoCarteiraItemDTO[]> {
    return unwrap(await actions.historicoCarteira(de, ate));
  },

  async criarAtivo(body: CriarAtivoBody): Promise<AtivoDTO> {
    return unwrap(await actions.criarAtivo(body));
  },

  async atualizarAtivo(id: string, body: AtualizarAtivoBody): Promise<AtivoDTO> {
    return unwrap(await actions.atualizarAtivo(id, body));
  },

  async excluirAtivo(id: string): Promise<void> {
    return unwrap(await actions.excluirAtivo(id));
  },

  async registrarMovimento(
    ativoId: string,
    body: MovimentoCarteiraBody,
  ): Promise<MovimentoCarteiraDTO> {
    return unwrap(await actions.registrarMovimentoCarteira(ativoId, body));
  },

  async atualizarMovimento(id: string, body: MovimentoCarteiraBody): Promise<MovimentoCarteiraDTO> {
    return unwrap(await actions.atualizarMovimentoCarteira(id, body));
  },

  async excluirMovimento(id: string): Promise<void> {
    return unwrap(await actions.excluirMovimentoCarteira(id));
  },

  async registrarCotacao(
    ativoId: string,
    competencia: string,
    body: RegistrarCotacaoDTO,
  ): Promise<CotacaoAtivoDTO> {
    return unwrap(await actions.registrarCotacao(ativoId, competencia, body));
  },

  async listarCotacoes(ativoId: string): Promise<CotacaoAtivoDTO[]> {
    return unwrap(await actions.listarCotacoes(ativoId));
  },

  async obterEvolucao(ativoId: string): Promise<EvolucaoAtivoItemDTO[]> {
    return unwrap(await actions.obterEvolucaoAtivo(ativoId));
  },

  async excluirCotacao(ativoId: string, competencia: string): Promise<void> {
    return unwrap(await actions.excluirCotacao(ativoId, competencia));
  },
};
