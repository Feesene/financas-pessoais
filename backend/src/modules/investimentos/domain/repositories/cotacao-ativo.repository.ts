import type { CotacaoAtivo } from '../entities/cotacao-ativo';

export interface CotacaoAtivoRepository {
  /** Upsert por (ativoId, competencia): cria ou sobrescreve o snapshot do mês. */
  save(cotacao: CotacaoAtivo): Promise<void>;
  /** Cotações de um ativo, ordenadas por competência ascendente. */
  findByAtivo(ativoId: string): Promise<CotacaoAtivo[]>;
  /** Cotação da competência mais recente do ativo, ou null se não houver. */
  findMaisRecentePorAtivo(ativoId: string): Promise<CotacaoAtivo | null>;
  /** Cotação exata de uma competência, ou null. */
  findByAtivoECompetencia(ativoId: string, competencia: string): Promise<CotacaoAtivo | null>;
  /** Remove a cotação de (ativoId, competencia); retorna false se não existir. */
  delete(ativoId: string, competencia: string): Promise<boolean>;
}

export const COTACAO_ATIVO_REPOSITORY = Symbol('CotacaoAtivoRepository');
