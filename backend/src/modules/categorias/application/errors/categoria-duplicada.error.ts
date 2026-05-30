/** Lançado ao criar/editar categoria com (nome, tipo) já existente (mapeado para 409). */
export class CategoriaDuplicadaError extends Error {
  constructor(nome: string, tipo: string) {
    super(`Já existe uma categoria "${nome}" do tipo ${tipo}.`);
    this.name = 'CategoriaDuplicadaError';
  }
}
