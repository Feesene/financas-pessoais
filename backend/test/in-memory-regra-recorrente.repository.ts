import type { RegraRecorrente } from '../src/modules/recorrencias/domain/entities/regra-recorrente';
import type { RegraRecorrenteRepository } from '../src/modules/recorrencias/domain/repositories/regra-recorrente.repository';

/** Repositório de regras recorrentes em memória para testes. */
export class InMemoryRegraRecorrenteRepository implements RegraRecorrenteRepository {
  private readonly store = new Map<string, RegraRecorrente>();

  async save(regra: RegraRecorrente): Promise<void> {
    this.store.set(regra.id, regra);
  }

  async findAll(): Promise<RegraRecorrente[]> {
    return [...this.store.values()];
  }

  async findById(id: string): Promise<RegraRecorrente | null> {
    return this.store.get(id) ?? null;
  }

  async findAtivasNaCompetencia(competencia: string): Promise<RegraRecorrente[]> {
    return [...this.store.values()].filter(
      (r) =>
        r.ativa &&
        r.competenciaInicio <= competencia &&
        (r.competenciaFim === null || r.competenciaFim >= competencia),
    );
  }
}
