import { ObterGastoPorCategoriaUseCase } from './obter-gasto-por-categoria.use-case';
import type { CategoriaDTO } from '@financas-pessoais/shared';
import type {
  LancamentoQueryPort,
  DespesaPorCategoria,
  SomaTipoCompetencia,
} from '../../domain/ports/lancamento-query.port';
import type { CategoriaQueryPort } from '../../domain/ports/categoria-query.port';

function categoria(id: string, nome: string): CategoriaDTO {
  return { id, nome, tipo: 'DESPESA', cor: null };
}

function lancamentoPort(despesas: DespesaPorCategoria[]): LancamentoQueryPort {
  return {
    somarPorTipoECompetencia: async (): Promise<SomaTipoCompetencia[]> => [],
    somarDespesaPorCategoria: async () => despesas,
    somarPrevistoPagoPorCompetencia: async () => [],
  };
}

function categoriaPort(categorias: CategoriaDTO[]): CategoriaQueryPort {
  return { listar: async () => categorias };
}

describe('ObterGastoPorCategoriaUseCase', () => {
  it('calcula percentual sobre o total e ordena desc por total', async () => {
    const useCase = new ObterGastoPorCategoriaUseCase(
      lancamentoPort([
        { categoriaId: 'a', total: 300 },
        { categoriaId: 'b', total: 100 },
      ]),
      categoriaPort([categoria('a', 'Mercado'), categoria('b', 'Lazer')]),
    );

    const itens = await useCase.execute('2026-01', '2026-01');

    expect(itens.map((i) => i.categoria.id)).toEqual(['a', 'b']);
    expect(itens[0].percentual).toBeCloseTo(0.75, 5);
    expect(itens[1].percentual).toBeCloseTo(0.25, 5);
  });

  it('ignora despesas sem categoria e categorias com total zero (D4)', async () => {
    const useCase = new ObterGastoPorCategoriaUseCase(
      lancamentoPort([
        { categoriaId: null, total: 50 },
        { categoriaId: 'a', total: 0 },
        { categoriaId: 'b', total: 100 },
      ]),
      categoriaPort([categoria('a', 'Mercado'), categoria('b', 'Lazer')]),
    );

    const itens = await useCase.execute('2026-01', '2026-01');

    expect(itens).toHaveLength(1);
    expect(itens[0].categoria.id).toBe('b');
    // Percentual é sobre o total de despesas do período (inclui o gasto sem categoria): 100 / 150.
    expect(itens[0].percentual).toBeCloseTo(0.6667, 4);
  });

  it('retorna lista vazia quando não há despesas', async () => {
    const useCase = new ObterGastoPorCategoriaUseCase(
      lancamentoPort([]),
      categoriaPort([categoria('a', 'Mercado')]),
    );

    expect(await useCase.execute('2026-01', '2026-01')).toEqual([]);
  });
});
