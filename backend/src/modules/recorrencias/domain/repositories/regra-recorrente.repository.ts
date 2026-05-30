import type { RegraRecorrente } from '../entities/regra-recorrente';

export interface RegraRecorrenteRepository {
  save(regra: RegraRecorrente): Promise<void>;
  findAll(): Promise<RegraRecorrente[]>;
  findById(id: string): Promise<RegraRecorrente | null>;
  /** Regras ativas que podem gerar ocorrência na competência (AAAA-MM). */
  findAtivasNaCompetencia(competencia: string): Promise<RegraRecorrente[]>;
}

export const REGRA_RECORRENTE_REPOSITORY = Symbol('RegraRecorrenteRepository');
