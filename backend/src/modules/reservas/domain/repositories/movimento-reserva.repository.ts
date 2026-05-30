import type { MovimentoReserva } from '../entities/movimento-reserva';

export interface MovimentoReservaRepository {
  save(movimento: MovimentoReserva): Promise<void>;
  findById(id: string): Promise<MovimentoReserva | null>;
  findAll(): Promise<MovimentoReserva[]>;
  findByBaldeId(baldeId: string): Promise<MovimentoReserva[]>;
  /** Movimentos de uma competência (AAAA-MM), de todos os baldes. */
  findByCompetencia(competencia: string): Promise<MovimentoReserva[]>;
  /** true se o balde possui ao menos um movimento. */
  existsByBaldeId(baldeId: string): Promise<boolean>;
  /** Remove um movimento; retorna false se o id não existir. */
  delete(id: string): Promise<boolean>;
}

export const MOVIMENTO_RESERVA_REPOSITORY = Symbol('MovimentoReservaRepository');
