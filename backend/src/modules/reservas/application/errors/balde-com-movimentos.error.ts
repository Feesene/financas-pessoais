/** Lançado ao excluir balde que ainda possui movimentos (mapeado para 409). */
export class BaldeComMovimentosError extends Error {
  constructor(id: string) {
    super(`O balde ${id} possui movimentos e não pode ser excluído.`);
    this.name = 'BaldeComMovimentosError';
  }
}
