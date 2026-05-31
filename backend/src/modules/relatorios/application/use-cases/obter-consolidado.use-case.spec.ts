import { ObterConsolidadoUseCase } from './obter-consolidado.use-case';
import { IntervaloInvalidoError } from '../errors/intervalo-invalido.error';
import type {
  LancamentoQueryPort,
  SomaTipoCompetencia,
  DespesaPorCategoria,
} from '../../domain/ports/lancamento-query.port';
import type {
  ReservaQueryPort,
  AportesReservaCompetencia,
} from '../../domain/ports/reserva-query.port';

function lancamentoPort(somas: SomaTipoCompetencia[]): LancamentoQueryPort {
  return {
    somarPorTipoECompetencia: async () => somas,
    somarDespesaPorCategoria: async (): Promise<DespesaPorCategoria[]> => [],
    somarPrevistoPagoPorCompetencia: async () => [],
  };
}

function reservaPort(aportes: AportesReservaCompetencia[]): ReservaQueryPort {
  return { somarAportesPorBaldeCategoria: async () => aportes };
}

describe('ObterConsolidadoUseCase', () => {
  it('calcula sobras = liquido - gastos - poupanca - viagem por competência e totais', async () => {
    const useCase = new ObterConsolidadoUseCase(
      lancamentoPort([{ competencia: '2026-01', receitas: 5000, despesas: 3000 }]),
      reservaPort([{ competencia: '2026-01', poupanca: 500, viagem: 200 }]),
    );

    const { meses, totais } = await useCase.execute('2026-01', '2026-01');

    expect(meses).toHaveLength(1);
    expect(meses[0]).toEqual({
      competencia: '2026-01',
      liquidoRecebido: 5000,
      gastos: 3000,
      poupanca: 500,
      viagem: 200,
      sobras: 1300,
    });
    expect(totais.sobras).toBe(1300);
  });

  it('preenche meses sem dados com zeros (série contínua)', async () => {
    const useCase = new ObterConsolidadoUseCase(
      lancamentoPort([{ competencia: '2026-02', receitas: 100, despesas: 0 }]),
      reservaPort([]),
    );

    const { meses } = await useCase.execute('2026-01', '2026-03');

    expect(meses.map((m) => m.competencia)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(meses[0].sobras).toBe(0);
    expect(meses[1].sobras).toBe(100);
    expect(meses[2].sobras).toBe(0);
  });

  it('não acumula erro de ponto flutuante nos totais', async () => {
    const useCase = new ObterConsolidadoUseCase(
      lancamentoPort([
        { competencia: '2026-01', receitas: 0.1, despesas: 0 },
        { competencia: '2026-02', receitas: 0.2, despesas: 0 },
      ]),
      reservaPort([]),
    );

    const { totais } = await useCase.execute('2026-01', '2026-02');

    expect(totais.liquidoRecebido).toBe(0.3);
    expect(totais.sobras).toBe(0.3);
  });

  it('rejeita intervalo com de > ate', async () => {
    const useCase = new ObterConsolidadoUseCase(lancamentoPort([]), reservaPort([]));
    await expect(useCase.execute('2026-05', '2026-01')).rejects.toBeInstanceOf(
      IntervaloInvalidoError,
    );
  });
});
