import { MetaMensal } from './meta-mensal';
import { MetaInvalidaError } from '../errors/meta-invalida.error';

describe('MetaMensal (domínio)', () => {
  function criar(overrides: Partial<Parameters<typeof MetaMensal.criar>[0]> = {}) {
    return MetaMensal.criar({
      id: 'm-1',
      categoriaId: 'c-1',
      competencia: '2026-05',
      valor: 500,
      ...overrides,
    });
  }

  it('cria uma meta válida', () => {
    const meta = criar();
    expect(meta.valor).toBe(500);
    expect(meta.competencia).toBe('2026-05');
  });

  it('rejeita valor zero ou negativo', () => {
    expect(() => criar({ valor: 0 })).toThrow(MetaInvalidaError);
    expect(() => criar({ valor: -1 })).toThrow(MetaInvalidaError);
  });

  it('rejeita competência fora do formato AAAA-MM', () => {
    expect(() => criar({ competencia: '2026-13' })).toThrow(MetaInvalidaError);
    expect(() => criar({ competencia: '05-2026' })).toThrow(MetaInvalidaError);
  });
});
