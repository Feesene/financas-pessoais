/** Lançado ao excluir ativo que ainda possui movimentos (mapeado para 409). */
export class AtivoComMovimentosError extends Error {
  constructor(id: string) {
    super(`O ativo ${id} possui movimentos e não pode ser excluído.`);
    this.name = 'AtivoComMovimentosError';
  }
}
