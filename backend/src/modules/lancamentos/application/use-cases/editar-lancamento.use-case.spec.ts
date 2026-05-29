import { EditarLancamentoUseCase } from './editar-lancamento.use-case';
import { Lancamento } from '../../domain/entities/lancamento';
import { LancamentoNaoEncontradoError } from '../errors/lancamento-nao-encontrado.error';
import { InMemoryLancamentoRepository } from '../../../../../test/in-memory-lancamento.repository';

describe('EditarLancamentoUseCase', () => {
  let repo: InMemoryLancamentoRepository;
  let useCase: EditarLancamentoUseCase;

  beforeEach(() => {
    repo = new InMemoryLancamentoRepository();
    useCase = new EditarLancamentoUseCase(repo);
  });

  it('lança erro quando o lançamento não existe', async () => {
    await expect(
      useCase.execute({
        id: 'inexistente',
        tipo: 'DESPESA',
        categoria: 'Alimentação',
        valor: 10,
        competencia: '2026-05',
      }),
    ).rejects.toBeInstanceOf(LancamentoNaoEncontradoError);
  });

  it('atualiza o lançamento existente e persiste a mudança', async () => {
    await repo.save(
      Lancamento.criar({
        id: 'l-1',
        tipo: 'DESPESA',
        categoria: 'Alimentação',
        descricao: null,
        valor: 50,
        competencia: '2026-05',
      }),
    );

    const resultado = await useCase.execute({
      id: 'l-1',
      tipo: 'RECEITA',
      categoria: 'Salário',
      descricao: 'Mensal',
      valor: 4000,
      competencia: '2026-05',
    });

    expect(resultado).toEqual({
      id: 'l-1',
      tipo: 'RECEITA',
      categoria: 'Salário',
      descricao: 'Mensal',
      valor: 4000,
      competencia: '2026-05',
    });

    const persistido = await repo.findById('l-1');
    expect(persistido?.valor).toBe(4000);
    expect(persistido?.tipo).toBe('RECEITA');
  });
});
