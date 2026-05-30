/** Lançado ao criar/editar balde com nome já existente (mapeado para 409). */
export class BaldeDuplicadoError extends Error {
  constructor(nome: string) {
    super(`Já existe um balde "${nome}".`);
    this.name = 'BaldeDuplicadoError';
  }
}
