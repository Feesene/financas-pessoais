import type { MetaMensal } from '../src/modules/categorias/domain/entities/meta-mensal';
import type { MetaRepository } from '../src/modules/categorias/domain/repositories/meta.repository';

/** Repositório de metas em memória para testes. */
export class InMemoryMetaRepository implements MetaRepository {
  private readonly store = new Map<string, MetaMensal>();

  private chave(categoriaId: string, competencia: string): string {
    return `${categoriaId}::${competencia}`;
  }

  async save(meta: MetaMensal): Promise<void> {
    this.store.set(this.chave(meta.categoriaId, meta.competencia), meta);
  }

  async findByCompetencia(competencia: string): Promise<MetaMensal[]> {
    return [...this.store.values()].filter((m) => m.competencia === competencia);
  }

  async findByCategoriaECompetencia(
    categoriaId: string,
    competencia: string,
  ): Promise<MetaMensal | null> {
    return this.store.get(this.chave(categoriaId, competencia)) ?? null;
  }

  async delete(categoriaId: string, competencia: string): Promise<boolean> {
    return this.store.delete(this.chave(categoriaId, competencia));
  }
}
