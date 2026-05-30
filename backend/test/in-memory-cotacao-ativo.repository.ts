import type { CotacaoAtivo } from '../src/modules/investimentos/domain/entities/cotacao-ativo';
import type { CotacaoAtivoRepository } from '../src/modules/investimentos/domain/repositories/cotacao-ativo.repository';

/** Repositório de cotações de ativo em memória para testes (upsert por ativoId+competencia). */
export class InMemoryCotacaoAtivoRepository implements CotacaoAtivoRepository {
  private readonly store = new Map<string, CotacaoAtivo>();

  private chave(ativoId: string, competencia: string): string {
    return `${ativoId}::${competencia}`;
  }

  async save(cotacao: CotacaoAtivo): Promise<void> {
    this.store.set(this.chave(cotacao.ativoId, cotacao.competencia), cotacao);
  }

  async findByAtivo(ativoId: string): Promise<CotacaoAtivo[]> {
    return [...this.store.values()]
      .filter((c) => c.ativoId === ativoId)
      .sort((a, b) => a.competencia.localeCompare(b.competencia));
  }

  async findMaisRecentePorAtivo(ativoId: string): Promise<CotacaoAtivo | null> {
    const ordenadas = await this.findByAtivo(ativoId);
    return ordenadas.length > 0 ? ordenadas[ordenadas.length - 1] : null;
  }

  async findByAtivoECompetencia(
    ativoId: string,
    competencia: string,
  ): Promise<CotacaoAtivo | null> {
    return this.store.get(this.chave(ativoId, competencia)) ?? null;
  }

  async delete(ativoId: string, competencia: string): Promise<boolean> {
    return this.store.delete(this.chave(ativoId, competencia));
  }
}
