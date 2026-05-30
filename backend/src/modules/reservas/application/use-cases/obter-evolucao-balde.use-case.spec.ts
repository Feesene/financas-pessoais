import { ObterEvolucaoBaldeUseCase } from './obter-evolucao-balde.use-case';
import { Balde } from '../../domain/entities/balde';
import { MovimentoReserva, type MovimentoReservaProps } from '../../domain/entities/movimento-reserva';
import { BaldeNaoEncontradoError } from '../errors/balde-nao-encontrado.error';
import { InMemoryBaldeRepository } from '../../../../../test/in-memory-balde.repository';
import { InMemoryMovimentoReservaRepository } from '../../../../../test/in-memory-movimento-reserva.repository';

let seq = 0;
function movimento(overrides: Partial<MovimentoReservaProps>): MovimentoReserva {
  seq += 1;
  return MovimentoReserva.criar({
    id: `m-${seq}`,
    baldeId: 'b1',
    tipo: 'APORTE',
    valor: 100,
    competencia: '2026-01',
    descricao: null,
    ...overrides,
  });
}

describe('ObterEvolucaoBaldeUseCase', () => {
  let baldes: InMemoryBaldeRepository;
  let movimentos: InMemoryMovimentoReservaRepository;
  let useCase: ObterEvolucaoBaldeUseCase;

  beforeEach(() => {
    baldes = new InMemoryBaldeRepository();
    movimentos = new InMemoryMovimentoReservaRepository();
    useCase = new ObterEvolucaoBaldeUseCase(baldes, movimentos);
  });

  it('lança erro quando o balde não existe', async () => {
    await expect(useCase.execute('inexistente')).rejects.toBeInstanceOf(BaldeNaoEncontradoError);
  });

  it('retorna vazio para balde sem movimentos', async () => {
    await baldes.save(Balde.criar({ id: 'b1', nome: 'Vazio', saldoInicial: 100, cor: null }));

    const evolucao = await useCase.execute('b1');

    expect(evolucao).toEqual([]);
  });

  it('acumula o saldo ao fim de cada competência, em ordem cronológica', async () => {
    await baldes.save(Balde.criar({ id: 'b1', nome: 'Plano', saldoInicial: 50, cor: null }));
    await movimentos.save(movimento({ tipo: 'APORTE', valor: 100, competencia: '2026-03' }));
    await movimentos.save(movimento({ tipo: 'APORTE', valor: 100, competencia: '2026-01' }));
    await movimentos.save(movimento({ tipo: 'RETIRADA', valor: 30, competencia: '2026-03' }));

    const evolucao = await useCase.execute('b1');

    expect(evolucao).toEqual([
      { competencia: '2026-01', saldo: 150 },
      { competencia: '2026-03', saldo: 220 },
    ]);
  });
});
