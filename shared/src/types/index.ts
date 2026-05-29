// Tipos compartilhados entre frontend e backend.

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

/** Natureza de um lançamento financeiro. */
export type TipoLancamento = 'RECEITA' | 'DESPESA';

/** Representação de um lançamento exposto pela API (sem detalhes de persistência). */
export interface LancamentoDTO {
  id: string;
  tipo: TipoLancamento;
  categoria: string;
  descricao: string | null;
  /** Valor em reais, sempre positivo. O sinal é dado por `tipo`. */
  valor: number;
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
}

/** Totais de um mês de competência (leitura, não persistido). */
export interface ResumoMensalDTO {
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  totalReceitas: number;
  totalDespesas: number;
  /** totalReceitas - totalDespesas. */
  saldo: number;
}

/** Corpo para edição (substituição completa) de um lançamento via PUT. */
export interface AtualizarLancamentoDTO {
  tipo: TipoLancamento;
  categoria: string;
  descricao?: string | null;
  valor: number;
  competencia: string;
}
