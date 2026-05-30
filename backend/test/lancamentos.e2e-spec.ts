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
import { RegistrarPagamentoUseCase } from '../src/modules/lancamentos/application/use-cases/registrar-pagamento.use-case';
import { Lancamento } from '../src/modules/lancamentos/domain/entities/lancamento';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../src/modules/lancamentos/domain/repositories/lancamento.repository';
import { OCORRENCIA_EXCLUIDA_REPOSITORY } from '../src/modules/lancamentos/domain/repositories/ocorrencia-excluida.repository';
import { CATEGORIA_REPOSITORY } from '../src/modules/categorias/domain/repositories/categoria.repository';
import { InMemoryLancamentoRepository } from './in-memory-lancamento.repository';
import { InMemoryOcorrenciaExcluidaRepository } from './in-memory-ocorrencia-excluida.repository';
import { InMemoryCategoriaRepository } from './in-memory-categoria.repository';

const COMPETENCIA = '2026-08';

describe('Lançamentos (e2e)', () => {
  let app: INestApplication;
  let repo: LancamentoRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [LancamentosController],
      providers: [
        CriarLancamentoUseCase,
        ListarLancamentosUseCase,
        EditarLancamentoUseCase,
        ExcluirLancamentoUseCase,
        ObterResumoMensalUseCase,
        RegistrarPagamentoUseCase,
        { provide: LANCAMENTO_REPOSITORY, useClass: InMemoryLancamentoRepository },
        {
          provide: OCORRENCIA_EXCLUIDA_REPOSITORY,
          useClass: InMemoryOcorrenciaExcluidaRepository,
        },
        { provide: CATEGORIA_REPOSITORY, useClass: InMemoryCategoriaRepository },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    repo = moduleRef.get<LancamentoRepository>(LANCAMENTO_REPOSITORY);
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

  describe('PATCH /lancamentos/:id/pagamento', () => {
    const PAG_COMPETENCIA = '2026-09';

    async function seedOcorrencia(id: string): Promise<void> {
      await repo.save(
        Lancamento.criar({
          id,
          tipo: 'DESPESA',
          categoria: 'Luz',
          categoriaId: null,
          descricao: 'Conta de luz',
          valor: 200,
          competencia: PAG_COMPETENCIA,
          origemRegraId: 'regra-1',
          ocorrenciaIndice: 1,
        }),
      );
    }

    it('marca uma ocorrência como paga com o valor real e o resumo reflete', async () => {
      await seedOcorrencia('oco-pag-1');

      const resp = await request(server())
        .patch('/lancamentos/oco-pag-1/pagamento')
        .send({ pago: true, valorPago: 237 })
        .expect(200);
      expect(resp.body).toMatchObject({ pago: true, valorPago: 237 });

      const resumo = await request(server())
        .get(`/lancamentos/resumo?competencia=${PAG_COMPETENCIA}`)
        .expect(200);
      expect(resumo.body).toMatchObject({ totalDespesas: 237 });
    });

    it('desmarcar volta o resumo ao previsto', async () => {
      await seedOcorrencia('oco-pag-2');
      await request(server())
        .patch('/lancamentos/oco-pag-2/pagamento')
        .send({ pago: true, valorPago: 500 })
        .expect(200);
      await request(server())
        .patch('/lancamentos/oco-pag-2/pagamento')
        .send({ pago: false })
        .expect(200);

      const lancamento = await repo.findById('oco-pag-2');
      expect(lancamento?.pago).toBe(false);
      expect(lancamento?.valorPago).toBeNull();
      expect(lancamento?.valorEfetivo).toBe(200);
    });

    it('rejeita (400) marcar lançamento manual como pago', async () => {
      const manual = await request(server())
        .post('/lancamentos')
        .send({ tipo: 'DESPESA', categoria: 'Avulso', valor: 50, competencia: PAG_COMPETENCIA })
        .expect(201);
      const manualId = (manual.body as LancamentoDTO).id;

      await request(server())
        .patch(`/lancamentos/${manualId}/pagamento`)
        .send({ pago: true })
        .expect(400);
    });

    it('retorna 404 ao pagar um id inexistente', async () => {
      await request(server())
        .patch('/lancamentos/nao-existe/pagamento')
        .send({ pago: true })
        .expect(404);
    });

    it('rejeita (400) valorPago menor ou igual a zero', async () => {
      await seedOcorrencia('oco-pag-3');
      await request(server())
        .patch('/lancamentos/oco-pag-3/pagamento')
        .send({ pago: true, valorPago: 0 })
        .expect(400);
    });
  });
});
