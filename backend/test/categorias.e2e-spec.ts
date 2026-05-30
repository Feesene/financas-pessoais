import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { CategoriaDTO, ConsumoCategoriaDTO } from '@financas-pessoais/shared';
import { CategoriasController } from '../src/modules/categorias/presentation/controllers/categorias.controller';
import { CriarCategoriaUseCase } from '../src/modules/categorias/application/use-cases/criar-categoria.use-case';
import { ListarCategoriasUseCase } from '../src/modules/categorias/application/use-cases/listar-categorias.use-case';
import { EditarCategoriaUseCase } from '../src/modules/categorias/application/use-cases/editar-categoria.use-case';
import { ExcluirCategoriaUseCase } from '../src/modules/categorias/application/use-cases/excluir-categoria.use-case';
import { DefinirMetaUseCase } from '../src/modules/categorias/application/use-cases/definir-meta.use-case';
import { RemoverMetaUseCase } from '../src/modules/categorias/application/use-cases/remover-meta.use-case';
import { ObterConsumoCategoriasUseCase } from '../src/modules/categorias/application/use-cases/obter-consumo-categorias.use-case';
import { CATEGORIA_REPOSITORY } from '../src/modules/categorias/domain/repositories/categoria.repository';
import { META_REPOSITORY } from '../src/modules/categorias/domain/repositories/meta.repository';
import { LANCAMENTO_REPOSITORY } from '../src/modules/lancamentos/domain/repositories/lancamento.repository';
import { Lancamento } from '../src/modules/lancamentos/domain/entities/lancamento';
import { InMemoryCategoriaRepository } from './in-memory-categoria.repository';
import { InMemoryMetaRepository } from './in-memory-meta.repository';
import { InMemoryLancamentoRepository } from './in-memory-lancamento.repository';

const COMPETENCIA = '2026-08';

describe('Categorias + Metas + Consumo (e2e)', () => {
  let app: INestApplication;
  let lancamentos: InMemoryLancamentoRepository;

  beforeAll(async () => {
    lancamentos = new InMemoryLancamentoRepository();
    const moduleRef = await Test.createTestingModule({
      controllers: [CategoriasController],
      providers: [
        CriarCategoriaUseCase,
        ListarCategoriasUseCase,
        EditarCategoriaUseCase,
        ExcluirCategoriaUseCase,
        DefinirMetaUseCase,
        RemoverMetaUseCase,
        ObterConsumoCategoriasUseCase,
        { provide: CATEGORIA_REPOSITORY, useClass: InMemoryCategoriaRepository },
        { provide: META_REPOSITORY, useClass: InMemoryMetaRepository },
        { provide: LANCAMENTO_REPOSITORY, useValue: lancamentos },
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

  async function criarCategoria(nome: string, tipo: 'DESPESA' | 'RECEITA'): Promise<CategoriaDTO> {
    const res = await request(server()).post('/categorias').send({ nome, tipo }).expect(201);
    return res.body as CategoriaDTO;
  }

  it('cria categoria e bloqueia duplicidade (409)', async () => {
    await criarCategoria('Alimentação', 'DESPESA');
    await request(server())
      .post('/categorias')
      .send({ nome: 'alimentação', tipo: 'DESPESA' })
      .expect(409);
  });

  it('rejeita categoria inválida (400)', async () => {
    await request(server()).post('/categorias').send({ nome: '', tipo: 'DESPESA' }).expect(400);
  });

  it('define meta para despesa e rejeita meta em receita (400)', async () => {
    const despesa = await criarCategoria('Transporte', 'DESPESA');
    await request(server())
      .put(`/categorias/${despesa.id}/metas`)
      .send({ competencia: COMPETENCIA, valor: 300 })
      .expect(200);

    const receita = await criarCategoria('Salário', 'RECEITA');
    await request(server())
      .put(`/categorias/${receita.id}/metas`)
      .send({ competencia: COMPETENCIA, valor: 300 })
      .expect(400);
  });

  it('rejeita meta com valor <= 0 (400)', async () => {
    const despesa = await criarCategoria('Lazer', 'DESPESA');
    await request(server())
      .put(`/categorias/${despesa.id}/metas`)
      .send({ competencia: COMPETENCIA, valor: 0 })
      .expect(400);
  });

  it('calcula consumo com gasto, percentual e estouro', async () => {
    const cat = await criarCategoria('Mercado', 'DESPESA');
    await request(server())
      .put(`/categorias/${cat.id}/metas`)
      .send({ competencia: COMPETENCIA, valor: 200 })
      .expect(200);

    await lancamentos.save(
      Lancamento.criar({
        id: `l-${cat.id}`,
        tipo: 'DESPESA',
        categoria: 'Mercado',
        categoriaId: cat.id,
        descricao: null,
        valor: 250,
        competencia: COMPETENCIA,
      }),
    );

    const res = await request(server())
      .get(`/categorias/consumo?competencia=${COMPETENCIA}`)
      .expect(200);
    const item = (res.body as ConsumoCategoriaDTO[]).find((c) => c.categoria.id === cat.id);
    expect(item).toMatchObject({ meta: 200, gasto: 250, estourou: true });
    expect(item?.percentual).toBeCloseTo(1.25);
  });

  it('remove meta (204) e responde 404 quando já não existe', async () => {
    const cat = await criarCategoria('Saúde', 'DESPESA');
    await request(server())
      .put(`/categorias/${cat.id}/metas`)
      .send({ competencia: COMPETENCIA, valor: 100 })
      .expect(200);
    await request(server())
      .delete(`/categorias/${cat.id}/metas?competencia=${COMPETENCIA}`)
      .expect(204);
    await request(server())
      .delete(`/categorias/${cat.id}/metas?competencia=${COMPETENCIA}`)
      .expect(404);
  });

  it('bloqueia exclusão de categoria com lançamentos (409) e exclui livre (204)', async () => {
    const vinculada = await criarCategoria('Assinaturas', 'DESPESA');
    await lancamentos.save(
      Lancamento.criar({
        id: 'l-vinc',
        tipo: 'DESPESA',
        categoria: 'Assinaturas',
        categoriaId: vinculada.id,
        descricao: null,
        valor: 30,
        competencia: COMPETENCIA,
      }),
    );
    await request(server()).delete(`/categorias/${vinculada.id}`).expect(409);

    const livre = await criarCategoria('Educação', 'DESPESA');
    await request(server()).delete(`/categorias/${livre.id}`).expect(204);
  });

  it('rejeita competência malformada no consumo (400)', async () => {
    await request(server()).get('/categorias/consumo?competencia=2026-13').expect(400);
  });
});
