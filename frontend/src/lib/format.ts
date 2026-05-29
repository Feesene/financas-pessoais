const BRL = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
});

/** Formata um valor numérico em reais (pt-BR), ex.: 1234.5 -> "R$ 1.234,50". */
export function formatarReais(valor: number): string {
  return BRL.format(valor);
}
