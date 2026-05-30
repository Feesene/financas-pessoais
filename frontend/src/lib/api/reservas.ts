import type {
  BaldeDTO,
  EvolucaoBaldeDTO,
  MovimentoReservaDTO,
  SaldosReservaDTO,
  TipoMovimentoReserva,
} from '@financas-pessoais/shared';
import { request } from './http';

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
  listarBaldes(): Promise<BaldeDTO[]> {
    return request<BaldeDTO[]>('/baldes');
  },

  criarBalde(body: CriarBaldeBody): Promise<BaldeDTO> {
    return request<BaldeDTO>('/baldes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  atualizarBalde(id: string, body: AtualizarBaldeBody): Promise<BaldeDTO> {
    return request<BaldeDTO>(`/baldes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  excluirBalde(id: string): Promise<void> {
    return request<void>(`/baldes/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  registrarMovimento(baldeId: string, body: MovimentoBody): Promise<MovimentoReservaDTO> {
    return request<MovimentoReservaDTO>(`/baldes/${encodeURIComponent(baldeId)}/movimentos`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  atualizarMovimento(id: string, body: MovimentoBody): Promise<MovimentoReservaDTO> {
    return request<MovimentoReservaDTO>(`/movimentos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  excluirMovimento(id: string): Promise<void> {
    return request<void>(`/movimentos/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  saldos(competencia?: string): Promise<SaldosReservaDTO> {
    const qs = competencia ? `?competencia=${encodeURIComponent(competencia)}` : '';
    return request<SaldosReservaDTO>(`/reservas/saldos${qs}`);
  },

  evolucao(baldeId: string): Promise<EvolucaoBaldeDTO[]> {
    return request<EvolucaoBaldeDTO[]>(`/baldes/${encodeURIComponent(baldeId)}/evolucao`);
  },
};
