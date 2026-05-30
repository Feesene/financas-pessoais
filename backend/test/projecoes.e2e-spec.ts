import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { ProjecaoResultadoDTO } from '@financas-pessoais/shared';
import { ProjecoesController } from '../src/modules/projecoes/presentation/controllers/projecoes.controller';
import { CalcularProjecaoUseCase } from '../src/modules/projecoes/application/use-cases/calcular-projecao.use-case';

describe('Projecoes (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [ProjecoesController],
      providers: [CalcularProjecaoUseCase],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  it('calcula a projeção ano a ano com totais e juros ganhos', async () => {
    const res = await request(server())
      .post('/projecoes/calcular')
      .send({ entrada: 1000, aporteMensal: 0, taxaAnual: 0.1, anos: 1 })
      .expect(200);
    const resultado = res.body as ProjecaoResultadoDTO;

    expect(resultado.anos).toHaveLength(1);
    expect(resultado.anos[0].totalAportado).toBe(1000);
    expect(resultado.anos[0].saldoNaoInvestido).toBe(1000);
    expect(resultado.anos[0].saldoInvestido).toBeCloseTo(1100, 4);
    expect(resultado.totalFinalNaoInvestido).toBe(1000);
    expect(resultado.totalFinalInvestido).toBeCloseTo(1100, 4);
    expect(resultado.jurosGanhos).toBeCloseTo(100, 4);
  });

  it('com taxa 0 retorna investido = não investido', async () => {
    const res = await request(server())
      .post('/projecoes/calcular')
      .send({ entrada: 500, aporteMensal: 100, taxaAnual: 0, anos: 2 })
      .expect(200);
    const resultado = res.body as ProjecaoResultadoDTO;

    expect(resultado.totalFinalInvestido).toBeCloseTo(resultado.totalFinalNaoInvestido, 6);
    expect(resultado.jurosGanhos).toBeCloseTo(0, 6);
  });

  it('rejeita valor negativo com 400', async () => {
    await request(server())
      .post('/projecoes/calcular')
      .send({ entrada: -1, aporteMensal: 0, taxaAnual: 0.1, anos: 1 })
      .expect(400);
  });

  it('rejeita anos fora de 1..60 com 400', async () => {
    await request(server())
      .post('/projecoes/calcular')
      .send({ entrada: 0, aporteMensal: 0, taxaAnual: 0.1, anos: 61 })
      .expect(400);
  });

  it('rejeita anos não inteiro com 400', async () => {
    await request(server())
      .post('/projecoes/calcular')
      .send({ entrada: 0, aporteMensal: 0, taxaAnual: 0.1, anos: 2.5 })
      .expect(400);
  });
});
