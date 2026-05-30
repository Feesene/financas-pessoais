import { ObterEvolucaoAtivoUseCase } from './obter-evolucao-ativo.use-case';
import { RegistrarCotacaoUseCase } from './registrar-cotacao.use-case';
import { Ativo, type AtivoProps } from '../../domain/entities/ativo';
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

describe('ObterEvolucaoAtivoUseCase', () => {
  let ativos: InMemoryAtivoRepository;
  let cotacoes: InMemoryCotacaoAtivoRepository;
  let registrar: RegistrarCotacaoUseCase;
  let useCase: ObterEvolucaoAtivoUseCase;

  beforeEach(() => {
    ativos = new InMemoryAtivoRepository();
    cotacoes = new InMemoryCotacaoAtivoRepository();
    registrar = new RegistrarCotacaoUseCase(ativos, cotacoes);
    useCase = new ObterEvolucaoAtivoUseCase(ativos, cotacoes);
  });

  it('lança 404 quando o ativo não existe', async () => {
    await expect(useCase.execute('inexistente')).rejects.toBeInstanceOf(AtivoNaoEncontradoError);
  });

  it('retorna lista vazia sem cotações', async () => {
    const ativo = novoAtivo({ tipo: 'FUNDO', valorBruto: 100 });
    await ativos.save(ativo);
    expect(await useCase.execute(ativo.id)).toEqual([]);
  });

  it('ordena por competência asc e calcula valorBrutoEfetivo (ação)', async () => {
    const ativo = novoAtivo({ tipo: 'ACAO', quantidade: 10, valorUnitario: 5, valorBruto: 0 });
    await ativos.save(ativo);
    await registrar.execute({ ativoId: ativo.id, competencia: '2026-02', valorUnitario: 7 });
    await registrar.execute({ ativoId: ativo.id, competencia: '2026-01', valorUnitario: 6 });

    const evolucao = await useCase.execute(ativo.id);
    expect(evolucao.map((p) => p.competencia)).toEqual(['2026-01', '2026-02']);
    expect(evolucao[0]).toMatchObject({ valorUnitario: 6, valorBrutoEfetivo: 60 });
    expect(evolucao[1]).toMatchObject({ valorUnitario: 7, valorBrutoEfetivo: 70 });
  });

  it('usa o valorBruto do snapshot para fundo', async () => {
    const ativo = novoAtivo({ tipo: 'FUNDO', valorBruto: 100 });
    await ativos.save(ativo);
    await registrar.execute({ ativoId: ativo.id, competencia: '2026-01', valorBruto: 1234.56 });

    const evolucao = await useCase.execute(ativo.id);
    expect(evolucao[0]).toMatchObject({ valorBruto: 1234.56, valorBrutoEfetivo: 1234.56 });
  });
});
