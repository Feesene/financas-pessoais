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
  /** Categoria cadastrada referenciada (null para lançamentos ainda não migrados). */
  categoriaId: string | null;
  descricao: string | null;
  /** Valor em reais, sempre positivo. O sinal é dado por `tipo`. */
  valor: number;
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  /** Regra recorrente que gerou este lançamento; null se lançado manualmente. */
  origemRegraId: string | null;
  /** Índice (1-based) da ocorrência dentro da regra; null se manual. */
  ocorrenciaIndice: number | null;
  /** true se a ocorrência (de recorrência) já foi paga. Sempre false em lançamentos manuais. */
  pago: boolean;
  /** Valor efetivamente pago (numeric 2 casas) ou null se ainda não pago / lançamento manual. */
  valorPago: number | null;
}

/** Corpo do registro de pagamento de uma ocorrência recorrente. */
export interface RegistrarPagamentoDTO {
  pago: boolean;
  /** Se ausente e pago=true, assume o valor previsto. */
  valorPago?: number | null;
}

/** Frequência de uma regra recorrente. No MVP só mensal. */
export type Frequencia = 'MENSAL';

/** Regra recorrente exposta pela API. Parcelamento = regra com `numeroParcelas` definido. */
export interface RegraRecorrenteDTO {
  id: string;
  tipo: TipoLancamento;
  categoriaId: string;
  descricao: string | null;
  /** Valor mensal (recorrência) ou valor total a parcelar (parcelamento). */
  valorBase: number;
  frequencia: Frequencia;
  /** Mês de início no formato AAAA-MM. */
  competenciaInicio: string;
  /** Mês de fim (AAAA-MM) ou null para recorrência sem fim. */
  competenciaFim: string | null;
  /** Número de parcelas; null para recorrência. */
  numeroParcelas: number | null;
  ativa: boolean;
}

/** Resultado da materialização de uma competência. */
export interface MaterializarResultadoDTO {
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  /** Quantidade de lançamentos criados (0 se já materializado). */
  criados: number;
}

/** Categoria cadastrada, reutilizável na classificação de lançamentos. */
export interface CategoriaDTO {
  id: string;
  nome: string;
  tipo: TipoLancamento;
  /** Cor em hex (ex.: "#22c55e") ou null. Meramente visual. */
  cor: string | null;
}

/** Meta mensal de gasto de uma categoria de despesa, por competência. */
export interface MetaMensalDTO {
  id: string;
  categoriaId: string;
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  /** Limite em reais, sempre > 0. */
  valor: number;
}

/** Consumo da meta de uma categoria numa competência (leitura, não persistido). */
export interface ConsumoCategoriaDTO {
  categoria: CategoriaDTO;
  /** Meta da competência, ou null se não houver meta definida. */
  meta: number | null;
  /** Total gasto (despesas) na categoria/competência. */
  gasto: number;
  /** gasto/meta (0..n), ou null se sem meta. */
  percentual: number | null;
  /** true somente se gasto > meta (100% exato não estoura). */
  estourou: boolean;
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
  categoriaId?: string | null;
  descricao?: string | null;
  valor: number;
  competencia: string;
}

/** Natureza de um movimento de reserva: entrada (aporte) ou saída (retirada). */
export type TipoMovimentoReserva = 'APORTE' | 'RETIRADA';

/** Balde (objetivo de reserva) exposto pela API. */
export interface BaldeDTO {
  id: string;
  nome: string;
  /** Saldo inicial em reais, ≥ 0. */
  saldoInicial: number;
  /** Cor em hex (ex.: "#22c55e") ou null. Meramente visual. */
  cor: string | null;
}

/** Aporte ou retirada de um balde, por competência. */
export interface MovimentoReservaDTO {
  id: string;
  baldeId: string;
  tipo: TipoMovimentoReserva;
  /** Valor em reais, sempre > 0. */
  valor: number;
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  descricao: string | null;
}

/** Saldo de um balde até uma competência (leitura, derivado dos movimentos). */
export interface SaldoBaldeDTO {
  balde: BaldeDTO;
  /** saldoInicial + Σaportes − Σretiradas até a competência. */
  saldo: number;
  /** true quando o saldo é negativo (permitido, apenas sinalizado). */
  negativo: boolean;
}

/** Saldos de todos os baldes numa competência + total geral (leitura). */
export interface SaldosReservaDTO {
  /** Competência consultada (AAAA-MM) ou null para o saldo atual total. */
  competencia: string | null;
  baldes: SaldoBaldeDTO[];
  total: number;
}

/** Um ponto da evolução cumulativa do saldo de um balde. */
export interface EvolucaoBaldeDTO {
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  saldo: number;
}

// ----------------------------------------------------------------------------
// Carteira de investimentos (P6).
// ----------------------------------------------------------------------------

/** Classe do ativo na carteira. */
export type TipoAtivo = 'FUNDO' | 'ACAO' | 'FII';

/** Natureza de um movimento de carteira. */
export type TipoMovimentoCarteira = 'ENTRADA' | 'SAIDA' | 'RENDIMENTO';

/** Ativo da carteira exposto pela API. */
export interface AtivoDTO {
  id: string;
  tipo: TipoAtivo;
  descricao: string;
  /** Quantidade (ações/FIIs); null para fundos. */
  quantidade: number | null;
  /** Valor unitário em reais (ações/FIIs); null para fundos. */
  valorUnitario: number | null;
  /** Fundo: informado; ação/FII: derivado quantidade × valorUnitario. */
  valorBruto: number;
  /** Rendimento acumulado informado, em reais. */
  rendimento: number;
}

/** Movimento de carteira (entrada/saída/rendimento) por competência. */
export interface MovimentoCarteiraDTO {
  id: string;
  ativoId: string;
  tipo: TipoMovimentoCarteira;
  /** Valor em reais, sempre > 0. */
  valor: number;
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  descricao: string | null;
}

/** Subtotal de uma classe de ativo na posição da carteira. */
export interface SubtotalTipoDTO {
  tipo: TipoAtivo;
  total: number;
  rendimento: number;
}

/** Posição atual da carteira: ativos, subtotais por tipo e totais gerais. */
export interface PosicaoCarteiraDTO {
  ativos: AtivoDTO[];
  subtotais: SubtotalTipoDTO[];
  total: number;
  rendimentoTotal: number;
}

/** Linha do histórico mensal da carteira (agregação por competência). */
export interface HistoricoCarteiraItemDTO {
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  entradas: number;
  saidas: number;
  rendimentos: number;
  /** entradas + rendimentos − saidas. */
  fluxoLiquido: number;
}

// ----------------------------------------------------------------------------
// Relatórios e histórico (P5) — DTOs de leitura/agregação (nada persistido).
// ----------------------------------------------------------------------------

/** Linha consolidada de uma competência (AAAA-MM). */
export interface ConsolidadoMensalDTO {
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  liquidoRecebido: number;
  gastos: number;
  poupanca: number;
  viagem: number;
  /** liquidoRecebido − gastos − poupanca − viagem. */
  sobras: number;
}

/** Totais do período consolidado. */
export interface TotaisAnoDTO {
  liquidoRecebido: number;
  gastos: number;
  poupanca: number;
  viagem: number;
  sobras: number;
}

/** Consolidado de um intervalo de competências + totais. */
export interface ConsolidadoDTO {
  /** Competência inicial (AAAA-MM). */
  de: string;
  /** Competência final (AAAA-MM). */
  ate: string;
  meses: ConsolidadoMensalDTO[];
  totais: TotaisAnoDTO;
}

/** Gasto agregado de uma categoria num período, com participação no total. */
export interface GastoPorCategoriaItemDTO {
  categoria: CategoriaDTO;
  total: number;
  /** Participação (0..1) do gasto da categoria no total de despesas do período. */
  percentual: number;
}

/** Ponto da evolução mensal: receitas, despesas e saldo de uma competência. */
export interface EvolucaoMensalItemDTO {
  /** Mês de competência no formato AAAA-MM. */
  competencia: string;
  receitas: number;
  despesas: number;
  /** receitas − despesas. */
  saldo: number;
}

/** Comparação do gasto de uma categoria entre dois meses. */
export interface ComparacaoCategoriaItemDTO {
  categoria: CategoriaDTO;
  gastoA: number;
  gastoB: number;
  /** gastoB − gastoA. */
  variacao: number;
  /** (gastoB − gastoA) / gastoA; null quando gastoA = 0 (evita divisão por zero). */
  variacaoPct: number | null;
}

/** Comparação entre dois meses (A e B) por categoria. */
export interface ComparacaoMesesDTO {
  /** Competência A (AAAA-MM). */
  a: string;
  /** Competência B (AAAA-MM). */
  b: string;
  itens: ComparacaoCategoriaItemDTO[];
}

/** Formato suportado na exportação de relatórios. */
export type FormatoExportacao = 'pdf' | 'xlsx';

// ----------------------------------------------------------------------------
// Projeções de juros compostos (P7) — cálculo determinístico, nada persistido
// por padrão (cenários nomeados são opcionais).
// ----------------------------------------------------------------------------

/** Parâmetros de entrada da projeção. `taxaAnual` é fração (0.1 = 10% a.a.). */
export interface ProjecaoParametrosDTO {
  /** Aporte inicial em reais, ≥ 0. */
  entrada: number;
  /** Aporte mensal em reais, ≥ 0. */
  aporteMensal: number;
  /** Taxa anual como fração (0.1 = 10% a.a.), ≥ 0. */
  taxaAnual: number;
  /** Horizonte em anos, inteiro de 1 a 60. */
  anos: number;
}

/** Resultado agregado de um ano da projeção. */
export interface ProjecaoAnoDTO {
  /** Ano da projeção (1..anos). */
  ano: number;
  /** entrada + aporteMensal × (ano × 12). */
  totalAportado: number;
  /** Saldo sem rendimento (apenas aportes acumulados). */
  saldoNaoInvestido: number;
  /** Saldo com capitalização mensal. */
  saldoInvestido: number;
  /** saldoInvestido − totalAportado. */
  jurosAcumulados: number;
}

/** Resultado completo da projeção: linhas por ano + totais finais. */
export interface ProjecaoResultadoDTO {
  parametros: ProjecaoParametrosDTO;
  anos: ProjecaoAnoDTO[];
  totalFinalInvestido: number;
  totalFinalNaoInvestido: number;
  /** totalFinalInvestido − totalFinalNaoInvestido. */
  jurosGanhos: number;
}

/** Cenário de projeção nomeado (persistido apenas se RF-008 ativo). */
export interface CenarioProjecaoDTO {
  id: string;
  nome: string;
  parametros: ProjecaoParametrosDTO;
  /** ISO-8601. */
  criadoEm: string;
}
