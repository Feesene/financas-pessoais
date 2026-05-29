import { Lancamento, type LancamentoProps } from './lancamento';
import { LancamentoInvalidoError } from '../errors/lancamento-invalido.error';

function props(overrides: Partial<LancamentoProps> = {}): LancamentoProps {
  return {
    id: 'id-1',
    tipo: 'DESPESA',
    categoria: 'Alimentação',
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
});
