import type { TipoLancamento } from '@financas-pessoais/shared';
import type { Categoria } from '../src/modules/categorias/domain/entities/categoria';
import type { CategoriaRepository } from '../src/modules/categorias/domain/repositories/categoria.repository';

/** Repositório de categorias em memória para testes. */
export class InMemoryCategoriaRepository implements CategoriaRepository {
  private readonly store = new Map<string, Categoria>();

  async save(categoria: Categoria): Promise<void> {
    this.store.set(categoria.id, categoria);
  }

  async findAll(): Promise<Categoria[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<Categoria | null> {
    return this.store.get(id) ?? null;
  }

  async findByNomeETipo(nome: string, tipo: TipoLancamento): Promise<Categoria | null> {
    const alvo = nome.trim().toLowerCase();
    return (
      [...this.store.values()].find(
        (c) => c.nome.toLowerCase() === alvo && c.tipo === tipo,
      ) ?? null
    );
  }

  async delete(id: string): Promise<boolean> {
    return this.store.delete(id);
  }
}
