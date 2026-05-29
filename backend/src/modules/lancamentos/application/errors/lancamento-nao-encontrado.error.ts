/** Lançado quando um lançamento referenciado por id não existe (mapeado para 404 na borda HTTP). */
export class LancamentoNaoEncontradoError extends Error {
  constructor(id: string) {
    super(`Lançamento ${id} não encontrado.`);
    this.name = 'LancamentoNaoEncontradoError';
  }
}
