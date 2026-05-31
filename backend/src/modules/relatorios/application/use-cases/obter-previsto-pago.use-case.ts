import { Inject, Injectable } from '@nestjs/common';
import type { PrevistoPagoItemDTO } from '@financas-pessoais/shared';
import { intervaloCompetencias } from '../../domain/competencia';
import {
  LANCAMENTO_QUERY_PORT,
  type LancamentoQueryPort,
} from '../../domain/ports/lancamento-query.port';
import { validarIntervalo } from '../validar-intervalo';

@Injectable()
export class ObterPrevistoPagoUseCase {
  constructor(
    @Inject(LANCAMENTO_QUERY_PORT) private readonly lancamentos: LancamentoQueryPort,
  ) {}

  /**
   * Retorna, por competência do intervalo, os totais previsto (valor) e pago
   * (valorEfetivo de ocorrências com pago=true) de receitas e despesas.
   * Meses sem dados aparecem zerados (série temporal contínua).
   */
  async execute(de: string, ate: string): Promise<PrevistoPagoItemDTO[]> {
    validarIntervalo(de, ate);

    const somas = await this.lancamentos.somarPrevistoPagoPorCompetencia(de, ate);
    const porMes = new Map(somas.map((s) => [s.competencia, s]));

    return intervaloCompetencias(de, ate).map((competencia) => {
      const s = porMes.get(competencia);
      return {
        competencia,
        receitasPrevisto: s?.receitasPrevisto ?? 0,
        receitasPago: s?.receitasPago ?? 0,
        despesasPrevisto: s?.despesasPrevisto ?? 0,
        despesasPago: s?.despesasPago ?? 0,
      };
    });
  }
}
