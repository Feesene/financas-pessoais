import { Categoria } from './categoria';
import { CategoriaInvalidaError } from '../errors/categoria-invalida.error';

describe('Categoria (domínio)', () => {
  function criar(overrides: Partial<Parameters<typeof Categoria.criar>[0]> = {}) {
    return Categoria.criar({
      id: 'c-1',
      nome: 'Alimentação',
      tipo: 'DESPESA',
      cor: null,
      ...overrides,
    });
  }

  it('cria uma categoria válida e expõe ehDespesa', () => {
    const categoria = criar();
    expect(categoria.nome).toBe('Alimentação');
    expect(categoria.ehDespesa).toBe(true);
  });

  it('marca ehDespesa como false para receita', () => {
    expect(criar({ tipo: 'RECEITA' }).ehDespesa).toBe(false);
  });

  it('faz trim do nome', () => {
    expect(criar({ nome: '  Lazer  ' }).nome).toBe('Lazer');
  });

  it('rejeita nome vazio', () => {
    expect(() => criar({ nome: '   ' })).toThrow(CategoriaInvalidaError);
  });

  it('rejeita nome acima de 80 caracteres', () => {
    expect(() => criar({ nome: 'x'.repeat(81) })).toThrow(CategoriaInvalidaError);
  });

  it('aceita cor hex válida e normaliza nula quando vazia', () => {
    expect(criar({ cor: '#22c55e' }).cor).toBe('#22c55e');
    expect(criar({ cor: '   ' }).cor).toBeNull();
  });

  it('rejeita cor fora do formato hexadecimal', () => {
    expect(() => criar({ cor: 'verde' })).toThrow(CategoriaInvalidaError);
  });

  it('atualizar preserva id e tipo e substitui nome/cor', () => {
    const atualizada = criar().atualizar({ nome: 'Mercado', cor: '#3b82f6' });
    expect(atualizada.id).toBe('c-1');
    expect(atualizada.tipo).toBe('DESPESA');
    expect(atualizada.nome).toBe('Mercado');
    expect(atualizada.cor).toBe('#3b82f6');
  });
});
