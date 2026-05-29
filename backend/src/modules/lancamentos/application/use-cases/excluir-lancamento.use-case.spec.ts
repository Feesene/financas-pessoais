import { ExcluirLancamentoUseCase } from './excluir-lancamento.use-case';
import { Lancamento } from '../../domain/entities/lancamento';
import { LancamentoNaoEncontradoError } from '../errors/lancamento-nao-encontrado.error';
import { InMemoryLancamentoRepository } from '../../../../../test/in-memory-lancamento.repository';

describe('ExcluirLancamentoUseCase', () => {
  let repo: InMemoryLancamentoRepository;
  let useCase: ExcluirLancamentoUseCase;

  beforeEach(() => {
    repo = new InMemoryLancamentoRepository();
    useCase = new ExcluirLancamentoUseCase(repo);
  });

  it('chama delete e remove o lançamento existente', async () => {
    await repo.save(
      Lancamento.criar({
        id: 'l-1',
        tipo: 'DESPESA',
        categoria: 'Transporte',
        descricao: null,
        valor: 20,
        competencia: '2026-05',
      }),
    );
    const spy = jest.spyOn(repo, 'delete');

    await useCase.execute('l-1');

    expect(spy).toHaveBeenCalledWith('l-1');
    expect(await repo.findById('l-1')).toBeNull();
  });

  it('lança erro quando o lançamento não existe', async () => {
    await expect(useCase.execute('inexistente')).rejects.toBeInstanceOf(
      LancamentoNaoEncontradoError,
    );
  });
});
