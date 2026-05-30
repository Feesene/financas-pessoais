import {
  planejarMigracaoCategorias,
  type LancamentoParaMigrar,
} from './planejar-migracao-categorias';

describe('planejarMigracaoCategorias', () => {
  it('cria uma categoria por (nome, tipo) distinto e atribui os lançamentos', () => {
    const lancamentos: LancamentoParaMigrar[] = [
      { id: 'l1', categoria: 'Alimentação', tipo: 'DESPESA', categoriaId: null },
      { id: 'l2', categoria: 'alimentação', tipo: 'DESPESA', categoriaId: null },
      { id: 'l3', categoria: 'Salário', tipo: 'RECEITA', categoriaId: null },
    ];

    const plano = planejarMigracaoCategorias(lancamentos, []);

    // "Alimentação" e "alimentação" colapsam em uma só categoria de despesa.
    expect(plano.novasCategorias).toHaveLength(2);
    expect(plano.atribuicoes).toHaveLength(3);

    const idAlimentacao = plano.atribuicoes.find((a) => a.lancamentoId === 'l1')?.categoriaId;
    const idAlimentacao2 = plano.atribuicoes.find((a) => a.lancamentoId === 'l2')?.categoriaId;
    expect(idAlimentacao).toBe(idAlimentacao2);
  });

  it('reutiliza categorias já existentes em vez de criar novas', () => {
    const lancamentos: LancamentoParaMigrar[] = [
      { id: 'l1', categoria: 'Transporte', tipo: 'DESPESA', categoriaId: null },
    ];
    const plano = planejarMigracaoCategorias(lancamentos, [
      { id: 'cat-existente', nome: 'Transporte', tipo: 'DESPESA' },
    ]);

    expect(plano.novasCategorias).toHaveLength(0);
    expect(plano.atribuicoes).toEqual([{ lancamentoId: 'l1', categoriaId: 'cat-existente' }]);
  });

  it('ignora lançamentos já migrados e textos vazios', () => {
    const lancamentos: LancamentoParaMigrar[] = [
      { id: 'l1', categoria: 'Lazer', tipo: 'DESPESA', categoriaId: 'já-tem' },
      { id: 'l2', categoria: '   ', tipo: 'DESPESA', categoriaId: null },
    ];
    const plano = planejarMigracaoCategorias(lancamentos, []);
    expect(plano.novasCategorias).toHaveLength(0);
    expect(plano.atribuicoes).toHaveLength(0);
  });

  it('mesmo nome em tipos diferentes gera categorias distintas', () => {
    const lancamentos: LancamentoParaMigrar[] = [
      { id: 'l1', categoria: 'Investimentos', tipo: 'DESPESA', categoriaId: null },
      { id: 'l2', categoria: 'Investimentos', tipo: 'RECEITA', categoriaId: null },
    ];
    const plano = planejarMigracaoCategorias(lancamentos, []);
    expect(plano.novasCategorias).toHaveLength(2);
  });
});
