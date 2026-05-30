/** Lançado quando o intervalo de competências é inválido (mapeado para 400). */
export class IntervaloInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'IntervaloInvalidoError';
  }
}
