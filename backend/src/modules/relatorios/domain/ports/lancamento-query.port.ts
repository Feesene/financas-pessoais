/** Receitas e despesas (em reais) somadas numa competência. */
export interface SomaTipoCompetencia {
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  receitas: number;
  despesas: number;
}

/** Total de despesas (em reais) de uma categoria num período. */
export interface DespesaPorCategoria {
  /** Categoria cadastrada; null para lançamentos sem categoria atribuída. */
  categoriaId: string | null;
  total: number;
}

/** Totais previsto (valor) e pago (valorEfetivo com pago=true) por competência. */
export interface PrevistoPagoCompetencia {
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  receitasPrevisto: number;
  receitasPago: number;
  despesasPrevisto: number;
  despesasPago: number;
}

/**
 * Consulta de lançamentos (P1) usada por relatórios.
 * Implementada na infraestrutura como Anti-Corruption Layer sobre o repositório real.
 */
export interface LancamentoQueryPort {
  /** Soma receitas e despesas por competência no intervalo [de, ate]. Só meses com dados. */
  somarPorTipoECompetencia(de: string, ate: string): Promise<SomaTipoCompetencia[]>;
  /** Soma despesas agrupadas por categoriaId no intervalo [de, ate]. */
  somarDespesaPorCategoria(de: string, ate: string): Promise<DespesaPorCategoria[]>;
  /** Soma previsto e pago de receitas/despesas por competência no intervalo [de, ate]. */
  somarPrevistoPagoPorCompetencia(de: string, ate: string): Promise<PrevistoPagoCompetencia[]>;
}

export const LANCAMENTO_QUERY_PORT = Symbol('LancamentoQueryPort');
