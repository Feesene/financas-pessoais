import { Lancamento, type LancamentoProps } from './lancamento';
import { LancamentoInvalidoError } from '../errors/lancamento-invalido.error';
import { PagamentoLancamentoManualError } from '../errors/pagamento-lancamento-manual.error';

function props(overrides: Partial<LancamentoProps> = {}): LancamentoProps {
  return {
    id: 'id-1',
    tipo: 'DESPESA',
    categoria: 'Alimentação',
    categoriaId: null,
    descricao: null,
    valor: 100,
    competencia: '2026-05',
    ...overrides,
  };
}

describe('Lancamento.criar', () => {
  it('cria um lançamento válido e faz trim da categoria', () => {
    const lancamento = Lancamento.criar(props({ categoria: '  Mercado  ' }));
    expect(lancamento.categoria).toBe('Mercado');
  });

  it('rejeita valor menor ou igual a zero', () => {
    expect(() => Lancamento.criar(props({ valor: 0 }))).toThrow(LancamentoInvalidoError);
    expect(() => Lancamento.criar(props({ valor: -5 }))).toThrow(LancamentoInvalidoError);
  });

  it('rejeita categoria vazia', () => {
    expect(() => Lancamento.criar(props({ categoria: '   ' }))).toThrow(LancamentoInvalidoError);
  });

  it('rejeita competência fora do formato AAAA-MM', () => {
    expect(() => Lancamento.criar(props({ competencia: '2026-13' }))).toThrow(
      LancamentoInvalidoError,
    );
    expect(() => Lancamento.criar(props({ competencia: '2026/05' }))).toThrow(
      LancamentoInvalidoError,
    );
  });

  it('calcula valorComSinal positivo para receita e negativo para despesa', () => {
    expect(Lancamento.criar(props({ tipo: 'RECEITA', valor: 100 })).valorComSinal).toBe(100);
    expect(Lancamento.criar(props({ tipo: 'DESPESA', valor: 100 })).valorComSinal).toBe(-100);
  });
});

describe('Lancamento.atualizar', () => {
  it('preserva o id e aplica os novos atributos', () => {
    const original = Lancamento.criar(props());
    const atualizado = original.atualizar({
      tipo: 'RECEITA',
      categoria: 'Salário',
      descricao: 'Pagamento',
      valor: 5000,
      competencia: '2026-06',
    });

    expect(atualizado.id).toBe(original.id);
    expect(atualizado.tipo).toBe('RECEITA');
    expect(atualizado.categoria).toBe('Salário');
    expect(atualizado.valor).toBe(5000);
    expect(atualizado.competencia).toBe('2026-06');
  });

  it('reaplica as invariantes ao atualizar (valor inválido lança erro)', () => {
    const original = Lancamento.criar(props());
    expect(() =>
      original.atualizar({
        tipo: 'DESPESA',
        categoria: 'Alimentação',
        descricao: null,
        valor: 0,
        competencia: '2026-05',
      }),
    ).toThrow(LancamentoInvalidoError);
  });

  it('preserva pago/valorPago ao atualizar (PUT não toca no pagamento)', () => {
    const original = Lancamento.criar(
      props({ origemRegraId: 'regra-1', ocorrenciaIndice: 1, pago: true, valorPago: 237 }),
    );
    const atualizado = original.atualizar({
      tipo: 'DESPESA',
      categoria: 'Alimentação',
      descricao: 'nova descrição',
      valor: 200,
      competencia: '2026-05',
    });
    expect(atualizado.pago).toBe(true);
    expect(atualizado.valorPago).toBe(237);
  });
});

describe('Lancamento pagamento e valorEfetivo', () => {
  const ocorrencia = (overrides: Partial<LancamentoProps> = {}) =>
    props({ origemRegraId: 'regra-1', ocorrenciaIndice: 1, valor: 200, ...overrides });

  it('valorEfetivo usa o previsto enquanto não pago', () => {
    const l = Lancamento.criar(ocorrencia());
    expect(l.pago).toBe(false);
    expect(l.valorPago).toBeNull();
    expect(l.valorEfetivo).toBe(200);
  });

  it('valorEfetivo usa o valorPago quando pago', () => {
    const l = Lancamento.criar(ocorrencia()).registrarPagamento(true, 237);
    expect(l.pago).toBe(true);
    expect(l.valorPago).toBe(237);
    expect(l.valorEfetivo).toBe(237);
  });

  it('pago sem valorPago assume o previsto', () => {
    const l = Lancamento.criar(ocorrencia()).registrarPagamento(true);
    expect(l.valorPago).toBe(200);
    expect(l.valorEfetivo).toBe(200);
  });

  it('desmarcar zera o valorPago e volta ao previsto', () => {
    const pago = Lancamento.criar(ocorrencia()).registrarPagamento(true, 237);
    const desmarcado = pago.registrarPagamento(false);
    expect(desmarcado.pago).toBe(false);
    expect(desmarcado.valorPago).toBeNull();
    expect(desmarcado.valorEfetivo).toBe(200);
  });

  it('valorEfetivoComSinal acompanha o tipo', () => {
    const despesa = Lancamento.criar(ocorrencia()).registrarPagamento(true, 237);
    expect(despesa.valorEfetivoComSinal).toBe(-237);
    const receita = Lancamento.criar(ocorrencia({ tipo: 'RECEITA' })).registrarPagamento(true, 237);
    expect(receita.valorEfetivoComSinal).toBe(237);
  });

  it('rejeita marcar como pago um lançamento manual', () => {
    const manual = Lancamento.criar(props());
    expect(() => manual.registrarPagamento(true)).toThrow(PagamentoLancamentoManualError);
  });

  it('rejeita criar lançamento manual já pago', () => {
    expect(() => Lancamento.criar(props({ pago: true }))).toThrow(PagamentoLancamentoManualError);
  });
});
