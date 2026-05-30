import { Ativo } from './ativo';
import { AtivoInvalidoError } from '../errors/ativo-invalido.error';

function base() {
  return { id: 'a1', descricao: 'Teste', rendimento: 0 };
}

describe('Ativo', () => {
  it('deriva valorBruto = quantidade × valorUnitario para ACAO', () => {
    const ativo = Ativo.criar({
      ...base(),
      tipo: 'ACAO',
      quantidade: 10,
      valorUnitario: 25.5,
      valorBruto: 0,
    });
    expect(ativo.valorBruto).toBe(255);
  });

  it('deriva valorBruto para FII ignorando o valorBruto informado', () => {
    const ativo = Ativo.criar({
      ...base(),
      tipo: 'FII',
      quantidade: 3,
      valorUnitario: 100,
      valorBruto: 999,
    });
    expect(ativo.valorBruto).toBe(300);
  });

  it('usa o valorBruto informado para FUNDO', () => {
    const ativo = Ativo.criar({
      ...base(),
      tipo: 'FUNDO',
      quantidade: null,
      valorUnitario: null,
      valorBruto: 1500.75,
    });
    expect(ativo.valorBruto).toBe(1500.75);
  });

  it('não acumula erro de ponto flutuante ao derivar', () => {
    const ativo = Ativo.criar({
      ...base(),
      tipo: 'ACAO',
      quantidade: 3,
      valorUnitario: 0.1,
      valorBruto: 0,
    });
    expect(ativo.valorBruto).toBe(0.3);
  });

  it('rejeita ACAO sem quantidade', () => {
    expect(() =>
      Ativo.criar({ ...base(), tipo: 'ACAO', quantidade: null, valorUnitario: 10, valorBruto: 0 }),
    ).toThrow(AtivoInvalidoError);
  });

  it('rejeita ACAO sem valorUnitario', () => {
    expect(() =>
      Ativo.criar({ ...base(), tipo: 'ACAO', quantidade: 5, valorUnitario: null, valorBruto: 0 }),
    ).toThrow(AtivoInvalidoError);
  });

  it('rejeita quantidade = 0 em ACAO', () => {
    expect(() =>
      Ativo.criar({ ...base(), tipo: 'ACAO', quantidade: 0, valorUnitario: 10, valorBruto: 0 }),
    ).toThrow(AtivoInvalidoError);
  });

  it('permite valorUnitario = 0 (ativo zerado)', () => {
    const ativo = Ativo.criar({
      ...base(),
      tipo: 'ACAO',
      quantidade: 5,
      valorUnitario: 0,
      valorBruto: 0,
    });
    expect(ativo.valorBruto).toBe(0);
  });

  it('rejeita FUNDO enviando quantidade/valorUnitario', () => {
    expect(() =>
      Ativo.criar({ ...base(), tipo: 'FUNDO', quantidade: 1, valorUnitario: null, valorBruto: 10 }),
    ).toThrow(AtivoInvalidoError);
  });

  it('rejeita descrição vazia', () => {
    expect(() =>
      Ativo.criar({ ...base(), descricao: '   ', tipo: 'FUNDO', quantidade: null, valorUnitario: null, valorBruto: 10 }),
    ).toThrow(AtivoInvalidoError);
  });

  it('recalcula valorBruto ao editar o valorUnitario de uma ação', () => {
    const ativo = Ativo.criar({
      ...base(),
      tipo: 'ACAO',
      quantidade: 10,
      valorUnitario: 20,
      valorBruto: 0,
    });
    const editado = ativo.atualizar({
      descricao: 'Teste',
      quantidade: 10,
      valorUnitario: 30,
      valorBruto: 0,
      rendimento: 0,
    });
    expect(editado.valorBruto).toBe(300);
  });
});
