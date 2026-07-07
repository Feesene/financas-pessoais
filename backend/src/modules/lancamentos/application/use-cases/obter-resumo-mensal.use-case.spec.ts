import { ObterResumoMensalUseCase } from './obter-resumo-mensal.use-case';
import { Lancamento, type LancamentoProps } from '../../domain/entities/lancamento';
import { InMemoryLancamentoRepository } from '../../../../../test/in-memory-lancamento.repository';

function lancamento(overrides: Partial<LancamentoProps>): Lancamento {
  return Lancamento.criar({
    id: Math.random().toString(36).slice(2),
    tipo: 'DESPESA',
    categoria: 'Geral',
    categoriaId: null,
    descricao: null,
    valor: 10,
    competencia: '2026-05',
    ...overrides,
  });
}

describe('ObterResumoMensalUseCase', () => {
  let repo: InMemoryLancamentoRepository;
  let useCase: ObterResumoMensalUseCase;

  beforeEach(() => {
    repo = new InMemoryLancamentoRepository();
    useCase = new ObterResumoMensalUseCase(repo);
  });

  it('soma receitas e despesas e calcula o saldo', async () => {
    await repo.save(lancamento({ tipo: 'RECEITA', valor: 5000 }));
    await repo.save(lancamento({ tipo: 'RECEITA', valor: 200 }));
    await repo.save(lancamento({ tipo: 'DESPESA', valor: 1500 }));

    const resumo = await useCase.execute('2026-05');

    expect(resumo).toEqual({
      competencia: '2026-05',
      totalReceitas: 5200,
      totalDespesas: 1500,
      saldo: 3700,
    });
  });

  it('retorna zeros para um mês sem lançamentos', async () => {
    const resumo = await useCase.execute('2026-07');
    expect(resumo).toEqual({
      competencia: '2026-07',
      totalReceitas: 0,
      totalDespesas: 0,
      saldo: 0,
    });
  });

  it('não acumula erro de ponto flutuante na soma', async () => {
    await repo.save(lancamento({ tipo: 'DESPESA', valor: 0.1 }));
    await repo.save(lancamento({ tipo: 'DESPESA', valor: 0.2 }));

    const resumo = await useCase.execute('2026-05');

    expect(resumo.totalDespesas).toBe(0.3);
    expect(resumo.saldo).toBe(-0.3);
  });

  it('usa o valor pago (valorEfetivo) quando a ocorrência foi marcada como paga', async () => {
    const ocorrencia = lancamento({
      tipo: 'DESPESA',
      valor: 200,
      origemRegraId: 'regra-1',
      ocorrenciaIndice: 1,
    }).registrarPagamento(true, 237);
    await repo.save(ocorrencia);

    const resumo = await useCase.execute('2026-05');

    expect(resumo.totalDespesas).toBe(237);
  });

  it('ignora ocorrências de recorrência ainda não pagas', async () => {
    // Manual sempre conta; recorrência não paga fica de fora.
    await repo.save(lancamento({ tipo: 'DESPESA', valor: 100 }));
    await repo.save(
      lancamento({
        tipo: 'DESPESA',
        valor: 300,
        origemRegraId: 'regra-1',
        ocorrenciaIndice: 1,
      }),
    );

    const resumo = await useCase.execute('2026-05');

    expect(resumo.totalDespesas).toBe(100);
  });

  it('considera apenas lançamentos da competência solicitada', async () => {
    await repo.save(lancamento({ tipo: 'RECEITA', valor: 100, competencia: '2026-05' }));
    await repo.save(lancamento({ tipo: 'RECEITA', valor: 999, competencia: '2026-06' }));

    const resumo = await useCase.execute('2026-05');

    expect(resumo.totalReceitas).toBe(100);
  });
});
