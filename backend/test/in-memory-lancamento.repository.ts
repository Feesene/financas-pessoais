import type { Lancamento } from '../src/modules/lancamentos/domain/entities/lancamento';
import type { LancamentoRepository } from '../src/modules/lancamentos/domain/repositories/lancamento.repository';

/** Repositório em memória para testes — substitui o TypeORM sem precisar de banco. */
export class InMemoryLancamentoRepository implements LancamentoRepository {
  private readonly store = new Map<string, Lancamento>();

  async save(lancamento: Lancamento): Promise<void> {
    this.store.set(lancamento.id, lancamento);
  }

  async findByCompetencia(competencia: string): Promise<Lancamento[]> {
    return [...this.store.values()].filter((l) => l.competencia === competencia);
  }

  async findById(id: string): Promise<Lancamento | null> {
    return this.store.get(id) ?? null;
  }

  async existsByCategoriaId(categoriaId: string): Promise<boolean> {
    return [...this.store.values()].some((l) => l.categoriaId === categoriaId);
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
