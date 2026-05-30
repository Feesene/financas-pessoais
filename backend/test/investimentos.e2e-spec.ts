import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type {
  AtivoDTO,
  HistoricoCarteiraItemDTO,
  MovimentoCarteiraDTO,
  PosicaoCarteiraDTO,
} from '@financas-pessoais/shared';
import { AtivosController } from '../src/modules/investimentos/presentation/controllers/ativos.controller';
import { MovimentosCarteiraController } from '../src/modules/investimentos/presentation/controllers/movimentos-carteira.controller';
import { CarteiraController } from '../src/modules/investimentos/presentation/controllers/carteira.controller';
import { CriarAtivoUseCase } from '../src/modules/investimentos/application/use-cases/criar-ativo.use-case';
import { ListarAtivosUseCase } from '../src/modules/investimentos/application/use-cases/listar-ativos.use-case';
import { EditarAtivoUseCase } from '../src/modules/investimentos/application/use-cases/editar-ativo.use-case';
import { ExcluirAtivoUseCase } from '../src/modules/investimentos/application/use-cases/excluir-ativo.use-case';
import { RegistrarMovimentoCarteiraUseCase } from '../src/modules/investimentos/application/use-cases/registrar-movimento-carteira.use-case';
import { EditarMovimentoCarteiraUseCase } from '../src/modules/investimentos/application/use-cases/editar-movimento-carteira.use-case';
import { ExcluirMovimentoCarteiraUseCase } from '../src/modules/investimentos/application/use-cases/excluir-movimento-carteira.use-case';
import { ObterPosicaoCarteiraUseCase } from '../src/modules/investimentos/application/use-cases/obter-posicao-carteira.use-case';
import { ObterHistoricoCarteiraUseCase } from '../src/modules/investimentos/application/use-cases/obter-historico-carteira.use-case';
import { ATIVO_REPOSITORY } from '../src/modules/investimentos/domain/repositories/ativo.repository';
import { MOVIMENTO_CARTEIRA_REPOSITORY } from '../src/modules/investimentos/domain/repositories/movimento-carteira.repository';
import { InMemoryAtivoRepository } from './in-memory-ativo.repository';
import { InMemoryMovimentoCarteiraRepository } from './in-memory-movimento-carteira.repository';

describe('Investimentos (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AtivosController, MovimentosCarteiraController, CarteiraController],
      providers: [
        CriarAtivoUseCase,
        ListarAtivosUseCase,
        EditarAtivoUseCase,
        ExcluirAtivoUseCase,
        RegistrarMovimentoCarteiraUseCase,
        EditarMovimentoCarteiraUseCase,
        ExcluirMovimentoCarteiraUseCase,
        ObterPosicaoCarteiraUseCase,
        ObterHistoricoCarteiraUseCase,
        { provide: ATIVO_REPOSITORY, useClass: InMemoryAtivoRepository },
        { provide: MOVIMENTO_CARTEIRA_REPOSITORY, useClass: InMemoryMovimentoCarteiraRepository },
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

  async function criarAcao(descricao: string, quantidade: number, valorUnitario: number) {
    const res = await request(server())
      .post('/ativos')
      .send({ tipo: 'ACAO', descricao, quantidade, valorUnitario })
      .expect(201);
    return res.body as AtivoDTO;
  }

  it('cria ACAO e deriva valorBruto = quantidade × valorUnitario', async () => {
    const ativo = await criarAcao('PETR4', 10, 30);
    expect(ativo.valorBruto).toBe(300);
  });

  it('cria FUNDO com valorBruto informado', async () => {
    const res = await request(server())
      .post('/ativos')
      .send({ tipo: 'FUNDO', descricao: 'Tesouro Selic', valorBruto: 5000 })
      .expect(201);
    expect((res.body as AtivoDTO).valorBruto).toBe(5000);
  });

  it('rejeita ACAO sem quantidade (400)', async () => {
    await request(server())
      .post('/ativos')
      .send({ tipo: 'ACAO', descricao: 'X', valorUnitario: 10 })
      .expect(400);
  });

  it('rejeita FUNDO enviando quantidade (400)', async () => {
    await request(server())
      .post('/ativos')
      .send({ tipo: 'FUNDO', descricao: 'Y', quantidade: 1, valorBruto: 10 })
      .expect(400);
  });

  it('rejeita quantidade = 0 em ACAO (400)', async () => {
    await request(server())
      .post('/ativos')
      .send({ tipo: 'ACAO', descricao: 'Z', quantidade: 0, valorUnitario: 10 })
      .expect(400);
  });

  it('edita o valorUnitario e recalcula o valorBruto', async () => {
    const ativo = await criarAcao('VALE3', 10, 20);
    const res = await request(server())
      .put(`/ativos/${ativo.id}`)
      .send({ descricao: 'VALE3', quantidade: 10, valorUnitario: 35 })
      .expect(200);
    expect((res.body as AtivoDTO).valorBruto).toBe(350);
  });

  it('registra movimento em ativo inexistente (404)', async () => {
    await request(server())
      .post('/ativos/nao-existe/movimentos')
      .send({ tipo: 'ENTRADA', valor: 100, competencia: '2026-01' })
      .expect(404);
  });

  it('calcula a posição: subtotais por tipo, total e rendimento total', async () => {
    // Isola num app próprio para não somar ativos dos outros testes.
    const local = await criarApp();
    await local
      .post('/ativos')
      .send({ tipo: 'ACAO', descricao: 'AAA', quantidade: 10, valorUnitario: 20, rendimento: 15 })
      .expect(201);
    await local
      .post('/ativos')
      .send({ tipo: 'FUNDO', descricao: 'BBB', valorBruto: 500, rendimento: 5 })
      .expect(201);

    const res = await local.get('/carteira/posicao').expect(200);
    const posicao = res.body as PosicaoCarteiraDTO;
    expect(posicao.total).toBe(700);
    expect(posicao.rendimentoTotal).toBe(20);
    expect(posicao.subtotais.find((s) => s.tipo === 'ACAO')).toMatchObject({ total: 200 });
  });

  it('expõe o histórico agregado por competência com fluxo líquido', async () => {
    const local = await criarApp();
    const ativoRes = await local
      .post('/ativos')
      .send({ tipo: 'FUNDO', descricao: 'Hist', valorBruto: 0 })
      .expect(201);
    const ativoId = (ativoRes.body as AtivoDTO).id;

    await local
      .post(`/ativos/${ativoId}/movimentos`)
      .send({ tipo: 'ENTRADA', valor: 200, competencia: '2026-01' })
      .expect(201);
    await local
      .post(`/ativos/${ativoId}/movimentos`)
      .send({ tipo: 'SAIDA', valor: 50, competencia: '2026-01' })
      .expect(201);
    await local
      .post(`/ativos/${ativoId}/movimentos`)
      .send({ tipo: 'RENDIMENTO', valor: 10, competencia: '2026-01' })
      .expect(201);

    const res = await local.get('/carteira/historico').expect(200);
    const historico = res.body as HistoricoCarteiraItemDTO[];
    expect(historico).toEqual([
      { competencia: '2026-01', entradas: 200, saidas: 50, rendimentos: 10, fluxoLiquido: 160 },
    ]);
  });

  it('edita e exclui movimento; 404 ao repetir a exclusão', async () => {
    const ativo = await criarAcao('Edição', 1, 100);
    const movRes = await request(server())
      .post(`/ativos/${ativo.id}/movimentos`)
      .send({ tipo: 'ENTRADA', valor: 100, competencia: '2026-02' })
      .expect(201);
    const mov = movRes.body as MovimentoCarteiraDTO;

    await request(server())
      .put(`/movimentos-carteira/${mov.id}`)
      .send({ tipo: 'ENTRADA', valor: 250, competencia: '2026-02' })
      .expect(200);

    await request(server()).delete(`/movimentos-carteira/${mov.id}`).expect(204);
    await request(server()).delete(`/movimentos-carteira/${mov.id}`).expect(404);
  });

  it('bloqueia exclusão de ativo com movimentos (409) e exclui ativo livre (204)', async () => {
    const vinculado = await criarAcao('Com histórico', 1, 50);
    await request(server())
      .post(`/ativos/${vinculado.id}/movimentos`)
      .send({ tipo: 'ENTRADA', valor: 10, competencia: '2026-01' })
      .expect(201);
    await request(server()).delete(`/ativos/${vinculado.id}`).expect(409);

    const livre = await criarAcao('Sem histórico', 1, 50);
    await request(server()).delete(`/ativos/${livre.id}`).expect(204);
  });

  it('rejeita competência malformada no histórico (400)', async () => {
    await request(server()).get('/carteira/historico?de=2026-13').expect(400);
  });

  /** Cria uma instância isolada da app para testes que dependem de carteira limpa. */
  async function criarApp() {
    const moduleRef = await Test.createTestingModule({
      controllers: [AtivosController, MovimentosCarteiraController, CarteiraController],
      providers: [
        CriarAtivoUseCase,
        ListarAtivosUseCase,
        EditarAtivoUseCase,
        ExcluirAtivoUseCase,
        RegistrarMovimentoCarteiraUseCase,
        EditarMovimentoCarteiraUseCase,
        ExcluirMovimentoCarteiraUseCase,
        ObterPosicaoCarteiraUseCase,
        ObterHistoricoCarteiraUseCase,
        { provide: ATIVO_REPOSITORY, useClass: InMemoryAtivoRepository },
        { provide: MOVIMENTO_CARTEIRA_REPOSITORY, useClass: InMemoryMovimentoCarteiraRepository },
      ],
    }).compile();
    const isolada = moduleRef.createNestApplication();
    isolada.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await isolada.init();
    return request(isolada.getHttpServer());
  }
});
