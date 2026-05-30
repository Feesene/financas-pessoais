import { Inject, Injectable } from '@nestjs/common';
import {
  BALDE_REPOSITORY,
  type BaldeRepository,
} from '../../../reservas/domain/repositories/balde.repository';
import {
  MOVIMENTO_RESERVA_REPOSITORY,
  type MovimentoReservaRepository,
} from '../../../reservas/domain/repositories/movimento-reserva.repository';
import { classificarBalde } from '../../domain/classificacao-balde';
import type {
  AportesReservaCompetencia,
  ReservaQueryPort,
} from '../../domain/ports/reserva-query.port';

interface AcumuladorCentavos {
  poupanca: number;
  viagem: number;
}

/** Adapter (ACL) que implementa ReservaQueryPort sobre os repositórios reais de P4. */
@Injectable()
export class ReservaQueryAdapter implements ReservaQueryPort {
  constructor(
    @Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository,
    @Inject(MOVIMENTO_RESERVA_REPOSITORY)
    private readonly movimentos: MovimentoReservaRepository,
  ) {}

  async somarAportesPorBaldeCategoria(
    de: string,
    ate: string,
  ): Promise<AportesReservaCompetencia[]> {
    const [baldes, movimentos] = await Promise.all([
      this.baldes.findAll(),
      this.movimentos.findAll(),
    ]);

    const categoriaPorBalde = new Map(baldes.map((b) => [b.id, classificarBalde(b.nome)]));

    // Acumula aportes em centavos por competência para evitar erro de ponto flutuante.
    const porCompetencia = new Map<string, AcumuladorCentavos>();
    for (const movimento of movimentos) {
      if (movimento.tipo !== 'APORTE') continue;
      if (movimento.competencia < de || movimento.competencia > ate) continue;
      const categoria = categoriaPorBalde.get(movimento.baldeId) ?? null;
      if (categoria === null) continue;

      const acumulador = porCompetencia.get(movimento.competencia) ?? { poupanca: 0, viagem: 0 };
      const centavos = Math.round(movimento.valor * 100);
      if (categoria === 'POUPANCA') acumulador.poupanca += centavos;
      else acumulador.viagem += centavos;
      porCompetencia.set(movimento.competencia, acumulador);
    }

    return [...porCompetencia.entries()].map(([competencia, { poupanca, viagem }]) => ({
      competencia,
      poupanca: poupanca / 100,
      viagem: viagem / 100,
    }));
  }
}
