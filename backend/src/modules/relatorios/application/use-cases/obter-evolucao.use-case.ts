import { Inject, Injectable } from '@nestjs/common';
import type { EvolucaoMensalItemDTO } from '@financas-pessoais/shared';
import { intervaloCompetencias } from '../../domain/competencia';
import {
  LANCAMENTO_QUERY_PORT,
  type LancamentoQueryPort,
} from '../../domain/ports/lancamento-query.port';
import { validarIntervalo } from '../validar-intervalo';

@Injectable()
export class ObterEvolucaoUseCase {
  constructor(
    @Inject(LANCAMENTO_QUERY_PORT) private readonly lancamentos: LancamentoQueryPort,
  ) {}

  /**
   * Retorna receitas, despesas e saldo (receitas − despesas) por competência no intervalo.
   * Meses sem dados aparecem zerados (série temporal contínua).
   */
  async execute(de: string, ate: string): Promise<EvolucaoMensalItemDTO[]> {
    validarIntervalo(de, ate);

    const lancamentos = await this.lancamentos.somarPorTipoECompetencia(de, ate);
    const porMes = new Map(lancamentos.map((l) => [l.competencia, l]));

    return intervaloCompetencias(de, ate).map((competencia) => {
      const lancamento = porMes.get(competencia);
      const receitasCentavos = Math.round((lancamento?.receitas ?? 0) * 100);
      const despesasCentavos = Math.round((lancamento?.despesas ?? 0) * 100);
      return {
        competencia,
        receitas: receitasCentavos / 100,
        despesas: despesasCentavos / 100,
        saldo: (receitasCentavos - despesasCentavos) / 100,
      };
    });
  }
}
