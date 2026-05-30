/** Aportes (em reais) classificados como poupança/viagem numa competência. */
export interface AportesReservaCompetencia {
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  poupanca: number;
  viagem: number;
}

/**
 * Consulta de reservas (P4) usada por relatórios.
 * Implementada na infraestrutura como Anti-Corruption Layer sobre o repositório real.
 *
 * Poupança/viagem são classificadas por nome do balde (P4 não modela categoria de balde) — ver D2.
 */
export interface ReservaQueryPort {
  /** Soma aportes de baldes poupança/viagem por competência no intervalo [de, ate]. Só meses com dados. */
  somarAportesPorBaldeCategoria(de: string, ate: string): Promise<AportesReservaCompetencia[]>;
}

export const RESERVA_QUERY_PORT = Symbol('ReservaQueryPort');
