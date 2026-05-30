export class CategoriaInexistenteError extends Error {
  constructor(categoriaId: string) {
    super(`Categoria ${categoriaId} não existe.`);
    this.name = 'CategoriaInexistenteError';
  }
}
