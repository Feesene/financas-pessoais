/** Lançado ao remover meta inexistente para (categoria, competência) (mapeado para 404). */
export class MetaNaoEncontradaError extends Error {
  constructor(categoriaId: string, competencia: string) {
    super(`Meta da categoria ${categoriaId} em ${competencia} não encontrada.`);
    this.name = 'MetaNaoEncontradaError';
  }
}
