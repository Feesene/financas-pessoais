import type { Ativo } from '../src/modules/investimentos/domain/entities/ativo';
import type { AtivoRepository } from '../src/modules/investimentos/domain/repositories/ativo.repository';

/** Repositório de ativos em memória para testes. */
export class InMemoryAtivoRepository implements AtivoRepository {
  private readonly store = new Map<string, Ativo>();

  async save(ativo: Ativo): Promise<void> {
    this.store.set(ativo.id, ativo);
  }

  async findAll(): Promise<Ativo[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<Ativo | null> {
    return this.store.get(id) ?? null;
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
