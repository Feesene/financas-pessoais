import { RegistrarCotacaoUseCase } from './registrar-cotacao.use-case';
import { Ativo, type AtivoProps } from '../../domain/entities/ativo';
import { CotacaoAtivoInvalidaError } from '../../domain/errors/cotacao-ativo-invalida.error';
import { AtivoNaoEncontradoError } from '../errors/ativo-nao-encontrado.error';
import { InMemoryAtivoRepository } from '../../../../../test/in-memory-ativo.repository';
import { InMemoryCotacaoAtivoRepository } from '../../../../../test/in-memory-cotacao-ativo.repository';

let seq = 0;
function novoAtivo(overrides: Partial<AtivoProps>): Ativo {
  seq += 1;
  return Ativo.criar({
    id: `a-${seq}`,
    tipo: 'FUNDO',
    descricao: `Ativo ${seq}`,
    quantidade: null,
    valorUnitario: null,
    valorBruto: 0,
    rendimento: 0,
    ...overrides,
  });
}

describe('RegistrarCotacaoUseCase', () => {
  let ativos: InMemoryAtivoRepository;
  let cotacoes: InMemoryCotacaoAtivoRepository;
  let useCase: RegistrarCotacaoUseCase;

  beforeEach(() => {
    ativos = new InMemoryAtivoRepository();
    cotacoes = new InMemoryCotacaoAtivoRepository();
    useCase = new RegistrarCotacaoUseCase(ativos, cotacoes);
  });

  it('lança 404 quando o ativo não existe', async () => {
    await expect(
      useCase.execute({ ativoId: 'inexistente', competencia: '2026-01', valorBruto: 100 }),
    ).rejects.toBeInstanceOf(AtivoNaoEncontradoError);
  });

  it('registra cotação de fundo com valorBruto', async () => {
    const ativo = novoAtivo({ tipo: 'FUNDO', valorBruto: 100 });
    await ativos.save(ativo);

    const dto = await useCase.execute({
      ativoId: ativo.id,
      competencia: '2026-01',
      valorBruto: 1500,
    });

    expect(dto).toMatchObject({ valorBruto: 1500, valorUnitario: null });
    const salvas = await cotacoes.findByAtivo(ativo.id);
    expect(salvas).toHaveLength(1);
  });

  it('rejeita valorUnitario para fundo e valorBruto para ação', async () => {
    const fundo = novoAtivo({ tipo: 'FUNDO', valorBruto: 100 });
    const acao = novoAtivo({ tipo: 'ACAO', quantidade: 10, valorUnitario: 5, valorBruto: 0 });
    await ativos.save(fundo);
    await ativos.save(acao);

    await expect(
      useCase.execute({ ativoId: fundo.id, competencia: '2026-01', valorUnitario: 1 }),
    ).rejects.toBeInstanceOf(CotacaoAtivoInvalidaError);
    await expect(
      useCase.execute({ ativoId: acao.id, competencia: '2026-01', valorBruto: 1 }),
    ).rejects.toBeInstanceOf(CotacaoAtivoInvalidaError);
  });

  it('faz upsert ao registrar a mesma competência (preserva o id)', async () => {
    const ativo = novoAtivo({ tipo: 'FUNDO', valorBruto: 100 });
    await ativos.save(ativo);

    const primeira = await useCase.execute({
      ativoId: ativo.id,
      competencia: '2026-01',
      valorBruto: 1000,
    });
    const segunda = await useCase.execute({
      ativoId: ativo.id,
      competencia: '2026-01',
      valorBruto: 2000,
    });

    expect(segunda.id).toBe(primeira.id);
    const salvas = await cotacoes.findByAtivo(ativo.id);
    expect(salvas).toHaveLength(1);
    expect(salvas[0].valorBruto).toBe(2000);
  });

  it('atualiza o valor "atual" do ativo na competência mais recente', async () => {
    const ativo = novoAtivo({ tipo: 'ACAO', quantidade: 10, valorUnitario: 5, valorBruto: 0 });
    await ativos.save(ativo);

    await useCase.execute({ ativoId: ativo.id, competencia: '2026-03', valorUnitario: 8 });

    const atualizado = await ativos.findById(ativo.id);
    expect(atualizado?.valorUnitario).toBe(8);
    expect(atualizado?.valorBruto).toBe(80);
  });

  it('não altera o valor "atual" do ativo ao registrar competência mais antiga', async () => {
    const ativo = novoAtivo({ tipo: 'ACAO', quantidade: 10, valorUnitario: 5, valorBruto: 0 });
    await ativos.save(ativo);

    await useCase.execute({ ativoId: ativo.id, competencia: '2026-03', valorUnitario: 8 });
    await useCase.execute({ ativoId: ativo.id, competencia: '2026-01', valorUnitario: 2 });

    const atualizado = await ativos.findById(ativo.id);
    expect(atualizado?.valorUnitario).toBe(8);
  });
});
