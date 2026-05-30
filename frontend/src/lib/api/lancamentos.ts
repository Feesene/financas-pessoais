import type {
  AtualizarLancamentoDTO,
  LancamentoDTO,
  RegistrarPagamentoDTO,
  ResumoMensalDTO,
} from '@financas-pessoais/shared';
import { ApiError, request } from './http';

/** Corpo de criação de lançamento (mesma forma do de edição). */
export type CriarLancamentoBody = AtualizarLancamentoDTO;

export { ApiError };

export const lancamentosApi = {
  listar(competencia: string): Promise<LancamentoDTO[]> {
    return request<LancamentoDTO[]>(`/lancamentos?competencia=${encodeURIComponent(competencia)}`);
  },

  resumo(competencia: string): Promise<ResumoMensalDTO> {
    return request<ResumoMensalDTO>(
      `/lancamentos/resumo?competencia=${encodeURIComponent(competencia)}`,
    );
  },

  criar(body: CriarLancamentoBody): Promise<LancamentoDTO> {
    return request<LancamentoDTO>('/lancamentos', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  atualizar(id: string, body: AtualizarLancamentoDTO): Promise<LancamentoDTO> {
    return request<LancamentoDTO>(`/lancamentos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  registrarPagamento(id: string, body: RegistrarPagamentoDTO): Promise<LancamentoDTO> {
    return request<LancamentoDTO>(`/lancamentos/${encodeURIComponent(id)}/pagamento`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  excluir(id: string): Promise<void> {
    return request<void>(`/lancamentos/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
