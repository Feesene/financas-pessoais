import { CotacaoAtivo } from './cotacao-ativo';
import { CotacaoAtivoInvalidaError } from '../errors/cotacao-ativo-invalida.error';

function base() {
  return { id: 'c1', ativoId: 'a1', competencia: '2026-01' };
}

describe('CotacaoAtivo', () => {
  it('cria snapshot com valorUnitario (ação/FII)', () => {
    const cotacao = CotacaoAtivo.criar({ ...base(), valorUnitario: 25.5, valorBruto: null });
    expect(cotacao.valorUnitario).toBe(25.5);
    expect(cotacao.valorBruto).toBeNull();
  });

  it('cria snapshot com valorBruto (fundo)', () => {
    const cotacao = CotacaoAtivo.criar({ ...base(), valorUnitario: null, valorBruto: 1500 });
    expect(cotacao.valorBruto).toBe(1500);
    expect(cotacao.valorUnitario).toBeNull();
  });

  it('aceita valor zero', () => {
    const cotacao = CotacaoAtivo.criar({ ...base(), valorUnitario: 0, valorBruto: null });
    expect(cotacao.valorUnitario).toBe(0);
  });

  it('rejeita competência fora do formato AAAA-MM', () => {
    expect(() =>
      CotacaoAtivo.criar({ ...base(), competencia: '2026-13', valorUnitario: 1, valorBruto: null }),
    ).toThrow(CotacaoAtivoInvalidaError);
    expect(() =>
      CotacaoAtivo.criar({ ...base(), competencia: '202601', valorUnitario: 1, valorBruto: null }),
    ).toThrow(CotacaoAtivoInvalidaError);
  });

  it('rejeita quando ambos os valores são informados', () => {
    expect(() =>
      CotacaoAtivo.criar({ ...base(), valorUnitario: 1, valorBruto: 1 }),
    ).toThrow(CotacaoAtivoInvalidaError);
  });

  it('rejeita quando nenhum valor é informado', () => {
    expect(() =>
      CotacaoAtivo.criar({ ...base(), valorUnitario: null, valorBruto: null }),
    ).toThrow(CotacaoAtivoInvalidaError);
  });

  it('rejeita valor negativo', () => {
    expect(() =>
      CotacaoAtivo.criar({ ...base(), valorUnitario: null, valorBruto: -1 }),
    ).toThrow(CotacaoAtivoInvalidaError);
  });
});
