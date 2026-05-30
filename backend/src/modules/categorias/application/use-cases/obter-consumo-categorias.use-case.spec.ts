import { ObterConsumoCategoriasUseCase } from './obter-consumo-categorias.use-case';
import { DefinirMetaUseCase } from './definir-meta.use-case';
import { Categoria } from '../../domain/entities/categoria';
import { Lancamento } from '../../../lancamentos/domain/entities/lancamento';
import { InMemoryCategoriaRepository } from '../../../../../test/in-memory-categoria.repository';
import { InMemoryMetaRepository } from '../../../../../test/in-memory-meta.repository';
import { InMemoryLancamentoRepository } from '../../../../../test/in-memory-lancamento.repository';

describe('ObterConsumoCategoriasUseCase', () => {
  let categorias: InMemoryCategoriaRepository;
  let metas: InMemoryMetaRepository;
  let lancamentos: InMemoryLancamentoRepository;
  let definirMeta: DefinirMetaUseCase;
  let useCase: ObterConsumoCategoriasUseCase;

  const COMPETENCIA = '2026-05';

  beforeEach(() => {
    categorias = new InMemoryCategoriaRepository();
    metas = new InMemoryMetaRepository();
    lancamentos = new InMemoryLancamentoRepository();
    definirMeta = new DefinirMetaUseCase(categorias, metas);
    useCase = new ObterConsumoCategoriasUseCase(categorias, metas, lancamentos);
  });

  async function seedCategoria(id: string, tipo: 'DESPESA' | 'RECEITA') {
    await categorias.save(Categoria.criar({ id, nome: id, tipo, cor: null }));
  }

  async function seedDespesa(categoriaId: string, valor: number, id = `l-${Math.random()}`) {
    await lancamentos.save(
      Lancamento.criar({
        id,
        tipo: 'DESPESA',
        categoria: categoriaId,
        categoriaId,
        descricao: null,
        valor,
        competencia: COMPETENCIA,
      }),
    );
  }

  it('só considera categorias de despesa', async () => {
    await seedCategoria('rec', 'RECEITA');
    await seedCategoria('desp', 'DESPESA');
    const resultado = await useCase.execute(COMPETENCIA);
    expect(resultado).toHaveLength(1);
    expect(resultado[0].categoria.id).toBe('desp');
  });

  it('categoria sem meta retorna meta/percentual nulos e estourou false', async () => {
    await seedCategoria('desp', 'DESPESA');
    await seedDespesa('desp', 120);
    const [consumo] = await useCase.execute(COMPETENCIA);
    expect(consumo.meta).toBeNull();
    expect(consumo.percentual).toBeNull();
    expect(consumo.estourou).toBe(false);
    expect(consumo.gasto).toBe(120);
  });

  it('gasto abaixo da meta: percentual < 1 e não estoura', async () => {
    await seedCategoria('desp', 'DESPESA');
    await definirMeta.execute({ categoriaId: 'desp', competencia: COMPETENCIA, valor: 500 });
    await seedDespesa('desp', 250);
    const [consumo] = await useCase.execute(COMPETENCIA);
    expect(consumo.percentual).toBeCloseTo(0.5);
    expect(consumo.estourou).toBe(false);
  });

  it('gasto igual à meta (100%) não conta como estouro', async () => {
    await seedCategoria('desp', 'DESPESA');
    await definirMeta.execute({ categoriaId: 'desp', competencia: COMPETENCIA, valor: 500 });
    await seedDespesa('desp', 200);
    await seedDespesa('desp', 300);
    const [consumo] = await useCase.execute(COMPETENCIA);
    expect(consumo.gasto).toBe(500);
    expect(consumo.percentual).toBeCloseTo(1);
    expect(consumo.estourou).toBe(false);
  });

  it('gasto acima da meta estoura', async () => {
    await seedCategoria('desp', 'DESPESA');
    await definirMeta.execute({ categoriaId: 'desp', competencia: COMPETENCIA, valor: 500 });
    await seedDespesa('desp', 500.01);
    const [consumo] = await useCase.execute(COMPETENCIA);
    expect(consumo.estourou).toBe(true);
  });

  it('lançamento manual vinculado por categoriaId conta no consumo da meta', async () => {
    await seedCategoria('desp', 'DESPESA');
    await definirMeta.execute({ categoriaId: 'desp', competencia: COMPETENCIA, valor: 500 });
    // Lançamento manual (sem origemRegraId) vinculado por categoriaId.
    await lancamentos.save(
      Lancamento.criar({
        id: 'manual-1',
        tipo: 'DESPESA',
        categoria: 'desp',
        categoriaId: 'desp',
        descricao: 'compra avulsa',
        valor: 300,
        competencia: COMPETENCIA,
      }),
    );
    const [consumo] = await useCase.execute(COMPETENCIA);
    expect(consumo.gasto).toBe(300);
    expect(consumo.percentual).toBeCloseTo(0.6);
  });

  it('soma o gasto pelo valor pago (valorEfetivo) de ocorrências pagas', async () => {
    await seedCategoria('desp', 'DESPESA');
    await definirMeta.execute({ categoriaId: 'desp', competencia: COMPETENCIA, valor: 500 });
    await lancamentos.save(
      Lancamento.criar({
        id: 'ocorrencia-1',
        tipo: 'DESPESA',
        categoria: 'desp',
        categoriaId: 'desp',
        descricao: null,
        valor: 200,
        competencia: COMPETENCIA,
        origemRegraId: 'regra-1',
        ocorrenciaIndice: 1,
      }).registrarPagamento(true, 237),
    );
    const [consumo] = await useCase.execute(COMPETENCIA);
    expect(consumo.gasto).toBe(237);
  });

  it('lançamento sem categoriaId (texto livre) não conta no consumo da categoria', async () => {
    await seedCategoria('desp', 'DESPESA');
    await definirMeta.execute({ categoriaId: 'desp', competencia: COMPETENCIA, valor: 500 });
    await lancamentos.save(
      Lancamento.criar({
        id: 'avulso-1',
        tipo: 'DESPESA',
        categoria: 'qualquer texto',
        categoriaId: null,
        descricao: null,
        valor: 200,
        competencia: COMPETENCIA,
      }),
    );
    const [consumo] = await useCase.execute(COMPETENCIA);
    expect(consumo.gasto).toBe(0);
  });
});
