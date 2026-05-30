import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type {
  LancamentoDTO,
  MaterializarResultadoDTO,
  RegraRecorrenteDTO,
} from '@financas-pessoais/shared';
import { RecorrenciasController } from '../src/modules/recorrencias/presentation/controllers/recorrencias.controller';
import { CriarRegraUseCase } from '../src/modules/recorrencias/application/use-cases/criar-regra.use-case';
import { ListarRegrasUseCase } from '../src/modules/recorrencias/application/use-cases/listar-regras.use-case';
import { EditarRegraUseCase } from '../src/modules/recorrencias/application/use-cases/editar-regra.use-case';
import { EncerrarRegraUseCase } from '../src/modules/recorrencias/application/use-cases/encerrar-regra.use-case';
import { MaterializarCompetenciaUseCase } from '../src/modules/recorrencias/application/use-cases/materializar-competencia.use-case';
import { REGRA_RECORRENTE_REPOSITORY } from '../src/modules/recorrencias/domain/repositories/regra-recorrente.repository';
import { LancamentosController } from '../src/modules/lancamentos/presentation/controllers/lancamentos.controller';
import { CriarLancamentoUseCase } from '../src/modules/lancamentos/application/use-cases/criar-lancamento.use-case';
import { ListarLancamentosUseCase } from '../src/modules/lancamentos/application/use-cases/listar-lancamentos.use-case';
import { EditarLancamentoUseCase } from '../src/modules/lancamentos/application/use-cases/editar-lancamento.use-case';
import { ExcluirLancamentoUseCase } from '../src/modules/lancamentos/application/use-cases/excluir-lancamento.use-case';
import { ObterResumoMensalUseCase } from '../src/modules/lancamentos/application/use-cases/obter-resumo-mensal.use-case';
import { RegistrarPagamentoUseCase } from '../src/modules/lancamentos/application/use-cases/registrar-pagamento.use-case';
import { LANCAMENTO_REPOSITORY } from '../src/modules/lancamentos/domain/repositories/lancamento.repository';
import { OCORRENCIA_EXCLUIDA_REPOSITORY } from '../src/modules/lancamentos/domain/repositories/ocorrencia-excluida.repository';
import { CATEGORIA_REPOSITORY } from '../src/modules/categorias/domain/repositories/categoria.repository';
import { Categoria } from '../src/modules/categorias/domain/entities/categoria';
import { InMemoryRegraRecorrenteRepository } from './in-memory-regra-recorrente.repository';
import { InMemoryLancamentoRepository } from './in-memory-lancamento.repository';
import { InMemoryOcorrenciaExcluidaRepository } from './in-memory-ocorrencia-excluida.repository';
import { InMemoryCategoriaRepository } from './in-memory-categoria.repository';

const CATEGORIA_ID = 'cat-1';

describe('Recorrências (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const categorias = new InMemoryCategoriaRepository();
    await categorias.save(
      Categoria.criar({ id: CATEGORIA_ID, nome: 'Aluguel', tipo: 'DESPESA', cor: null }),
    );

    const moduleRef = await Test.createTestingModule({
      controllers: [RecorrenciasController, LancamentosController],
      providers: [
        CriarRegraUseCase,
        ListarRegrasUseCase,
        EditarRegraUseCase,
        EncerrarRegraUseCase,
        MaterializarCompetenciaUseCase,
        CriarLancamentoUseCase,
        ListarLancamentosUseCase,
        EditarLancamentoUseCase,
        ExcluirLancamentoUseCase,
        ObterResumoMensalUseCase,
        RegistrarPagamentoUseCase,
        { provide: REGRA_RECORRENTE_REPOSITORY, useClass: InMemoryRegraRecorrenteRepository },
        { provide: LANCAMENTO_REPOSITORY, useClass: InMemoryLancamentoRepository },
        {
          provide: OCORRENCIA_EXCLUIDA_REPOSITORY,
          useClass: InMemoryOcorrenciaExcluidaRepository,
        },
        { provide: CATEGORIA_REPOSITORY, useValue: categorias },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function criarRecorrencia(
    body: Partial<Record<string, unknown>> = {},
  ): Promise<RegraRecorrenteDTO> {
    const res = await request(server())
      .post('/recorrencias')
      .send({
        tipo: 'DESPESA',
        categoriaId: CATEGORIA_ID,
        descricao: 'Aluguel',
        valorBase: 1500,
        competenciaInicio: '2026-01',
        ...body,
      })
      .expect(201);
    return res.body as RegraRecorrenteDTO;
  }

  async function listar(competencia: string): Promise<LancamentoDTO[]> {
    const res = await request(server())
      .get(`/lancamentos?competencia=${competencia}`)
      .expect(200);
    return res.body as LancamentoDTO[];
  }

  it('materializa de forma idempotente: 2x no mesmo mês cria 0 na segunda', async () => {
    await criarRecorrencia();

    const r1 = await request(server())
      .post('/recorrencias/materializar')
      .send({ competencia: '2026-03' })
      .expect(200);
    expect((r1.body as MaterializarResultadoDTO).criados).toBe(1);

    const r2 = await request(server())
      .post('/recorrencias/materializar')
      .send({ competencia: '2026-03' })
      .expect(200);
    expect((r2.body as MaterializarResultadoDTO).criados).toBe(0);

    const lancamentos = await listar('2026-03');
    expect(lancamentos.length).toBe(1);
    expect(lancamentos[0].origemRegraId).not.toBeNull();
    expect(lancamentos[0].ocorrenciaIndice).toBe(3);
  });

  it('parcelamento gera N ocorrências com label k/N e soma igual ao total', async () => {
    await criarRecorrencia({
      descricao: 'Notebook',
      valorTotal: 100,
      valorBase: undefined,
      numeroParcelas: 3,
      competenciaInicio: '2026-01',
    });

    const meses = ['2026-01', '2026-02', '2026-03'];
    let soma = 0;
    for (const mes of meses) {
      await request(server()).post('/recorrencias/materializar').send({ competencia: mes }).expect(200);
      const [lanc] = await listar(mes);
      soma += lanc.valor;
    }
    expect(Number(soma.toFixed(2))).toBe(100);

    const [m1] = await listar('2026-01');
    expect(m1.descricao).toBe('Notebook (1/3)');
    const [m3] = await listar('2026-03');
    expect(m3.descricao).toBe('Notebook (3/3)');
    expect(m3.valor).toBe(33.34);

    // além de N não materializa
    const alem = await request(server())
      .post('/recorrencias/materializar')
      .send({ competencia: '2026-04' })
      .expect(200);
    expect((alem.body as MaterializarResultadoDTO).criados).toBe(0);
  });

  it('excluir ocorrência não reaparece ao rematerializar o mês', async () => {
    await criarRecorrencia();
    await request(server()).post('/recorrencias/materializar').send({ competencia: '2026-02' }).expect(200);

    const [ocorrencia] = await listar('2026-02');
    await request(server()).delete(`/lancamentos/${ocorrencia.id}`).expect(204);

    const re = await request(server())
      .post('/recorrencias/materializar')
      .send({ competencia: '2026-02' })
      .expect(200);
    expect((re.body as MaterializarResultadoDTO).criados).toBe(0);
    expect((await listar('2026-02')).length).toBe(0);
  });

  it('edição prospectiva: passado inalterado, futuro com novo valor', async () => {
    const regra = await criarRecorrencia({ valorBase: 1500, competenciaInicio: '2026-01' });

    // materializa fevereiro com o valor antigo
    await request(server()).post('/recorrencias/materializar').send({ competencia: '2026-02' }).expect(200);
    expect((await listar('2026-02'))[0].valor).toBe(1500);

    // edita a partir de março para 1800
    await request(server())
      .put(`/recorrencias/${regra.id}`)
      .send({
        tipo: 'DESPESA',
        categoriaId: CATEGORIA_ID,
        descricao: 'Aluguel',
        valorBase: 1800,
        competenciaInicio: '2026-03',
        aPartirDe: '2026-03',
      })
      .expect(200);

    // fevereiro permanece com 1500
    expect((await listar('2026-02'))[0].valor).toBe(1500);

    // março materializa com 1800
    await request(server()).post('/recorrencias/materializar').send({ competencia: '2026-03' }).expect(200);
    expect((await listar('2026-03'))[0].valor).toBe(1800);
  });

  it('encerrar regra para a materialização futura sem apagar o passado', async () => {
    const regra = await criarRecorrencia({ competenciaInicio: '2026-01' });
    await request(server()).post('/recorrencias/materializar').send({ competencia: '2026-01' }).expect(200);
    expect((await listar('2026-01')).length).toBe(1);

    await request(server()).post(`/recorrencias/${regra.id}/encerrar`).expect(200);

    const futuro = await request(server())
      .post('/recorrencias/materializar')
      .send({ competencia: '2026-02' })
      .expect(200);
    expect((futuro.body as MaterializarResultadoDTO).criados).toBe(0);

    // o passado permanece
    expect((await listar('2026-01')).length).toBe(1);
  });

  it('retorna 404 ao encerrar regra inexistente', async () => {
    await request(server()).post('/recorrencias/nao-existe/encerrar').expect(404);
  });
});
