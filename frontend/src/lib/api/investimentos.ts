import type {
  AtivoDTO,
  HistoricoCarteiraItemDTO,
  MovimentoCarteiraDTO,
  PosicaoCarteiraDTO,
  TipoAtivo,
  TipoMovimentoCarteira,
} from '@financas-pessoais/shared';
import { request } from './http';

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
  posicao(): Promise<PosicaoCarteiraDTO> {
    return request<PosicaoCarteiraDTO>('/carteira/posicao');
  },

  historico(de?: string, ate?: string): Promise<HistoricoCarteiraItemDTO[]> {
    const params = new URLSearchParams();
    if (de) params.set('de', de);
    if (ate) params.set('ate', ate);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<HistoricoCarteiraItemDTO[]>(`/carteira/historico${qs}`);
  },

  criarAtivo(body: CriarAtivoBody): Promise<AtivoDTO> {
    return request<AtivoDTO>('/ativos', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  atualizarAtivo(id: string, body: AtualizarAtivoBody): Promise<AtivoDTO> {
    return request<AtivoDTO>(`/ativos/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  excluirAtivo(id: string): Promise<void> {
    return request<void>(`/ativos/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },

  registrarMovimento(ativoId: string, body: MovimentoCarteiraBody): Promise<MovimentoCarteiraDTO> {
    return request<MovimentoCarteiraDTO>(
      `/ativos/${encodeURIComponent(ativoId)}/movimentos`,
      {
        method: 'POST',
        body: JSON.stringify(body),
      },
    );
  },

  atualizarMovimento(id: string, body: MovimentoCarteiraBody): Promise<MovimentoCarteiraDTO> {
    return request<MovimentoCarteiraDTO>(`/movimentos-carteira/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  excluirMovimento(id: string): Promise<void> {
    return request<void>(`/movimentos-carteira/${encodeURIComponent(id)}`, { method: 'DELETE' });
  },
};
