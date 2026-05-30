import type { Balde } from '../src/modules/reservas/domain/entities/balde';
import type { BaldeRepository } from '../src/modules/reservas/domain/repositories/balde.repository';

/** Repositório de baldes em memória para testes. */
export class InMemoryBaldeRepository implements BaldeRepository {
  private readonly store = new Map<string, Balde>();

  async save(balde: Balde): Promise<void> {
    this.store.set(balde.id, balde);
  }

  async findAll(): Promise<Balde[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<Balde | null> {
    return this.store.get(id) ?? null;
  }

  async findByNome(nome: string): Promise<Balde | null> {
    const alvo = nome.trim().toLowerCase();
    return [...this.store.values()].find((b) => b.nome.toLowerCase() === alvo) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
