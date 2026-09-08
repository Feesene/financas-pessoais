import { LancamentoQueryAdapter } from './lancamento-query.adapter';
import { Lancamento, type LancamentoProps } from '../../../lancamentos/domain/entities/lancamento';
import type { LancamentoRepository } from '../../../lancamentos/domain/repositories/lancamento.repository';

function lancamento(props: Partial<LancamentoProps> & Pick<LancamentoProps, 'tipo' | 'valor' | 'competencia'>): Lancamento {
  return Lancamento.criar({
    id: props.id ?? crypto.randomUUID(),
    tipo: props.tipo,
    categoria: props.categoria ?? 'Geral',
    categoriaId: props.categoriaId ?? null,
    descricao: props.descricao ?? null,
    valor: props.valor,
    competencia: props.competencia,
    origemRegraId: props.origemRegraId,
    ocorrenciaIndice: props.ocorrenciaIndice,
    pago: props.pago,
    valorPago: props.valorPago,
  });
}

function repoComLancamentos(lancamentos: Lancamento[]): LancamentoRepository {
  return {
    save: async () => {},
    findByCompetencia: async (competencia) =>
      lancamentos.filter((l) => l.competencia === competencia),
    findById: async () => null,
    existsByCategoriaId: async () => false,
    delete: async () => false,
  };
}

describe('LancamentoQueryAdapter', () => {
  describe('somarPorTipoECompetencia', () => {
    it('soma valorEfetivo: usa valorPago quando a ocorrência está paga', async () => {
      const adapter = new LancamentoQueryAdapter(
        repoComLancamentos([
          lancamento({
            tipo: 'RECEITA',
            valor: 1000,
            competencia: '2026-01',
            origemRegraId: 'regra-1',
            ocorrenciaIndice: 1,
            pago: true,
            valorPago: 1200,
          }),
          lancamento({
            tipo: 'DESPESA',
            valor: 400,
            competencia: '2026-01',
            origemRegraId: 'regra-2',
            ocorrenciaIndice: 1,
            pago: true,
            valorPago: 350,
          }),
        ]),
      );

      const somas = await adapter.somarPorTipoECompetencia('2026-01', '2026-01');

      expect(somas).toEqual([{ competencia: '2026-01', receitas: 1200, despesas: 350 }]);
    });

    it('soma valor previsto quando a ocorrência não está paga', async () => {
      const adapter = new LancamentoQueryAdapter(
        repoComLancamentos([
          lancamento({ tipo: 'RECEITA', valor: 1000, competencia: '2026-02' }),
        ]),
      );

      const somas = await adapter.somarPorTipoECompetencia('2026-02', '2026-02');

      expect(somas).toEqual([{ competencia: '2026-02', receitas: 1000, despesas: 0 }]);
    });
  });

  describe('somarDespesaPorCategoria', () => {
    it('soma valorEfetivo das despesas por categoria', async () => {
      const adapter = new LancamentoQueryAdapter(
        repoComLancamentos([
          lancamento({
            tipo: 'DESPESA',
            valor: 400,
            competencia: '2026-01',
            categoriaId: 'cat-1',
            origemRegraId: 'regra-1',
            ocorrenciaIndice: 1,
            pago: true,
            valorPago: 350,
          }),
          lancamento({
            tipo: 'DESPESA',
            valor: 100,
            competencia: '2026-01',
            categoriaId: 'cat-1',
          }),
        ]),
      );

      const porCategoria = await adapter.somarDespesaPorCategoria('2026-01', '2026-01');

      expect(porCategoria).toEqual([{ categoriaId: 'cat-1', total: 450 }]);
    });
  });

  describe('somarPrevistoPagoPorCompetencia', () => {
    it('separa o orçado (valor) do realizado (valorEfetivo do que já se moveu)', async () => {
      const adapter = new LancamentoQueryAdapter(
        repoComLancamentos([
          lancamento({
            tipo: 'RECEITA',
            valor: 5000,
            competencia: '2026-05',
            origemRegraId: 'r1',
            ocorrenciaIndice: 1,
            pago: true,
            valorPago: 5000,
          }),
          lancamento({
            tipo: 'DESPESA',
            valor: 3200,
            competencia: '2026-05',
            origemRegraId: 'r2',
            ocorrenciaIndice: 1,
            pago: true,
            valorPago: 2800,
          }),
          lancamento({ tipo: 'DESPESA', valor: 100, competencia: '2026-05' }),
        ]),
      );

      const serie = await adapter.somarPrevistoPagoPorCompetencia('2026-05', '2026-05');

      // A despesa manual de 100 entra nos dois lados: ela é registro de um gasto
      // que já aconteceu, não uma previsão à espera de marcação (INC-06).
      expect(serie).toEqual([
        {
          competencia: '2026-05',
          receitasPrevisto: 5000,
          receitasPago: 5000,
          despesasPrevisto: 3300,
          despesasPago: 2900,
        },
      ]);
    });

    it('conta lançamentos manuais como realizados, não como pendentes', async () => {
      const adapter = new LancamentoQueryAdapter(
        repoComLancamentos([
          lancamento({ tipo: 'RECEITA', valor: 1000, competencia: '2026-06' }),
          lancamento({ tipo: 'DESPESA', valor: 400, competencia: '2026-06' }),
        ]),
      );

      const serie = await adapter.somarPrevistoPagoPorCompetencia('2026-06', '2026-06');

      // Um mês só de lançamentos manuais está inteiramente realizado: zerar o
      // lado "pago" desenhava um mês em que nada tinha acontecido.
      expect(serie).toEqual([
        {
          competencia: '2026-06',
          receitasPrevisto: 1000,
          receitasPago: 1000,
          despesasPrevisto: 400,
          despesasPago: 400,
        },
      ]);
    });

    it('deixa fora do realizado a ocorrência de recorrência ainda não paga', async () => {
      const adapter = new LancamentoQueryAdapter(
        repoComLancamentos([
          lancamento({
            tipo: 'DESPESA',
            valor: 2000,
            competencia: '2026-07',
            origemRegraId: 'aluguel',
            ocorrenciaIndice: 1,
          }),
        ]),
      );

      const serie = await adapter.somarPrevistoPagoPorCompetencia('2026-07', '2026-07');

      expect(serie).toEqual([
        {
          competencia: '2026-07',
          receitasPrevisto: 0,
          receitasPago: 0,
          despesasPrevisto: 2000,
          despesasPago: 0,
        },
      ]);
    });
  });
});
