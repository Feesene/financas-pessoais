import type { MovimentoReserva } from '../src/modules/reservas/domain/entities/movimento-reserva';
import type { MovimentoReservaRepository } from '../src/modules/reservas/domain/repositories/movimento-reserva.repository';

/** Repositório de movimentos de reserva em memória para testes. */
export class InMemoryMovimentoReservaRepository implements MovimentoReservaRepository {
  private readonly store = new Map<string, MovimentoReserva>();

  async save(movimento: MovimentoReserva): Promise<void> {
    this.store.set(movimento.id, movimento);
  }

  async findById(id: string): Promise<MovimentoReserva | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<MovimentoReserva[]> {
    return [...this.store.values()];
  }

  async findByBaldeId(baldeId: string): Promise<MovimentoReserva[]> {
    return [...this.store.values()].filter((m) => m.baldeId === baldeId);
  }

  async existsByBaldeId(baldeId: string): Promise<boolean> {
    return [...this.store.values()].some((m) => m.baldeId === baldeId);
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
