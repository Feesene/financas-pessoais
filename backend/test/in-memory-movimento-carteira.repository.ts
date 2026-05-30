import type { MovimentoCarteira } from '../src/modules/investimentos/domain/entities/movimento-carteira';
import type { MovimentoCarteiraRepository } from '../src/modules/investimentos/domain/repositories/movimento-carteira.repository';

/** Repositório de movimentos de carteira em memória para testes. */
export class InMemoryMovimentoCarteiraRepository implements MovimentoCarteiraRepository {
  private readonly store = new Map<string, MovimentoCarteira>();

  async save(movimento: MovimentoCarteira): Promise<void> {
    this.store.set(movimento.id, movimento);
  }

  async findById(id: string): Promise<MovimentoCarteira | null> {
    return this.store.get(id) ?? null;
  }

  async findAll(): Promise<MovimentoCarteira[]> {
    return [...this.store.values()];
  }

  async findByAtivoId(ativoId: string): Promise<MovimentoCarteira[]> {
    return [...this.store.values()].filter((m) => m.ativoId === ativoId);
  }

  async existsByAtivoId(ativoId: string): Promise<boolean> {
    return [...this.store.values()].some((m) => m.ativoId === ativoId);
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
