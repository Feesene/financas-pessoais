import { Inject, Injectable } from '@nestjs/common';
import type {
  ConsolidadoDTO,
  ConsolidadoMensalDTO,
  TotaisAnoDTO,
} from '@financas-pessoais/shared';
import { intervaloCompetencias } from '../../domain/competencia';
import {
  LANCAMENTO_QUERY_PORT,
  type LancamentoQueryPort,
} from '../../domain/ports/lancamento-query.port';
import {
  RESERVA_QUERY_PORT,
  type ReservaQueryPort,
} from '../../domain/ports/reserva-query.port';
import { validarIntervalo } from '../validar-intervalo';

@Injectable()
export class ObterConsolidadoUseCase {
  constructor(
    @Inject(LANCAMENTO_QUERY_PORT) private readonly lancamentos: LancamentoQueryPort,
    @Inject(RESERVA_QUERY_PORT) private readonly reservas: ReservaQueryPort,
  ) {}

  /**
   * Produz uma linha por competência no intervalo [de, ate] com líquido/gastos/poupança/viagem/sobras,
   * mais os totais do período. Meses sem dados aparecem zerados (série contínua).
   * Cálculo em centavos para garantir 2 casas decimais sem erro de ponto flutuante.
   */
  async execute(de: string, ate: string): Promise<ConsolidadoDTO> {
    validarIntervalo(de, ate);

    const [lancamentos, aportes] = await Promise.all([
      this.lancamentos.somarPorTipoECompetencia(de, ate),
      this.reservas.somarAportesPorBaldeCategoria(de, ate),
    ]);

    const lancamentoPorMes = new Map(lancamentos.map((l) => [l.competencia, l]));
    const aportePorMes = new Map(aportes.map((a) => [a.competencia, a]));

    const totais = { liquidoRecebido: 0, gastos: 0, poupanca: 0, viagem: 0, sobras: 0 };
    const meses: ConsolidadoMensalDTO[] = intervaloCompetencias(de, ate).map((competencia) => {
      const lancamento = lancamentoPorMes.get(competencia);
      const aporte = aportePorMes.get(competencia);

      const liquidoCentavos = Math.round((lancamento?.receitas ?? 0) * 100);
      const gastosCentavos = Math.round((lancamento?.despesas ?? 0) * 100);
      const poupancaCentavos = Math.round((aporte?.poupanca ?? 0) * 100);
      const viagemCentavos = Math.round((aporte?.viagem ?? 0) * 100);
      const sobrasCentavos = liquidoCentavos - gastosCentavos - poupancaCentavos - viagemCentavos;

      totais.liquidoRecebido += liquidoCentavos;
      totais.gastos += gastosCentavos;
      totais.poupanca += poupancaCentavos;
      totais.viagem += viagemCentavos;
      totais.sobras += sobrasCentavos;

      return {
        competencia,
        liquidoRecebido: liquidoCentavos / 100,
        gastos: gastosCentavos / 100,
        poupanca: poupancaCentavos / 100,
        viagem: viagemCentavos / 100,
        sobras: sobrasCentavos / 100,
      };
    });

    const totaisDTO: TotaisAnoDTO = {
      liquidoRecebido: totais.liquidoRecebido / 100,
      gastos: totais.gastos / 100,
      poupanca: totais.poupanca / 100,
      viagem: totais.viagem / 100,
      sobras: totais.sobras / 100,
    };

    return { de, ate, meses, totais: totaisDTO };
  }
}
