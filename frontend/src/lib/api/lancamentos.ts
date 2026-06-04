import type {
  AtualizarLancamentoDTO,
  LancamentoDTO,
  RegistrarPagamentoDTO,
  ResumoMensalDTO,
} from '@financas-pessoais/shared';
import { ApiError, unwrap } from './http';
import * as actions from './actions/lancamentos';

/** Corpo de criação de lançamento (mesma forma do de edição). */
export type CriarLancamentoBody = AtualizarLancamentoDTO;

export { ApiError };

export const lancamentosApi = {
  async listar(competencia: string): Promise<LancamentoDTO[]> {
    return unwrap(await actions.listarLancamentos(competencia));
  },

  async resumo(competencia: string): Promise<ResumoMensalDTO> {
    return unwrap(await actions.resumoLancamentos(competencia));
  },

  async criar(body: CriarLancamentoBody): Promise<LancamentoDTO> {
    return unwrap(await actions.criarLancamento(body));
  },

  async atualizar(id: string, body: AtualizarLancamentoDTO): Promise<LancamentoDTO> {
    return unwrap(await actions.atualizarLancamento(id, body));
  },

  async registrarPagamento(id: string, body: RegistrarPagamentoDTO): Promise<LancamentoDTO> {
    return unwrap(await actions.registrarPagamento(id, body));
  },

  async excluir(id: string): Promise<void> {
    return unwrap(await actions.excluirLancamento(id));
  },
};
