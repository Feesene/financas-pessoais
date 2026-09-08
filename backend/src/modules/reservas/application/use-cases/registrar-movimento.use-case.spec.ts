import { RegistrarMovimentoUseCase } from './registrar-movimento.use-case';
import { EditarMovimentoUseCase } from './editar-movimento.use-case';
import { SaldoInsuficienteError } from '../errors/saldo-insuficiente.error';
import { Balde } from '../../domain/entities/balde';
import { InMemoryBaldeRepository } from '../../../../../test/in-memory-balde.repository';
import { InMemoryMovimentoReservaRepository } from '../../../../../test/in-memory-movimento-reserva.repository';

describe('Validação de saldo em movimentos de reserva', () => {
  let baldes: InMemoryBaldeRepository;
  let movimentos: InMemoryMovimentoReservaRepository;
  let registrar: RegistrarMovimentoUseCase;
  let editar: EditarMovimentoUseCase;

  const BALDE_ID = 'balde-1';

  beforeEach(async () => {
    baldes = new InMemoryBaldeRepository();
    movimentos = new InMemoryMovimentoReservaRepository();
    registrar = new RegistrarMovimentoUseCase(baldes, movimentos);
    editar = new EditarMovimentoUseCase(baldes, movimentos);
    await baldes.save(
      Balde.criar({ id: BALDE_ID, nome: 'Viagem', saldoInicial: 0, cor: null }),
    );
  });

  function aporte(valor: number, competencia: string) {
    return registrar.execute({ baldeId: BALDE_ID, tipo: 'APORTE', valor, competencia });
  }

  function retirada(valor: number, competencia: string) {
    return registrar.execute({ baldeId: BALDE_ID, tipo: 'RETIRADA', valor, competencia });
  }

  it('permite retirada até o saldo disponível', async () => {
    await aporte(500, '2026-03');
    const movimento = await retirada(500, '2026-04');
    expect(movimento.valor).toBe(500);
  });

  it('recusa retirada maior que o saldo do balde', async () => {
    await aporte(500, '2026-03');
    await expect(retirada(500.01, '2026-04')).rejects.toBeInstanceOf(SaldoInsuficienteError);
    expect(await movimentos.findByBaldeId(BALDE_ID)).toHaveLength(1);
  });

  it('conta o saldo inicial do balde como disponível', async () => {
    await baldes.save(
      Balde.criar({ id: 'balde-2', nome: 'Emergência', saldoInicial: 1000, cor: null }),
    );
    const movimento = await registrar.execute({
      baldeId: 'balde-2',
      tipo: 'RETIRADA',
      valor: 1000,
      competencia: '2026-04',
    });
    expect(movimento.valor).toBe(1000);
  });

  it('ignora aportes de meses posteriores ao da retirada', async () => {
    // O aporte de maio não cobre a retirada de abril: em abril o balde zera.
    await aporte(500, '2026-05');
    await expect(retirada(100, '2026-04')).rejects.toBeInstanceOf(SaldoInsuficienteError);
  });

  it('não acusa negativo transitório entre movimentos do mesmo mês', async () => {
    // Aporte e retirada de igual valor na mesma competência se cancelam: não há
    // ordem dentro do mês, então o saldo relevante é o do fim de abril.
    await aporte(300, '2026-04');
    const movimento = await retirada(300, '2026-04');
    expect(movimento.valor).toBe(300);
  });

  it('recusa retirada que deixaria um mês futuro negativo', async () => {
    await aporte(1000, '2026-01');
    await retirada(1000, '2026-06');
    // O saldo de janeiro a maio comporta os 800, mas junho já consumiu tudo.
    await expect(retirada(800, '2026-03')).rejects.toBeInstanceOf(SaldoInsuficienteError);
  });

  it('não bloqueia aportes', async () => {
    const movimento = await aporte(50, '2026-04');
    expect(movimento.tipo).toBe('APORTE');
  });

  it('a edição desconsidera a versão antiga do próprio movimento', async () => {
    await aporte(500, '2026-03');
    const movimento = await retirada(500, '2026-04');
    // Reduzir a própria retirada é sempre válido; contar as duas versões daria falso negativo.
    const editado = await editar.execute({
      id: movimento.id,
      tipo: 'RETIRADA',
      valor: 200,
      competencia: '2026-04',
    });
    expect(editado.valor).toBe(200);
  });

  it('a edição recusa aumentar a retirada além do saldo', async () => {
    await aporte(500, '2026-03');
    const movimento = await retirada(200, '2026-04');
    await expect(
      editar.execute({ id: movimento.id, tipo: 'RETIRADA', valor: 600, competencia: '2026-04' }),
    ).rejects.toBeInstanceOf(SaldoInsuficienteError);
  });

  it('a mensagem do erro nomeia o mês e o saldo resultante', async () => {
    await aporte(100, '2026-03');
    await expect(retirada(250, '2026-04')).rejects.toThrow(
      'Saldo insuficiente: o balde ficaria com R$ -150,00 em 2026-04.',
    );
  });
});
