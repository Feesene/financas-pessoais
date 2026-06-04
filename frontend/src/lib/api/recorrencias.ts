import type {
  MaterializarResultadoDTO,
  RegraRecorrenteDTO,
  TipoLancamento,
} from '@financas-pessoais/shared';
import { unwrap } from './http';
import * as actions from './actions/recorrencias';

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
  async listar(): Promise<RegraRecorrenteDTO[]> {
    return unwrap(await actions.listarRecorrencias());
  },

  async criar(body: CriarRegraBody): Promise<RegraRecorrenteDTO> {
    return unwrap(await actions.criarRecorrencia(body));
  },

  async editar(id: string, body: EditarRegraBody): Promise<RegraRecorrenteDTO> {
    return unwrap(await actions.editarRecorrencia(id, body));
  },

  async encerrar(id: string): Promise<RegraRecorrenteDTO> {
    return unwrap(await actions.encerrarRecorrencia(id));
  },

  async materializar(competencia: string): Promise<MaterializarResultadoDTO> {
    return unwrap(await actions.materializarRecorrencias(competencia));
  },
};
