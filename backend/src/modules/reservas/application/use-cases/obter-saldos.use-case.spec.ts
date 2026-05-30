import { ObterSaldosUseCase } from './obter-saldos.use-case';
import { Balde } from '../../domain/entities/balde';
import { MovimentoReserva, type MovimentoReservaProps } from '../../domain/entities/movimento-reserva';
import { InMemoryBaldeRepository } from '../../../../../test/in-memory-balde.repository';
import { InMemoryMovimentoReservaRepository } from '../../../../../test/in-memory-movimento-reserva.repository';

function balde(id: string, nome: string, saldoInicial = 0): Balde {
  return Balde.criar({ id, nome, saldoInicial, cor: null });
}

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

describe('ObterSaldosUseCase', () => {
  let baldes: InMemoryBaldeRepository;
  let movimentos: InMemoryMovimentoReservaRepository;
  let useCase: ObterSaldosUseCase;

  beforeEach(() => {
    baldes = new InMemoryBaldeRepository();
    movimentos = new InMemoryMovimentoReservaRepository();
    useCase = new ObterSaldosUseCase(baldes, movimentos);
  });

  it('balde sem movimentos tem saldo igual ao saldo inicial', async () => {
    await baldes.save(balde('b1', 'Emergência', 500));

    const resultado = await useCase.execute(null);

    expect(resultado.baldes).toHaveLength(1);
    expect(resultado.baldes[0]).toMatchObject({ saldo: 500, negativo: false });
    expect(resultado.total).toBe(500);
  });

  it('calcula saldo inicial + aportes − retiradas', async () => {
    await baldes.save(balde('b1', 'Viagem', 100));
    await movimentos.save(movimento({ tipo: 'APORTE', valor: 300, competencia: '2026-02' }));
    await movimentos.save(movimento({ tipo: 'RETIRADA', valor: 50, competencia: '2026-03' }));

    const resultado = await useCase.execute(null);

    expect(resultado.baldes[0].saldo).toBe(350);
    expect(resultado.total).toBe(350);
  });

  it('sinaliza saldo negativo quando a retirada excede o disponível', async () => {
    await baldes.save(balde('b1', 'Fundo', 0));
    await movimentos.save(movimento({ tipo: 'RETIRADA', valor: 80 }));

    const resultado = await useCase.execute(null);

    expect(resultado.baldes[0]).toMatchObject({ saldo: -80, negativo: true });
  });

  it('soma o total considerando todos os baldes', async () => {
    await baldes.save(balde('b1', 'A', 100));
    await baldes.save(balde('b2', 'B', 200));
    await movimentos.save(movimento({ baldeId: 'b2', tipo: 'APORTE', valor: 50 }));

    const resultado = await useCase.execute(null);

    expect(resultado.total).toBe(350);
  });

  it('respeita a competência: ignora movimentos posteriores (carry-over)', async () => {
    await baldes.save(balde('b1', 'Meta', 0));
    await movimentos.save(movimento({ tipo: 'APORTE', valor: 100, competencia: '2026-01' }));
    await movimentos.save(movimento({ tipo: 'APORTE', valor: 100, competencia: '2026-03' }));

    // Em 2026-02 não há movimento, mas o saldo carrega o de janeiro.
    const fevereiro = await useCase.execute('2026-02');
    expect(fevereiro.baldes[0].saldo).toBe(100);

    const marco = await useCase.execute('2026-03');
    expect(marco.baldes[0].saldo).toBe(200);
  });

  it('não acumula erro de ponto flutuante', async () => {
    await baldes.save(balde('b1', 'Centavos', 0));
    await movimentos.save(movimento({ tipo: 'APORTE', valor: 0.1 }));
    await movimentos.save(movimento({ tipo: 'APORTE', valor: 0.2 }));

    const resultado = await useCase.execute(null);

    expect(resultado.baldes[0].saldo).toBe(0.3);
  });
});
