import { Inject, Injectable } from '@nestjs/common';
import type { SaldoBaldeDTO, SaldosReservaDTO } from '@financas-pessoais/shared';
import type { Balde } from '../../domain/entities/balde';
import type { MovimentoReserva } from '../../domain/entities/movimento-reserva';
import { BALDE_REPOSITORY, type BaldeRepository } from '../../domain/repositories/balde.repository';
import {
  MOVIMENTO_RESERVA_REPOSITORY,
  type MovimentoReservaRepository,
} from '../../domain/repositories/movimento-reserva.repository';
import { baldeToDTO } from './criar-balde.use-case';

@Injectable()
export class ObterSaldosUseCase {
  constructor(
    @Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository,
    @Inject(MOVIMENTO_RESERVA_REPOSITORY)
    private readonly movimentos: MovimentoReservaRepository,
  ) {}

  /**
   * Saldo de cada balde até a competência informada (ou atual, se ausente):
   * saldoInicial + Σaportes − Σretiradas para movimentos com competencia ≤ C.
   * Cálculo em centavos para evitar erro de ponto flutuante.
   */
  async execute(competencia: string | null): Promise<SaldosReservaDTO> {
    const [baldes, movimentos] = await Promise.all([
      this.baldes.findAll(),
      this.movimentos.findAll(),
    ]);

    const efeitoPorBalde = acumularEfeitos(movimentos, competencia);

    let totalCentavos = 0;
    const saldos: SaldoBaldeDTO[] = baldes.map((balde) => {
      const saldoCentavos = saldoBaldeEmCentavos(balde, efeitoPorBalde);
      totalCentavos += saldoCentavos;
      return {
        balde: baldeToDTO(balde),
        saldo: saldoCentavos / 100,
        negativo: saldoCentavos < 0,
      };
    });

    return { competencia, baldes: saldos, total: totalCentavos / 100 };
  }
}

function acumularEfeitos(
  movimentos: MovimentoReserva[],
  competencia: string | null,
): Map<string, number> {
  const efeitoPorBalde = new Map<string, number>();
  for (const movimento of movimentos) {
    if (competencia !== null && movimento.competencia > competencia) continue;
    const atual = efeitoPorBalde.get(movimento.baldeId) ?? 0;
    efeitoPorBalde.set(movimento.baldeId, atual + movimento.efeitoEmCentavos);
  }
  return efeitoPorBalde;
}

function saldoBaldeEmCentavos(balde: Balde, efeitoPorBalde: Map<string, number>): number {
  const inicialCentavos = Math.round(balde.saldoInicial * 100);
  return inicialCentavos + (efeitoPorBalde.get(balde.id) ?? 0);
}
