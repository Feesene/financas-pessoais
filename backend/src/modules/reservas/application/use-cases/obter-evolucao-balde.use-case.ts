import { Inject, Injectable } from '@nestjs/common';
import type { EvolucaoBaldeDTO } from '@financas-pessoais/shared';
import { BALDE_REPOSITORY, type BaldeRepository } from '../../domain/repositories/balde.repository';
import {
  MOVIMENTO_RESERVA_REPOSITORY,
  type MovimentoReservaRepository,
} from '../../domain/repositories/movimento-reserva.repository';
import { BaldeNaoEncontradoError } from '../errors/balde-nao-encontrado.error';

@Injectable()
export class ObterEvolucaoBaldeUseCase {
  constructor(
    @Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository,
    @Inject(MOVIMENTO_RESERVA_REPOSITORY)
    private readonly movimentos: MovimentoReservaRepository,
  ) {}

  /**
   * Evolução cumulativa do saldo de um balde: um ponto por competência com
   * movimentos, contendo o saldo acumulado ao fim daquela competência
   * (saldoInicial + Σefeitos até ela). Cálculo em centavos.
   */
  async execute(baldeId: string): Promise<EvolucaoBaldeDTO[]> {
    const balde = await this.baldes.findById(baldeId);
    if (!balde) {
      throw new BaldeNaoEncontradoError(baldeId);
    }

    const movimentos = await this.movimentos.findByBaldeId(baldeId);

    // Agrupa o efeito líquido (centavos) por competência.
    const efeitoPorCompetencia = new Map<string, number>();
    for (const movimento of movimentos) {
      const atual = efeitoPorCompetencia.get(movimento.competencia) ?? 0;
      efeitoPorCompetencia.set(movimento.competencia, atual + movimento.efeitoEmCentavos);
    }

    const competencias = [...efeitoPorCompetencia.keys()].sort();

    let acumuladoCentavos = Math.round(balde.saldoInicial * 100);
    return competencias.map((competencia) => {
      acumuladoCentavos += efeitoPorCompetencia.get(competencia) ?? 0;
      return { competencia, saldo: acumuladoCentavos / 100 };
    });
  }
}
