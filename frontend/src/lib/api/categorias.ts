import type {
  CategoriaDTO,
  ConsumoCategoriaDTO,
  MetaMensalDTO,
  TipoLancamento,
} from '@financas-pessoais/shared';
import { unwrap } from './http';
import * as actions from './actions/categorias';

export interface CriarCategoriaBody {
  nome: string;
  tipo: TipoLancamento;
  cor?: string | null;
}

export interface AtualizarCategoriaBody {
  nome: string;
  cor?: string | null;
}

export interface DefinirMetaBody {
  competencia: string;
  valor: number;
}

export const categoriasApi = {
  async listar(): Promise<CategoriaDTO[]> {
    return unwrap(await actions.listarCategorias());
  },

  async criar(body: CriarCategoriaBody): Promise<CategoriaDTO> {
    return unwrap(await actions.criarCategoria(body));
  },

  async atualizar(id: string, body: AtualizarCategoriaBody): Promise<CategoriaDTO> {
    return unwrap(await actions.atualizarCategoria(id, body));
  },

  async excluir(id: string): Promise<void> {
    return unwrap(await actions.excluirCategoria(id));
  },

  async definirMeta(id: string, body: DefinirMetaBody): Promise<MetaMensalDTO> {
    return unwrap(await actions.definirMeta(id, body));
  },

  async removerMeta(id: string, competencia: string): Promise<void> {
    return unwrap(await actions.removerMeta(id, competencia));
  },

  async consumo(competencia: string): Promise<ConsumoCategoriaDTO[]> {
    return unwrap(await actions.consumoCategorias(competencia));
  },
};
