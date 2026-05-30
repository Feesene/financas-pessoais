import type {
  MaterializarResultadoDTO,
  RegraRecorrenteDTO,
  TipoLancamento,
} from '@financas-pessoais/shared';
import { request } from './http';

export interface CriarRegraBody {
  tipo: TipoLancamento;
  categoriaId: string;
  descricao?: string | null;
  /** Valor mensal (recorrência) ou base de cada parcela. */
  valorBase?: number;
  /** Valor total a parcelar; alternativa a valorBase no parcelamento. */
  valorTotal?: number;
  competenciaInicio: string;
  competenciaFim?: string | null;
  numeroParcelas?: number | null;
}

export interface EditarRegraBody extends CriarRegraBody {
  /** A partir de qual competência a alteração vale (edição prospectiva). */
  aPartirDe: string;
}

export const recorrenciasApi = {
  listar(): Promise<RegraRecorrenteDTO[]> {
    return request<RegraRecorrenteDTO[]>('/recorrencias');
  },

  criar(body: CriarRegraBody): Promise<RegraRecorrenteDTO> {
    return request<RegraRecorrenteDTO>('/recorrencias', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  editar(id: string, body: EditarRegraBody): Promise<RegraRecorrenteDTO> {
    return request<RegraRecorrenteDTO>(`/recorrencias/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  encerrar(id: string): Promise<RegraRecorrenteDTO> {
    return request<RegraRecorrenteDTO>(`/recorrencias/${encodeURIComponent(id)}/encerrar`, {
      method: 'POST',
    });
  },

  materializar(competencia: string): Promise<MaterializarResultadoDTO> {
    return request<MaterializarResultadoDTO>('/recorrencias/materializar', {
      method: 'POST',
      body: JSON.stringify({ competencia }),
    });
  },
};
