/** Lançado quando os parâmetros da projeção são inválidos (mapeado para 400). */
export class ParametrosInvalidosError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParametrosInvalidosError';
  }
}
