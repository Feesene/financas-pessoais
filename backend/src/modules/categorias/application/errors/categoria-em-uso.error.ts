/** Lançado ao excluir categoria com lançamentos vinculados (mapeado para 409). */
export class CategoriaEmUsoError extends Error {
  constructor(id: string) {
    super(`Categoria ${id} possui lançamentos vinculados e não pode ser excluída.`);
    this.name = 'CategoriaEmUsoError';
  }
}
