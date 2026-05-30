import { DefinirMetaUseCase } from './definir-meta.use-case';
import { Categoria } from '../../domain/entities/categoria';
import { CategoriaNaoEncontradaError } from '../errors/categoria-nao-encontrada.error';
import { MetaInvalidaError } from '../../domain/errors/meta-invalida.error';
import { InMemoryCategoriaRepository } from '../../../../../test/in-memory-categoria.repository';
import { InMemoryMetaRepository } from '../../../../../test/in-memory-meta.repository';

describe('DefinirMetaUseCase', () => {
  let categorias: InMemoryCategoriaRepository;
  let metas: InMemoryMetaRepository;
  let useCase: DefinirMetaUseCase;

  beforeEach(() => {
    categorias = new InMemoryCategoriaRepository();
    metas = new InMemoryMetaRepository();
    useCase = new DefinirMetaUseCase(categorias, metas);
  });

  async function seedCategoria(tipo: 'DESPESA' | 'RECEITA', id = 'c-1') {
    await categorias.save(
      Categoria.criar({ id, nome: 'Alimentação', tipo, cor: null }),
    );
  }

  it('define a meta para categoria de despesa', async () => {
    await seedCategoria('DESPESA');
    const dto = await useCase.execute({ categoriaId: 'c-1', competencia: '2026-05', valor: 500 });
    expect(dto).toMatchObject({ categoriaId: 'c-1', competencia: '2026-05', valor: 500 });
  });

  it('rejeita meta em categoria de receita', async () => {
    await seedCategoria('RECEITA');
    await expect(
      useCase.execute({ categoriaId: 'c-1', competencia: '2026-05', valor: 500 }),
    ).rejects.toBeInstanceOf(MetaInvalidaError);
  });

  it('rejeita meta para categoria inexistente', async () => {
    await expect(
      useCase.execute({ categoriaId: 'nao-existe', competencia: '2026-05', valor: 500 }),
    ).rejects.toBeInstanceOf(CategoriaNaoEncontradaError);
  });

  it('faz upsert preservando o id da meta na mesma competência', async () => {
    await seedCategoria('DESPESA');
    const primeira = await useCase.execute({
      categoriaId: 'c-1',
      competencia: '2026-05',
      valor: 500,
    });
    const segunda = await useCase.execute({
      categoriaId: 'c-1',
      competencia: '2026-05',
      valor: 800,
    });
    expect(segunda.id).toBe(primeira.id);
    expect(segunda.valor).toBe(800);
    expect(await metas.findByCompetencia('2026-05')).toHaveLength(1);
  });
});
