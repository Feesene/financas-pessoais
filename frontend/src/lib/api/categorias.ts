import type {
  CategoriaDTO,
  ConsumoCategoriaDTO,
  MetaMensalDTO,
  TipoLancamento,
} from '@financas-pessoais/shared';
import { request } from './http';

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
  listar(): Promise<CategoriaDTO[]> {
    return request<CategoriaDTO[]>('/categorias');
  },

  criar(body: CriarCategoriaBody): Promise<CategoriaDTO> {
    return request<CategoriaDTO>('/categorias', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  atualizar(id: string, body: AtualizarCategoriaBody): Promise<CategoriaDTO> {
    return request<CategoriaDTO>(`/categorias/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  excluir(id: string): Promise<void> {
    return request<void>(`/categorias/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },

  definirMeta(id: string, body: DefinirMetaBody): Promise<MetaMensalDTO> {
    return request<MetaMensalDTO>(`/categorias/${encodeURIComponent(id)}/metas`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  removerMeta(id: string, competencia: string): Promise<void> {
    return request<void>(
      `/categorias/${encodeURIComponent(id)}/metas?competencia=${encodeURIComponent(competencia)}`,
      { method: 'DELETE' },
    );
  },

  consumo(competencia: string): Promise<ConsumoCategoriaDTO[]> {
    return request<ConsumoCategoriaDTO[]>(
      `/categorias/consumo?competencia=${encodeURIComponent(competencia)}`,
    );
  },
};
