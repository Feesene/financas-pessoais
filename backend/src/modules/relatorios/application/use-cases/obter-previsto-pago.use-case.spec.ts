import { ObterPrevistoPagoUseCase } from './obter-previsto-pago.use-case';
import { IntervaloInvalidoError } from '../errors/intervalo-invalido.error';
import type {
  LancamentoQueryPort,
  PrevistoPagoCompetencia,
} from '../../domain/ports/lancamento-query.port';

function lancamentoPort(somas: PrevistoPagoCompetencia[]): LancamentoQueryPort {
  return {
    somarPorTipoECompetencia: async () => [],
    somarDespesaPorCategoria: async () => [],
    somarPrevistoPagoPorCompetencia: async () => somas,
  };
}

describe('ObterPrevistoPagoUseCase', () => {
  it('retorna previsto e pago de receitas e despesas por competência', async () => {
    const useCase = new ObterPrevistoPagoUseCase(
      lancamentoPort([
        {
          competencia: '2026-05',
          receitasPrevisto: 5000,
          receitasPago: 5000,
          despesasPrevisto: 3200,
          despesasPago: 2800,
        },
      ]),
    );

    const serie = await useCase.execute('2026-05', '2026-05');

    expect(serie).toEqual([
      {
        competencia: '2026-05',
        receitasPrevisto: 5000,
        receitasPago: 5000,
        despesasPrevisto: 3200,
        despesasPago: 2800,
      },
    ]);
  });

  it('preenche meses sem dados com zeros (série contínua)', async () => {
    const useCase = new ObterPrevistoPagoUseCase(
      lancamentoPort([
        {
          competencia: '2026-02',
          receitasPrevisto: 100,
          receitasPago: 0,
          despesasPrevisto: 0,
          despesasPago: 0,
        },
      ]),
    );

    const serie = await useCase.execute('2026-01', '2026-03');

    expect(serie.map((p) => p.competencia)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(serie[0]).toEqual({
      competencia: '2026-01',
      receitasPrevisto: 0,
      receitasPago: 0,
      despesasPrevisto: 0,
      despesasPago: 0,
    });
    expect(serie[1].receitasPrevisto).toBe(100);
  });

  it('rejeita intervalo com de > ate', async () => {
    const useCase = new ObterPrevistoPagoUseCase(lancamentoPort([]));
    await expect(useCase.execute('2026-05', '2026-01')).rejects.toBeInstanceOf(
      IntervaloInvalidoError,
    );
  });
});
