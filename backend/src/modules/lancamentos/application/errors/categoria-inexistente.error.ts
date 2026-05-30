/** Lançado quando um lançamento referencia uma categoria que não existe (mapeado para 400). */
export class CategoriaInexistenteError extends Error {
  constructor(categoriaId: string) {
    super(`Categoria ${categoriaId} não encontrada.`);
    this.name = 'CategoriaInexistenteError';
  }
}
