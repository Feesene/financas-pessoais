import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type {
  BaldeDTO,
  EvolucaoBaldeDTO,
  MovimentoReservaDTO,
  SaldosReservaDTO,
} from '@financas-pessoais/shared';
import { BaldesController } from '../src/modules/reservas/presentation/controllers/baldes.controller';
import { MovimentosController } from '../src/modules/reservas/presentation/controllers/movimentos.controller';
import { ReservasController } from '../src/modules/reservas/presentation/controllers/reservas.controller';
import { CriarBaldeUseCase } from '../src/modules/reservas/application/use-cases/criar-balde.use-case';
import { ListarBaldesUseCase } from '../src/modules/reservas/application/use-cases/listar-baldes.use-case';
import { EditarBaldeUseCase } from '../src/modules/reservas/application/use-cases/editar-balde.use-case';
import { ExcluirBaldeUseCase } from '../src/modules/reservas/application/use-cases/excluir-balde.use-case';
import { RegistrarMovimentoUseCase } from '../src/modules/reservas/application/use-cases/registrar-movimento.use-case';
import { ListarMovimentosBaldeUseCase } from '../src/modules/reservas/application/use-cases/listar-movimentos-balde.use-case';
import { ListarMovimentosCompetenciaUseCase } from '../src/modules/reservas/application/use-cases/listar-movimentos-competencia.use-case';
import { EditarMovimentoUseCase } from '../src/modules/reservas/application/use-cases/editar-movimento.use-case';
import { ExcluirMovimentoUseCase } from '../src/modules/reservas/application/use-cases/excluir-movimento.use-case';
import { ObterSaldosUseCase } from '../src/modules/reservas/application/use-cases/obter-saldos.use-case';
import { ObterEvolucaoBaldeUseCase } from '../src/modules/reservas/application/use-cases/obter-evolucao-balde.use-case';
import { BALDE_REPOSITORY } from '../src/modules/reservas/domain/repositories/balde.repository';
import { MOVIMENTO_RESERVA_REPOSITORY } from '../src/modules/reservas/domain/repositories/movimento-reserva.repository';
import { InMemoryBaldeRepository } from './in-memory-balde.repository';
import { InMemoryMovimentoReservaRepository } from './in-memory-movimento-reserva.repository';

describe('Reservas (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [BaldesController, MovimentosController, ReservasController],
      providers: [
        CriarBaldeUseCase,
        ListarBaldesUseCase,
        EditarBaldeUseCase,
        ExcluirBaldeUseCase,
        RegistrarMovimentoUseCase,
        ListarMovimentosBaldeUseCase,
        ListarMovimentosCompetenciaUseCase,
        EditarMovimentoUseCase,
        ExcluirMovimentoUseCase,
        ObterSaldosUseCase,
        ObterEvolucaoBaldeUseCase,
        { provide: BALDE_REPOSITORY, useClass: InMemoryBaldeRepository },
        { provide: MOVIMENTO_RESERVA_REPOSITORY, useClass: InMemoryMovimentoReservaRepository },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function criarBalde(nome: string, saldoInicial = 0): Promise<BaldeDTO> {
    const res = await request(server())
      .post('/baldes')
      .send({ nome, saldoInicial })
      .expect(201);
    return res.body as BaldeDTO;
  }

  async function movimentar(
    baldeId: string,
    tipo: 'APORTE' | 'RETIRADA',
    valor: number,
    competencia: string,
  ): Promise<MovimentoReservaDTO> {
    const res = await request(server())
      .post(`/baldes/${baldeId}/movimentos`)
      .send({ tipo, valor, competencia })
      .expect(201);
    return res.body as MovimentoReservaDTO;
  }

  it('cria balde e bloqueia nome duplicado (409)', async () => {
    await criarBalde('Emergência', 1000);
    await request(server())
      .post('/baldes')
      .send({ nome: 'emergência', saldoInicial: 0 })
      .expect(409);
  });

  it('rejeita balde inválido (400)', async () => {
    await request(server()).post('/baldes').send({ nome: '', saldoInicial: 0 }).expect(400);
  });

  it('registra movimento em balde inexistente (404)', async () => {
    await request(server())
      .post('/baldes/nao-existe/movimentos')
      .send({ tipo: 'APORTE', valor: 100, competencia: '2026-01' })
      .expect(404);
  });

  it('rejeita movimento com valor <= 0 (400)', async () => {
    const balde = await criarBalde('Viagem', 0);
    await request(server())
      .post(`/baldes/${balde.id}/movimentos`)
      .send({ tipo: 'APORTE', valor: 0, competencia: '2026-01' })
      .expect(400);
  });

  it('calcula saldos: saldo inicial + aportes − retiradas', async () => {
    const balde = await criarBalde('Carro', 200);
    await movimentar(balde.id, 'APORTE', 300, '2026-02');
    await movimentar(balde.id, 'RETIRADA', 50, '2026-03');

    const res = await request(server()).get('/reservas/saldos').expect(200);
    const saldos = res.body as SaldosReservaDTO;
    const item = saldos.baldes.find((b) => b.balde.id === balde.id);
    expect(item).toMatchObject({ saldo: 450, negativo: false });
  });

  it('respeita o carry-over entre meses na consulta por competência', async () => {
    const balde = await criarBalde('Meta', 0);
    await movimentar(balde.id, 'APORTE', 100, '2026-01');
    await movimentar(balde.id, 'APORTE', 100, '2026-03');

    const fevereiro = await request(server())
      .get('/reservas/saldos?competencia=2026-02')
      .expect(200);
    const itemFev = (fevereiro.body as SaldosReservaDTO).baldes.find(
      (b) => b.balde.id === balde.id,
    );
    expect(itemFev?.saldo).toBe(100);

    const marco = await request(server())
      .get('/reservas/saldos?competencia=2026-03')
      .expect(200);
    const itemMar = (marco.body as SaldosReservaDTO).baldes.find(
      (b) => b.balde.id === balde.id,
    );
    expect(itemMar?.saldo).toBe(200);
  });

  it('sinaliza saldo negativo sem bloquear a retirada', async () => {
    const balde = await criarBalde('Fundo', 0);
    await movimentar(balde.id, 'RETIRADA', 80, '2026-01');

    const res = await request(server()).get('/reservas/saldos').expect(200);
    const item = (res.body as SaldosReservaDTO).baldes.find((b) => b.balde.id === balde.id);
    expect(item).toMatchObject({ saldo: -80, negativo: true });
  });

  it('edita movimento e reflete no saldo; exclui e responde 404 ao repetir', async () => {
    const balde = await criarBalde('Reforma', 0);
    const mov = await movimentar(balde.id, 'APORTE', 100, '2026-04');

    await request(server())
      .put(`/movimentos/${mov.id}`)
      .send({ tipo: 'APORTE', valor: 250, competencia: '2026-04' })
      .expect(200);

    let res = await request(server()).get('/reservas/saldos').expect(200);
    let item = (res.body as SaldosReservaDTO).baldes.find((b) => b.balde.id === balde.id);
    expect(item?.saldo).toBe(250);

    await request(server()).delete(`/movimentos/${mov.id}`).expect(204);
    await request(server()).delete(`/movimentos/${mov.id}`).expect(404);

    res = await request(server()).get('/reservas/saldos').expect(200);
    item = (res.body as SaldosReservaDTO).baldes.find((b) => b.balde.id === balde.id);
    expect(item?.saldo).toBe(0);
  });

  it('expõe a evolução cumulativa por competência', async () => {
    const balde = await criarBalde('Plano', 50);
    await movimentar(balde.id, 'APORTE', 100, '2026-01');
    await movimentar(balde.id, 'APORTE', 100, '2026-03');
    await movimentar(balde.id, 'RETIRADA', 30, '2026-03');

    const res = await request(server()).get(`/baldes/${balde.id}/evolucao`).expect(200);
    expect(res.body as EvolucaoBaldeDTO[]).toEqual([
      { competencia: '2026-01', saldo: 150 },
      { competencia: '2026-03', saldo: 220 },
    ]);
  });

  it('bloqueia exclusão de balde com movimentos (409) e exclui balde livre (204)', async () => {
    const vinculado = await criarBalde('Com histórico', 0);
    await movimentar(vinculado.id, 'APORTE', 10, '2026-01');
    await request(server()).delete(`/baldes/${vinculado.id}`).expect(409);

    const livre = await criarBalde('Sem histórico', 0);
    await request(server()).delete(`/baldes/${livre.id}`).expect(204);
  });

  it('rejeita competência malformada na consulta de saldos (400)', async () => {
    await request(server()).get('/reservas/saldos?competencia=2026-13').expect(400);
  });
});
