import { ObterPosicaoCarteiraUseCase } from './obter-posicao-carteira.use-case';
import { RegistrarCotacaoUseCase } from './registrar-cotacao.use-case';
import { Ativo, type AtivoProps } from '../../domain/entities/ativo';
import { InMemoryAtivoRepository } from '../../../../../test/in-memory-ativo.repository';
import { InMemoryCotacaoAtivoRepository } from '../../../../../test/in-memory-cotacao-ativo.repository';

let seq = 0;
function ativo(overrides: Partial<AtivoProps>): Ativo {
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

describe('ObterPosicaoCarteiraUseCase', () => {
  let ativos: InMemoryAtivoRepository;
  let cotacoes: InMemoryCotacaoAtivoRepository;
  let useCase: ObterPosicaoCarteiraUseCase;

  beforeEach(() => {
    ativos = new InMemoryAtivoRepository();
    cotacoes = new InMemoryCotacaoAtivoRepository();
    useCase = new ObterPosicaoCarteiraUseCase(ativos, cotacoes);
  });

  it('carteira vazia tem total e rendimento zero', async () => {
    const posicao = await useCase.execute();
    expect(posicao.ativos).toHaveLength(0);
    expect(posicao.subtotais).toHaveLength(0);
    expect(posicao.total).toBe(0);
    expect(posicao.rendimentoTotal).toBe(0);
  });

  it('agrega subtotais por tipo, total geral e rendimento total', async () => {
    await ativos.save(ativo({ tipo: 'FUNDO', valorBruto: 1000, rendimento: 50 }));
    await ativos.save(
      ativo({ tipo: 'ACAO', quantidade: 10, valorUnitario: 20, valorBruto: 0, rendimento: 30 }),
    );
    await ativos.save(
      ativo({ tipo: 'ACAO', quantidade: 5, valorUnitario: 10, valorBruto: 0, rendimento: 0 }),
    );
    await ativos.save(
      ativo({ tipo: 'FII', quantidade: 2, valorUnitario: 100, valorBruto: 0, rendimento: 12 }),
    );

    const posicao = await useCase.execute();

    const acao = posicao.subtotais.find((s) => s.tipo === 'ACAO');
    const fii = posicao.subtotais.find((s) => s.tipo === 'FII');
    const fundo = posicao.subtotais.find((s) => s.tipo === 'FUNDO');

    expect(acao).toMatchObject({ total: 250, rendimento: 30 });
    expect(fii).toMatchObject({ total: 200, rendimento: 12 });
    expect(fundo).toMatchObject({ total: 1000, rendimento: 50 });

    expect(posicao.total).toBe(1450);
    expect(posicao.rendimentoTotal).toBe(92);
  });

  it('não acumula erro de ponto flutuante na soma', async () => {
    await ativos.save(ativo({ tipo: 'FUNDO', valorBruto: 0.1 }));
    await ativos.save(ativo({ tipo: 'FUNDO', valorBruto: 0.2 }));

    const posicao = await useCase.execute();
    expect(posicao.total).toBe(0.3);
  });

  it('reflete o snapshot de cotação mais recente quando há cotações', async () => {
    const acao = ativo({ tipo: 'ACAO', quantidade: 10, valorUnitario: 5, valorBruto: 0 });
    await ativos.save(acao);
    const registrar = new RegistrarCotacaoUseCase(ativos, cotacoes);
    await registrar.execute({ ativoId: acao.id, competencia: '2026-01', valorUnitario: 6 });
    await registrar.execute({ ativoId: acao.id, competencia: '2026-03', valorUnitario: 8 });

    const posicao = await useCase.execute();
    expect(posicao.total).toBe(80);
    expect(posicao.ativos[0]).toMatchObject({ valorUnitario: 8, valorBruto: 80 });
  });

  it('usa o valor do próprio ativo como fallback sem cotações', async () => {
    await ativos.save(ativo({ tipo: 'FUNDO', valorBruto: 500 }));
    const posicao = await useCase.execute();
    expect(posicao.total).toBe(500);
  });
});
