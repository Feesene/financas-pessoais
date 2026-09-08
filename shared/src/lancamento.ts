/**
 * Definição única de "quanto vale um lançamento numa agregação".
 *
 * Toda soma de lançamento do sistema — resumo mensal, consumo de metas,
 * relatórios e subtotais da lista — passa por aqui, para que as telas nunca
 * mostrem dois totais diferentes para o mesmo mês.
 *
 * Existem duas leituras legítimas de um mês, e a tela escolhe qual mostrar:
 *
 * - **PREVISTO** (padrão): o mês é o compromisso assumido, então toda linha
 *   conta, paga ou não. É a leitura de quem planeja.
 * - **REALIZADO**: só o dinheiro que já se moveu. É a leitura de quem confere
 *   o extrato.
 *
 * Em ambos os modos, uma ocorrência marcada como paga vale o valor pago: o
 * realizado é sempre mais verdadeiro que a estimativa.
 */

/** Modo de leitura dos totais de um mês. */
export type ModoValor = 'PREVISTO' | 'REALIZADO';

export const MODOS_VALOR: readonly ModoValor[] = ['PREVISTO', 'REALIZADO'];

export function isModoValor(valor: unknown): valor is ModoValor {
  return valor === 'PREVISTO' || valor === 'REALIZADO';
}

/** Campos de um lançamento necessários para o cálculo. Vale para a entidade e para o DTO. */
export interface ValoresLancamento {
  valor: number;
  pago: boolean;
  valorPago: number | null;
}

/** O mesmo, mais a origem — necessária para saber se a linha já se realizou. */
export interface LancamentoAgregavel extends ValoresLancamento {
  origemRegraId: string | null;
}

/** Valor que rege as agregações: o pago quando marcado, senão o previsto. */
export function valorEfetivo(lancamento: ValoresLancamento): number {
  return lancamento.pago && lancamento.valorPago !== null ? lancamento.valorPago : lancamento.valor;
}

/**
 * Se a linha entra no total do modo pedido.
 *
 * No modo REALIZADO, um lançamento manual sempre conta: ele é o registro de um
 * fato consumado e nem admite ser marcado como pago. Só a ocorrência gerada por
 * uma recorrência espera a marcação, porque nasce como previsão.
 */
export function contaNoModo(lancamento: LancamentoAgregavel, modo: ModoValor): boolean {
  if (modo === 'PREVISTO') return true;
  return lancamento.origemRegraId === null || lancamento.pago;
}

/** Valor da linha no modo pedido; zero quando ela não conta nesse modo. */
export function valorNoModo(lancamento: LancamentoAgregavel, modo: ModoValor): number {
  return contaNoModo(lancamento, modo) ? valorEfetivo(lancamento) : 0;
}

/** Soma os valores efetivos de uma lista (equivale ao modo PREVISTO). */
export function somarValorEfetivo(lancamentos: readonly ValoresLancamento[]): number {
  return somarEmCentavos(lancamentos, valorEfetivo);
}

/** Soma uma lista no modo pedido. */
export function somarNoModo(
  lancamentos: readonly LancamentoAgregavel[],
  modo: ModoValor,
): number {
  return somarEmCentavos(lancamentos, (lancamento) => valorNoModo(lancamento, modo));
}

/**
 * Acumula em centavos (inteiros) para não propagar erro de ponto flutuante —
 * 0,1 + 0,2 devolve 0,3.
 */
function somarEmCentavos<T>(itens: readonly T[], valorDe: (item: T) => number): number {
  const centavos = itens.reduce((soma, item) => soma + Math.round(valorDe(item) * 100), 0);
  return centavos / 100;
}
