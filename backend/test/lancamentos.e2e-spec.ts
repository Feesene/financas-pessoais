import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { LancamentoDTO } from '@financas-pessoais/shared';
import { LancamentosController } from '../src/modules/lancamentos/presentation/controllers/lancamentos.controller';
import { CriarLancamentoUseCase } from '../src/modules/lancamentos/application/use-cases/criar-lancamento.use-case';
import { ListarLancamentosUseCase } from '../src/modules/lancamentos/application/use-cases/listar-lancamentos.use-case';
import { EditarLancamentoUseCase } from '../src/modules/lancamentos/application/use-cases/editar-lancamento.use-case';
import { ExcluirLancamentoUseCase } from '../src/modules/lancamentos/application/use-cases/excluir-lancamento.use-case';
import { ObterResumoMensalUseCase } from '../src/modules/lancamentos/application/use-cases/obter-resumo-mensal.use-case';
import { LANCAMENTO_REPOSITORY } from '../src/modules/lancamentos/domain/repositories/lancamento.repository';
import { InMemoryLancamentoRepository } from './in-memory-lancamento.repository';

const COMPETENCIA = '2026-08';

describe('Lançamentos (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LancamentosController],
      providers: [
        CriarLancamentoUseCase,
        ListarLancamentosUseCase,
        EditarLancamentoUseCase,
        ExcluirLancamentoUseCase,
        ObterResumoMensalUseCase,
        { provide: LANCAMENTO_REPOSITORY, useClass: InMemoryLancamentoRepository },
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

  it('percorre o ciclo de vida: criar → listar → editar → resumo → excluir', async () => {
    // criar receita
    const receita = await request(server())
      .post('/lancamentos')
      .send({ tipo: 'RECEITA', categoria: 'Salário', valor: 5000, competencia: COMPETENCIA })
      .expect(201);
    const receitaId = (receita.body as LancamentoDTO).id;

    // criar despesa
    const despesa = await request(server())
      .post('/lancamentos')
      .send({ tipo: 'DESPESA', categoria: 'Aluguel', valor: 1500, competencia: COMPETENCIA })
      .expect(201);
    const despesaId = (despesa.body as LancamentoDTO).id;

    // listar
    const lista = await request(server())
      .get(`/lancamentos?competencia=${COMPETENCIA}`)
      .expect(200);
    expect((lista.body as LancamentoDTO[]).length).toBe(2);

    // resumo inicial
    const resumo1 = await request(server())
      .get(`/lancamentos/resumo?competencia=${COMPETENCIA}`)
      .expect(200);
    expect(resumo1.body).toEqual({
      competencia: COMPETENCIA,
      totalReceitas: 5000,
      totalDespesas: 1500,
      saldo: 3500,
    });

    // editar a despesa (aumenta o valor)
    await request(server())
      .put(`/lancamentos/${despesaId}`)
      .send({ tipo: 'DESPESA', categoria: 'Aluguel', valor: 2000, competencia: COMPETENCIA })
      .expect(200);

    // resumo reflete a edição
    const resumo2 = await request(server())
      .get(`/lancamentos/resumo?competencia=${COMPETENCIA}`)
      .expect(200);
    expect(resumo2.body).toMatchObject({ totalDespesas: 2000, saldo: 3000 });

    // excluir a receita
    await request(server()).delete(`/lancamentos/${receitaId}`).expect(204);

    const listaFinal = await request(server())
      .get(`/lancamentos?competencia=${COMPETENCIA}`)
      .expect(200);
    expect((listaFinal.body as LancamentoDTO[]).length).toBe(1);
  });

  it('retorna zeros no resumo de um mês sem lançamentos', async () => {
    const resumo = await request(server())
      .get('/lancamentos/resumo?competencia=2030-01')
      .expect(200);
    expect(resumo.body).toEqual({
      competencia: '2030-01',
      totalReceitas: 0,
      totalDespesas: 0,
      saldo: 0,
    });
  });

  it('rejeita criação com valor inválido (400)', async () => {
    await request(server())
      .post('/lancamentos')
      .send({ tipo: 'DESPESA', categoria: 'X', valor: 0, competencia: COMPETENCIA })
      .expect(400);
  });

  it('rejeita competência malformada no resumo (400)', async () => {
    await request(server()).get('/lancamentos/resumo?competencia=2026-13').expect(400);
  });

  it('retorna 404 ao editar um id inexistente', async () => {
    await request(server())
      .put('/lancamentos/nao-existe')
      .send({ tipo: 'DESPESA', categoria: 'X', valor: 10, competencia: COMPETENCIA })
      .expect(404);
  });

  it('retorna 404 ao excluir um id inexistente', async () => {
    await request(server()).delete('/lancamentos/nao-existe').expect(404);
  });
});
