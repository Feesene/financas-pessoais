import type { CategoriaDTO } from '@financas-pessoais/shared';

/**
 * Consulta de categorias (P2) usada por relatórios.
 * Implementada na infraestrutura como Anti-Corruption Layer sobre o repositório real.
 */
export interface CategoriaQueryPort {
  /** Lista todas as categorias (id, nome, tipo, cor). */
  listar(): Promise<CategoriaDTO[]>;
}

export const CATEGORIA_QUERY_PORT = Symbol('CategoriaQueryPort');
