import { ExcluirCotacaoUseCase } from './excluir-cotacao.use-case';
import { RegistrarCotacaoUseCase } from './registrar-cotacao.use-case';
import { Ativo, type AtivoProps } from '../../domain/entities/ativo';
import { AtivoNaoEncontradoError } from '../errors/ativo-nao-encontrado.error';
import { CotacaoNaoEncontradaError } from '../errors/cotacao-nao-encontrada.error';
import { InMemoryAtivoRepository } from '../../../../../test/in-memory-ativo.repository';
import { InMemoryCotacaoAtivoRepository } from '../../../../../test/in-memory-cotacao-ativo.repository';

let seq = 0;
function novoAtivo(overrides: Partial<AtivoProps>): Ativo {
  seq += 1;
  return Ativo.criar({
    id: `a-${seq}`,
    tipo: 'ACAO',
    descricao: `Ativo ${seq}`,
    quantidade: 10,
    valorUnitario: 5,
    valorBruto: 0,
    rendimento: 0,
    ...overrides,
  });
}

describe('ExcluirCotacaoUseCase', () => {
  let ativos: InMemoryAtivoRepository;
  let cotacoes: InMemoryCotacaoAtivoRepository;
  let registrar: RegistrarCotacaoUseCase;
  let useCase: ExcluirCotacaoUseCase;

  beforeEach(() => {
    ativos = new InMemoryAtivoRepository();
    cotacoes = new InMemoryCotacaoAtivoRepository();
    registrar = new RegistrarCotacaoUseCase(ativos, cotacoes);
    useCase = new ExcluirCotacaoUseCase(ativos, cotacoes);
  });

  it('lança 404 quando o ativo não existe', async () => {
    await expect(useCase.execute('inexistente', '2026-01')).rejects.toBeInstanceOf(
      AtivoNaoEncontradoError,
    );
  });

  it('lança erro quando a cotação não existe', async () => {
    const ativo = novoAtivo({});
    await ativos.save(ativo);
    await expect(useCase.execute(ativo.id, '2026-01')).rejects.toBeInstanceOf(
      CotacaoNaoEncontradaError,
    );
  });

  it('recalcula o valor "atual" do ativo a partir do snapshot restante', async () => {
    const ativo = novoAtivo({});
    await ativos.save(ativo);
    await registrar.execute({ ativoId: ativo.id, competencia: '2026-01', valorUnitario: 6 });
    await registrar.execute({ ativoId: ativo.id, competencia: '2026-02', valorUnitario: 9 });

    await useCase.execute(ativo.id, '2026-02');

    const atualizado = await ativos.findById(ativo.id);
    expect(atualizado?.valorUnitario).toBe(6);
    const restantes = await cotacoes.findByAtivo(ativo.id);
    expect(restantes).toHaveLength(1);
  });

  it('mantém o valor do ativo quando não restam snapshots', async () => {
    const ativo = novoAtivo({ valorUnitario: 5 });
    await ativos.save(ativo);
    await registrar.execute({ ativoId: ativo.id, competencia: '2026-01', valorUnitario: 9 });

    await useCase.execute(ativo.id, '2026-01');

    const atualizado = await ativos.findById(ativo.id);
    expect(atualizado?.valorUnitario).toBe(9);
  });
});
