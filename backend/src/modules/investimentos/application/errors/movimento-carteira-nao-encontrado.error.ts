/** Lançado ao operar sobre um movimento de carteira inexistente (mapeado para 404). */
export class MovimentoCarteiraNaoEncontradoError extends Error {
  constructor(id: string) {
    super(`Movimento ${id} não encontrado.`);
    this.name = 'MovimentoCarteiraNaoEncontradoError';
  }
}
