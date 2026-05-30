import { Inject, Injectable } from '@nestjs/common';
import type { MovimentoReservaComBaldeDTO } from '@financas-pessoais/shared';
import { BALDE_REPOSITORY, type BaldeRepository } from '../../domain/repositories/balde.repository';
import {
  MOVIMENTO_RESERVA_REPOSITORY,
  type MovimentoReservaRepository,
} from '../../domain/repositories/movimento-reserva.repository';
import { movimentoToDTO } from './registrar-movimento.use-case';

@Injectable()
export class ListarMovimentosCompetenciaUseCase {
  constructor(
    @Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository,
    @Inject(MOVIMENTO_RESERVA_REPOSITORY)
    private readonly movimentos: MovimentoReservaRepository,
  ) {}

  /** Movimentos (aportes e retiradas) de uma competência, com o nome do balde. */
  async execute(competencia: string): Promise<MovimentoReservaComBaldeDTO[]> {
    const [movimentos, baldes] = await Promise.all([
      this.movimentos.findByCompetencia(competencia),
      this.baldes.findAll(),
    ]);

    const nomePorBalde = new Map(baldes.map((b) => [b.id, b.nome]));

    return movimentos
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      .map((movimento) => ({
        ...movimentoToDTO(movimento),
        baldeNome: nomePorBalde.get(movimento.baldeId) ?? '—',
      }));
  }
}
