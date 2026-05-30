import type { Ativo } from '../entities/ativo';

export interface AtivoRepository {
  save(ativo: Ativo): Promise<void>;
  findAll(): Promise<Ativo[]>;
  findById(id: string): Promise<Ativo | null>;
  /** Remove um ativo; retorna false se o id não existir. */
  delete(id: string): Promise<boolean>;
}

export const ATIVO_REPOSITORY = Symbol('AtivoRepository');
