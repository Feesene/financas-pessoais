import { ObterEvolucaoUseCase } from './obter-evolucao.use-case';
import type {
  LancamentoQueryPort,
  SomaTipoCompetencia,
  DespesaPorCategoria,
} from '../../domain/ports/lancamento-query.port';

function lancamentoPort(somas: SomaTipoCompetencia[]): LancamentoQueryPort {
  return {
    somarPorTipoECompetencia: async () => somas,
    somarDespesaPorCategoria: async (): Promise<DespesaPorCategoria[]> => [],
  };
}

describe('ObterEvolucaoUseCase', () => {
  it('retorna receitas, despesas e saldo por competência', async () => {
    const useCase = new ObterEvolucaoUseCase(
      lancamentoPort([{ competencia: '2026-01', receitas: 1000, despesas: 400 }]),
    );

    const serie = await useCase.execute('2026-01', '2026-01');

    expect(serie[0]).toEqual({
      competencia: '2026-01',
      receitas: 1000,
      despesas: 400,
      saldo: 600,
    });
  });

  it('preenche meses vazios com zeros', async () => {
    const useCase = new ObterEvolucaoUseCase(
      lancamentoPort([{ competencia: '2026-03', receitas: 50, despesas: 20 }]),
    );

    const serie = await useCase.execute('2026-01', '2026-03');

    expect(serie.map((p) => p.competencia)).toEqual(['2026-01', '2026-02', '2026-03']);
    expect(serie[0]).toEqual({ competencia: '2026-01', receitas: 0, despesas: 0, saldo: 0 });
    expect(serie[2].saldo).toBe(30);
  });
});
