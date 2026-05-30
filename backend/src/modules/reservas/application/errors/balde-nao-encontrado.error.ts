/** Lançado ao operar sobre um balde inexistente (mapeado para 404). */
export class BaldeNaoEncontradoError extends Error {
  constructor(id: string) {
    super(`Balde ${id} não encontrado.`);
    this.name = 'BaldeNaoEncontradoError';
  }
}
