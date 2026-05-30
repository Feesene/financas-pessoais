import type { Categoria } from '../entities/categoria';
import type { TipoLancamento } from '@financas-pessoais/shared';

export interface CategoriaRepository {
  save(categoria: Categoria): Promise<void>;
  findAll(): Promise<Categoria[]>;
  findById(id: string): Promise<Categoria | null>;
  /** Busca por (nome, tipo) para checar unicidade; null se não existir. */
  findByNomeETipo(nome: string, tipo: TipoLancamento): Promise<Categoria | null>;
  /** Remove uma categoria; retorna false se o id não existir. */
  delete(id: string): Promise<boolean>;
}

export const CATEGORIA_REPOSITORY = Symbol('CategoriaRepository');
