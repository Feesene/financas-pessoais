/**
 * Lançado quando uma retirada (nova ou editada) deixaria o balde negativo em
 * alguma competência. Mapeado para 409.
 */
export class SaldoInsuficienteError extends Error {
  constructor(
    readonly competencia: string,
    readonly saldoEmCentavos: number,
  ) {
    super(
      `Saldo insuficiente: o balde ficaria com ${formatarReais(saldoEmCentavos)} em ${competencia}.`,
    );
    this.name = 'SaldoInsuficienteError';
  }
}

/** Formata centavos como "R$ -120,00" sem depender do ICU do runtime. */
function formatarReais(centavos: number): string {
  const sinal = centavos < 0 ? '-' : '';
  const absoluto = Math.abs(centavos);
  const inteiros = Math.floor(absoluto / 100);
  const resto = String(absoluto % 100).padStart(2, '0');
  return `R$ ${sinal}${inteiros},${resto}`;
}
