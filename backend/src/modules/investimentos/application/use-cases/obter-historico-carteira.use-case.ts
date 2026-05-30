import { Inject, Injectable } from '@nestjs/common';
import type { HistoricoCarteiraItemDTO } from '@financas-pessoais/shared';
import type { MovimentoCarteira } from '../../domain/entities/movimento-carteira';
import {
  MOVIMENTO_CARTEIRA_REPOSITORY,
  type MovimentoCarteiraRepository,
} from '../../domain/repositories/movimento-carteira.repository';

export interface ObterHistoricoCarteiraInput {
  /** Competência inicial (AAAA-MM) inclusiva; null para sem limite inferior. */
  de: string | null;
  /** Competência final (AAAA-MM) inclusiva; null para sem limite superior. */
  ate: string | null;
}

interface Acumulado {
  entradasCentavos: number;
  saidasCentavos: number;
  rendimentosCentavos: number;
}

@Injectable()
export class ObterHistoricoCarteiraUseCase {
  constructor(
    @Inject(MOVIMENTO_CARTEIRA_REPOSITORY)
    private readonly movimentos: MovimentoCarteiraRepository,
  ) {}

  /**
   * Histórico mensal agregado: por competência, soma entradas, saídas e
   * rendimentos, com fluxo líquido = entradas + rendimentos − saídas.
   * Cálculo em centavos. Intervalo [de, ate] opcional e inclusivo.
   */
  async execute(input: ObterHistoricoCarteiraInput): Promise<HistoricoCarteiraItemDTO[]> {
    const movimentos = await this.movimentos.findAll();

    const porCompetencia = new Map<string, Acumulado>();
    for (const movimento of movimentos) {
      if (input.de !== null && movimento.competencia < input.de) continue;
      if (input.ate !== null && movimento.competencia > input.ate) continue;
      acumular(porCompetencia, movimento);
    }

    return [...porCompetencia.keys()].sort().map((competencia) => {
      const dados = porCompetencia.get(competencia)!;
      const fluxoCentavos =
        dados.entradasCentavos + dados.rendimentosCentavos - dados.saidasCentavos;
      return {
        competencia,
        entradas: dados.entradasCentavos / 100,
        saidas: dados.saidasCentavos / 100,
        rendimentos: dados.rendimentosCentavos / 100,
        fluxoLiquido: fluxoCentavos / 100,
      };
    });
  }
}

function acumular(porCompetencia: Map<string, Acumulado>, movimento: MovimentoCarteira): void {
  const dados =
    porCompetencia.get(movimento.competencia) ??
    { entradasCentavos: 0, saidasCentavos: 0, rendimentosCentavos: 0 };
  const centavos = Math.round(movimento.valor * 100);
  if (movimento.tipo === 'ENTRADA') dados.entradasCentavos += centavos;
  else if (movimento.tipo === 'SAIDA') dados.saidasCentavos += centavos;
  else dados.rendimentosCentavos += centavos;
  porCompetencia.set(movimento.competencia, dados);
}
