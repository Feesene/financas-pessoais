/**
 * Definição única de "quanto vale um lançamento numa agregação".
 *
 * Toda soma de lançamento do sistema — resumo mensal, consumo de metas,
 * relatórios e subtotais da lista — passa por aqui, para que as telas nunca
 * mostrem dois totais diferentes para o mesmo mês.
 *
 * Semântica adotada (**previsto manda**): o mês é o compromisso assumido, então
 * toda linha conta, esteja paga ou não. Quando a ocorrência foi marcada como
 * paga com um valor diferente do previsto, o valor pago substitui o previsto —
 * o realizado é sempre mais verdadeiro que a estimativa.
 */

/** Campos de um lançamento necessários para o cálculo. Vale para a entidade e para o DTO. */
export interface ValoresLancamento {
  valor: number;
  pago: boolean;
  valorPago: number | null;
}

/** Valor que rege as agregações: o pago quando marcado, senão o previsto. */
export function valorEfetivo(lancamento: ValoresLancamento): number {
  return lancamento.pago && lancamento.valorPago !== null ? lancamento.valorPago : lancamento.valor;
}

/**
 * Soma os valores efetivos de uma lista. Acumula em centavos (inteiros) para
 * não propagar erro de ponto flutuante — 0,1 + 0,2 devolve 0,3.
 */
export function somarValorEfetivo(lancamentos: readonly ValoresLancamento[]): number {
  const centavos = lancamentos.reduce(
    (soma, lancamento) => soma + Math.round(valorEfetivo(lancamento) * 100),
    0,
  );
  return centavos / 100;
}
