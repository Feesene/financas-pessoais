import type { MetaMensal } from '../entities/meta-mensal';

export interface MetaRepository {
  /** Cria ou substitui a meta de (categoriaId, competencia). */
  save(meta: MetaMensal): Promise<void>;
  /** Metas de uma competência (todas as categorias). */
  findByCompetencia(competencia: string): Promise<MetaMensal[]>;
  /** Meta de uma categoria numa competência; null se não houver. */
  findByCategoriaECompetencia(categoriaId: string, competencia: string): Promise<MetaMensal | null>;
  /** Remove a meta de (categoriaId, competencia); false se não existir. */
  delete(categoriaId: string, competencia: string): Promise<boolean>;
}

export const META_REPOSITORY = Symbol('MetaRepository');
