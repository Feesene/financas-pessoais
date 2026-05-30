export class RegraNaoEncontradaError extends Error {
  constructor(id: string) {
    super(`Regra recorrente ${id} não encontrada.`);
    this.name = 'RegraNaoEncontradaError';
  }
}
