import { ObterEvolucaoReservasUseCase } from './obter-evolucao-reservas.use-case';
import { Balde } from '../../domain/entities/balde';
import { MovimentoReserva, type MovimentoReservaProps } from '../../domain/entities/movimento-reserva';
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

describe('ObterEvolucaoReservasUseCase', () => {
  let baldes: InMemoryBaldeRepository;
  let movimentos: InMemoryMovimentoReservaRepository;
  let useCase: ObterEvolucaoReservasUseCase;

  beforeEach(() => {
    baldes = new InMemoryBaldeRepository();
    movimentos = new InMemoryMovimentoReservaRepository();
    useCase = new ObterEvolucaoReservasUseCase(baldes, movimentos);
  });

  it('retorna 12 pontos com total = Σ saldoInicial quando não há movimentos', async () => {
    await baldes.save(Balde.criar({ id: 'b1', nome: 'A', saldoInicial: 1000, cor: null }));
    await baldes.save(Balde.criar({ id: 'b2', nome: 'B', saldoInicial: 500, cor: null }));

    const serie = await useCase.execute(2026);

    expect(serie).toHaveLength(12);
    expect(serie.map((p) => p.competencia)).toEqual([
      '2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06',
      '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12',
    ]);
    expect(serie.every((p) => p.total === 1500)).toBe(true);
  });

  it('retorna 12 pontos com total 0 quando não há baldes nem movimentos', async () => {
    const serie = await useCase.execute(2026);

    expect(serie).toHaveLength(12);
    expect(serie.every((p) => p.total === 0)).toBe(true);
  });

  it('acumula efeitos de todos os baldes ao longo do ano (série contínua)', async () => {
    await baldes.save(Balde.criar({ id: 'b1', nome: 'A', saldoInicial: 100, cor: null }));
    await movimentos.save(movimento({ baldeId: 'b1', tipo: 'APORTE', valor: 200, competencia: '2026-02' }));
    await movimentos.save(movimento({ baldeId: 'b1', tipo: 'APORTE', valor: 50, competencia: '2026-05' }));
    await movimentos.save(movimento({ baldeId: 'b1', tipo: 'RETIRADA', valor: 30, competencia: '2026-05' }));

    const serie = await useCase.execute(2026);

    expect(serie[0].total).toBe(100); // Jan: só base
    expect(serie[1].total).toBe(300); // Fev: +200
    expect(serie[3].total).toBe(300); // Abr: repete acumulado
    expect(serie[4].total).toBe(320); // Mai: +50 -30
    expect(serie[11].total).toBe(320); // Dez: mantém
  });

  it('movimentos anteriores ao ano entram na base de Janeiro', async () => {
    await baldes.save(Balde.criar({ id: 'b1', nome: 'A', saldoInicial: 100, cor: null }));
    await movimentos.save(movimento({ baldeId: 'b1', tipo: 'APORTE', valor: 400, competencia: '2025-12' }));
    await movimentos.save(movimento({ baldeId: 'b1', tipo: 'APORTE', valor: 60, competencia: '2026-03' }));

    const serie = await useCase.execute(2026);

    expect(serie[0].total).toBe(500); // base 100 + 400 anterior
    expect(serie[2].total).toBe(560); // Mar: +60
  });

  it('permite saldo acumulado negativo', async () => {
    await baldes.save(Balde.criar({ id: 'b1', nome: 'A', saldoInicial: 100, cor: null }));
    await movimentos.save(movimento({ baldeId: 'b1', tipo: 'RETIRADA', valor: 300, competencia: '2026-04' }));

    const serie = await useCase.execute(2026);

    expect(serie[3].total).toBe(-200);
  });
});
