import { Inject, Injectable } from '@nestjs/common';
import type { EvolucaoReservaItemDTO } from '@financas-pessoais/shared';
import { BALDE_REPOSITORY, type BaldeRepository } from '../../domain/repositories/balde.repository';
import {
  MOVIMENTO_RESERVA_REPOSITORY,
  type MovimentoReservaRepository,
} from '../../domain/repositories/movimento-reserva.repository';

@Injectable()
export class ObterEvolucaoReservasUseCase {
  constructor(
    @Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository,
    @Inject(MOVIMENTO_RESERVA_REPOSITORY)
    private readonly movimentos: MovimentoReservaRepository,
  ) {}

  /**
   * Saldo reservado total acumulado (todos os baldes) ao fim de cada mês de um
   * ano (Jan–Dez): base = Σ saldoInicial + Σ efeitos de movimentos com
   * competência ≤ mês. Série contínua de 12 pontos, cálculo em centavos.
   */
  async execute(ano: number): Promise<EvolucaoReservaItemDTO[]> {
    const [baldes, movimentos] = await Promise.all([
      this.baldes.findAll(),
      this.movimentos.findAll(),
    ]);

    let baseCentavos = baldes.reduce(
      (acc, balde) => acc + Math.round(balde.saldoInicial * 100),
      0,
    );

    // Efeitos por competência; os anteriores ao ano entram já na base.
    const efeitoPorCompetencia = new Map<string, number>();
    const inicioAno = `${ano}-01`;
    for (const movimento of movimentos) {
      if (movimento.competencia < inicioAno) {
        baseCentavos += movimento.efeitoEmCentavos;
        continue;
      }
      const atual = efeitoPorCompetencia.get(movimento.competencia) ?? 0;
      efeitoPorCompetencia.set(movimento.competencia, atual + movimento.efeitoEmCentavos);
    }

    let acumuladoCentavos = baseCentavos;
    return Array.from({ length: 12 }, (_, i) => {
      const competencia = `${ano}-${String(i + 1).padStart(2, '0')}`;
      acumuladoCentavos += efeitoPorCompetencia.get(competencia) ?? 0;
      return { competencia, total: acumuladoCentavos / 100 };
    });
  }
}
