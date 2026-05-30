import type { Balde } from '../entities/balde';

export interface BaldeRepository {
  save(balde: Balde): Promise<void>;
  findAll(): Promise<Balde[]>;
  findById(id: string): Promise<Balde | null>;
  /** Busca por nome (case-insensitive) para checar unicidade; null se não existir. */
  findByNome(nome: string): Promise<Balde | null>;
  /** Remove um balde; retorna false se o id não existir. */
  delete(id: string): Promise<boolean>;
}

export const BALDE_REPOSITORY = Symbol('BaldeRepository');
