/** Lançado ao operar sobre um ativo inexistente (mapeado para 404). */
export class AtivoNaoEncontradoError extends Error {
  constructor(id: string) {
    super(`Ativo ${id} não encontrado.`);
    this.name = 'AtivoNaoEncontradoError';
  }
}
