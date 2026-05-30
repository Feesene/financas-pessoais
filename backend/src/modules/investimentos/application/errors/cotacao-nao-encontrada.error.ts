/** Lançado ao excluir uma cotação inexistente (mapeado para 404). */
export class CotacaoNaoEncontradaError extends Error {
  constructor(ativoId: string, competencia: string) {
    super(`Cotação do ativo ${ativoId} na competência ${competencia} não encontrada.`);
    this.name = 'CotacaoNaoEncontradaError';
  }
}
