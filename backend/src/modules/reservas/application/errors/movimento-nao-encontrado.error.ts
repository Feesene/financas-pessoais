/** Lançado ao operar sobre um movimento inexistente (mapeado para 404). */
export class MovimentoNaoEncontradoError extends Error {
  constructor(id: string) {
    super(`Movimento ${id} não encontrado.`);
    this.name = 'MovimentoNaoEncontradoError';
  }
}
