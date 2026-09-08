import type { ModoValor } from '@financas-pessoais/shared';

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

/**
 * Totais orçados e realizados por competência.
 *
 * `*Previsto` é o valor como foi lançado (o plano), sem correção pelo que foi
 * pago; `*Pago` é o total realizado — a mesma conta do modo REALIZADO. Os dois
 * juntos formam a comparação orçado × realizado do painel.
 */
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
  somarPorTipoECompetencia(
    de: string,
    ate: string,
    modo?: ModoValor,
  ): Promise<SomaTipoCompetencia[]>;
  /** Soma despesas agrupadas por categoriaId no intervalo [de, ate]. */
  somarDespesaPorCategoria(
    de: string,
    ate: string,
    modo?: ModoValor,
  ): Promise<DespesaPorCategoria[]>;
  /** Soma previsto e pago de receitas/despesas por competência no intervalo [de, ate]. */
  somarPrevistoPagoPorCompetencia(de: string, ate: string): Promise<PrevistoPagoCompetencia[]>;
}

export const LANCAMENTO_QUERY_PORT = Symbol('LancamentoQueryPort');
