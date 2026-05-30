import { ExcluirCategoriaUseCase } from './excluir-categoria.use-case';
import { Categoria } from '../../domain/entities/categoria';
import { Lancamento } from '../../../lancamentos/domain/entities/lancamento';
import { CategoriaNaoEncontradaError } from '../errors/categoria-nao-encontrada.error';
import { CategoriaEmUsoError } from '../errors/categoria-em-uso.error';
import { InMemoryCategoriaRepository } from '../../../../../test/in-memory-categoria.repository';
import { InMemoryLancamentoRepository } from '../../../../../test/in-memory-lancamento.repository';

describe('ExcluirCategoriaUseCase', () => {
  let categorias: InMemoryCategoriaRepository;
  let lancamentos: InMemoryLancamentoRepository;
  let useCase: ExcluirCategoriaUseCase;

  beforeEach(() => {
    categorias = new InMemoryCategoriaRepository();
    lancamentos = new InMemoryLancamentoRepository();
    useCase = new ExcluirCategoriaUseCase(categorias, lancamentos);
  });

  async function seedCategoria(id = 'c-1') {
    await categorias.save(Categoria.criar({ id, nome: 'Alimentação', tipo: 'DESPESA', cor: null }));
  }

  it('rejeita exclusão de categoria inexistente', async () => {
    await expect(useCase.execute('nao-existe')).rejects.toBeInstanceOf(CategoriaNaoEncontradaError);
  });

  it('exclui categoria sem lançamentos vinculados', async () => {
    await seedCategoria();
    await useCase.execute('c-1');
    expect(await categorias.findById('c-1')).toBeNull();
  });

  it('bloqueia exclusão quando há lançamentos vinculados', async () => {
    await seedCategoria();
    await lancamentos.save(
      Lancamento.criar({
        id: 'l-1',
        tipo: 'DESPESA',
        categoria: 'Alimentação',
        categoriaId: 'c-1',
        descricao: null,
        valor: 30,
        competencia: '2026-05',
      }),
    );
    await expect(useCase.execute('c-1')).rejects.toBeInstanceOf(CategoriaEmUsoError);
    expect(await categorias.findById('c-1')).not.toBeNull();
  });
});
