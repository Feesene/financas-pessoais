import type { Lancamento } from '../entities/lancamento';

export interface LancamentoRepository {
  save(lancamento: Lancamento): Promise<void>;
  /** Lista os lançamentos de um mês de competência (AAAA-MM). */
  findByCompetencia(competencia: string): Promise<Lancamento[]>;
  /** Busca um lançamento pelo id; null se não existir. */
  findById(id: string): Promise<Lancamento | null>;
  /** Remove um lançamento; retorna false se o id não existir. */
  delete(id: string): Promise<boolean>;
}

export const LANCAMENTO_REPOSITORY = Symbol('LancamentoRepository');
