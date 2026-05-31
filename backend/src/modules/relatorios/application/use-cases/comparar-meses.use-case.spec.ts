import { CompararMesesUseCase } from './comparar-meses.use-case';
import { IntervaloInvalidoError } from '../errors/intervalo-invalido.error';
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

/** Porta que devolve despesas conforme o mês solicitado (de === ate em comparação). */
function lancamentoPort(porMes: Record<string, DespesaPorCategoria[]>): LancamentoQueryPort {
  return {
    somarPorTipoECompetencia: async (): Promise<SomaTipoCompetencia[]> => [],
    somarDespesaPorCategoria: async (de) => porMes[de] ?? [],
    somarPrevistoPagoPorCompetencia: async () => [],
  };
}

function categoriaPort(categorias: CategoriaDTO[]): CategoriaQueryPort {
  return { listar: async () => categorias };
}

describe('CompararMesesUseCase', () => {
  it('calcula variação absoluta e percentual por categoria', async () => {
    const useCase = new CompararMesesUseCase(
      lancamentoPort({
        '2026-01': [{ categoriaId: 'a', total: 200 }],
        '2026-02': [{ categoriaId: 'a', total: 300 }],
      }),
      categoriaPort([categoria('a', 'Mercado')]),
    );

    const { itens } = await useCase.execute('2026-01', '2026-02');

    expect(itens[0]).toMatchObject({ gastoA: 200, gastoB: 300, variacao: 100 });
    expect(itens[0].variacaoPct).toBeCloseTo(0.5, 5);
  });

  it('retorna variacaoPct null quando gastoA = 0 (evita divisão por zero)', async () => {
    const useCase = new CompararMesesUseCase(
      lancamentoPort({
        '2026-01': [],
        '2026-02': [{ categoriaId: 'a', total: 80 }],
      }),
      categoriaPort([categoria('a', 'Mercado')]),
    );

    const { itens } = await useCase.execute('2026-01', '2026-02');

    expect(itens[0].gastoA).toBe(0);
    expect(itens[0].gastoB).toBe(80);
    expect(itens[0].variacaoPct).toBeNull();
  });

  it('rejeita competência inválida', async () => {
    const useCase = new CompararMesesUseCase(lancamentoPort({}), categoriaPort([]));
    await expect(useCase.execute('2026-13', '2026-02')).rejects.toBeInstanceOf(
      IntervaloInvalidoError,
    );
  });
});
