import { RegistrarPagamentoUseCase } from './registrar-pagamento.use-case';
import { Lancamento, type LancamentoProps } from '../../domain/entities/lancamento';
import { LancamentoNaoEncontradoError } from '../errors/lancamento-nao-encontrado.error';
import { PagamentoLancamentoManualError } from '../../domain/errors/pagamento-lancamento-manual.error';
import { InMemoryLancamentoRepository } from '../../../../../test/in-memory-lancamento.repository';

function ocorrencia(overrides: Partial<LancamentoProps> = {}): Lancamento {
  return Lancamento.criar({
    id: 'l-1',
    tipo: 'DESPESA',
    categoria: 'Luz',
    categoriaId: null,
    descricao: null,
    valor: 200,
    competencia: '2026-05',
    origemRegraId: 'regra-1',
    ocorrenciaIndice: 1,
    ...overrides,
  });
}

describe('RegistrarPagamentoUseCase', () => {
  let repo: InMemoryLancamentoRepository;
  let useCase: RegistrarPagamentoUseCase;

  beforeEach(() => {
    repo = new InMemoryLancamentoRepository();
    useCase = new RegistrarPagamentoUseCase(repo);
  });

  it('marca como pago com o valor informado', async () => {
    await repo.save(ocorrencia());
    const out = await useCase.execute({ id: 'l-1', pago: true, valorPago: 237 });
    expect(out.pago).toBe(true);
    expect(out.valorPago).toBe(237);
  });

  it('pago sem valorPago assume o previsto', async () => {
    await repo.save(ocorrencia());
    const out = await useCase.execute({ id: 'l-1', pago: true });
    expect(out.valorPago).toBe(200);
  });

  it('desmarcar zera o valorPago', async () => {
    await repo.save(ocorrencia().registrarPagamento(true, 237));
    const out = await useCase.execute({ id: 'l-1', pago: false });
    expect(out.pago).toBe(false);
    expect(out.valorPago).toBeNull();
  });

  it('lança 404 quando o lançamento não existe', async () => {
    await expect(useCase.execute({ id: 'inexistente', pago: true })).rejects.toBeInstanceOf(
      LancamentoNaoEncontradoError,
    );
  });

  it('rejeita marcar como pago um lançamento manual', async () => {
    await repo.save(ocorrencia({ id: 'manual-1', origemRegraId: null, ocorrenciaIndice: null }));
    await expect(useCase.execute({ id: 'manual-1', pago: true })).rejects.toBeInstanceOf(
      PagamentoLancamentoManualError,
    );
  });
});
