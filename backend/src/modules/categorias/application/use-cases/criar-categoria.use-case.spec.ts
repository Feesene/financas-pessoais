import { CriarCategoriaUseCase } from './criar-categoria.use-case';
import { CategoriaDuplicadaError } from '../errors/categoria-duplicada.error';
import { InMemoryCategoriaRepository } from '../../../../../test/in-memory-categoria.repository';

describe('CriarCategoriaUseCase', () => {
  let categorias: InMemoryCategoriaRepository;
  let useCase: CriarCategoriaUseCase;

  beforeEach(() => {
    categorias = new InMemoryCategoriaRepository();
    useCase = new CriarCategoriaUseCase(categorias);
  });

  it('cria e persiste a categoria', async () => {
    const dto = await useCase.execute({ nome: 'Alimentação', tipo: 'DESPESA', cor: '#22c55e' });
    expect(dto).toMatchObject({ nome: 'Alimentação', tipo: 'DESPESA', cor: '#22c55e' });
    expect(await categorias.findById(dto.id)).not.toBeNull();
  });

  it('rejeita duplicidade de (nome, tipo) — ignorando caixa', async () => {
    await useCase.execute({ nome: 'Alimentação', tipo: 'DESPESA' });
    await expect(
      useCase.execute({ nome: 'alimentação', tipo: 'DESPESA' }),
    ).rejects.toBeInstanceOf(CategoriaDuplicadaError);
  });

  it('permite mesmo nome em tipos diferentes', async () => {
    await useCase.execute({ nome: 'Investimentos', tipo: 'DESPESA' });
    await expect(
      useCase.execute({ nome: 'Investimentos', tipo: 'RECEITA' }),
    ).resolves.toMatchObject({ tipo: 'RECEITA' });
  });
});
