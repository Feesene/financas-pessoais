/** Lançado quando uma categoria referenciada por id não existe (mapeado para 404). */
export class CategoriaNaoEncontradaError extends Error {
  constructor(id: string) {
    super(`Categoria ${id} não encontrada.`);
    this.name = 'CategoriaNaoEncontradaError';
  }
}
