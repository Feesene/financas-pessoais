import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import type { ConsolidadoDTO, GastoPorCategoriaItemDTO } from '@financas-pessoais/shared';
import { RelatoriosController } from '../src/modules/relatorios/presentation/controllers/relatorios.controller';
import { ObterConsolidadoUseCase } from '../src/modules/relatorios/application/use-cases/obter-consolidado.use-case';
import { ObterGastoPorCategoriaUseCase } from '../src/modules/relatorios/application/use-cases/obter-gasto-por-categoria.use-case';
import { ObterEvolucaoUseCase } from '../src/modules/relatorios/application/use-cases/obter-evolucao.use-case';
import { CompararMesesUseCase } from '../src/modules/relatorios/application/use-cases/comparar-meses.use-case';
import { ExportacaoService } from '../src/modules/relatorios/application/exportacao.service';
import { LANCAMENTO_QUERY_PORT } from '../src/modules/relatorios/domain/ports/lancamento-query.port';
import { CATEGORIA_QUERY_PORT } from '../src/modules/relatorios/domain/ports/categoria-query.port';
import { RESERVA_QUERY_PORT } from '../src/modules/relatorios/domain/ports/reserva-query.port';
import { LancamentoQueryAdapter } from '../src/modules/relatorios/infrastructure/adapters/lancamento-query.adapter';
import { CategoriaQueryAdapter } from '../src/modules/relatorios/infrastructure/adapters/categoria-query.adapter';
import { ReservaQueryAdapter } from '../src/modules/relatorios/infrastructure/adapters/reserva-query.adapter';
import { LANCAMENTO_REPOSITORY } from '../src/modules/lancamentos/domain/repositories/lancamento.repository';
import { CATEGORIA_REPOSITORY } from '../src/modules/categorias/domain/repositories/categoria.repository';
import { BALDE_REPOSITORY } from '../src/modules/reservas/domain/repositories/balde.repository';
import { MOVIMENTO_RESERVA_REPOSITORY } from '../src/modules/reservas/domain/repositories/movimento-reserva.repository';
import { Lancamento } from '../src/modules/lancamentos/domain/entities/lancamento';
import { Categoria } from '../src/modules/categorias/domain/entities/categoria';
import { Balde } from '../src/modules/reservas/domain/entities/balde';
import { MovimentoReserva } from '../src/modules/reservas/domain/entities/movimento-reserva';
import { InMemoryLancamentoRepository } from './in-memory-lancamento.repository';
import { InMemoryCategoriaRepository } from './in-memory-categoria.repository';
import { InMemoryBaldeRepository } from './in-memory-balde.repository';
import { InMemoryMovimentoReservaRepository } from './in-memory-movimento-reserva.repository';

describe('Relatorios (e2e)', () => {
  let app: INestApplication;
  let lancamentos: InMemoryLancamentoRepository;
  let categorias: InMemoryCategoriaRepository;
  let baldes: InMemoryBaldeRepository;
  let movimentos: InMemoryMovimentoReservaRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [RelatoriosController],
      providers: [
        ObterConsolidadoUseCase,
        ObterGastoPorCategoriaUseCase,
        ObterEvolucaoUseCase,
        CompararMesesUseCase,
        ExportacaoService,
        { provide: LANCAMENTO_QUERY_PORT, useClass: LancamentoQueryAdapter },
        { provide: CATEGORIA_QUERY_PORT, useClass: CategoriaQueryAdapter },
        { provide: RESERVA_QUERY_PORT, useClass: ReservaQueryAdapter },
        { provide: LANCAMENTO_REPOSITORY, useClass: InMemoryLancamentoRepository },
        { provide: CATEGORIA_REPOSITORY, useClass: InMemoryCategoriaRepository },
        { provide: BALDE_REPOSITORY, useClass: InMemoryBaldeRepository },
        { provide: MOVIMENTO_RESERVA_REPOSITORY, useClass: InMemoryMovimentoReservaRepository },
      ],
    }).compile();

    lancamentos = moduleRef.get(LANCAMENTO_REPOSITORY);
    categorias = moduleRef.get(CATEGORIA_REPOSITORY);
    baldes = moduleRef.get(BALDE_REPOSITORY);
    movimentos = moduleRef.get(MOVIMENTO_RESERVA_REPOSITORY);

    await seed();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const server = () => app.getHttpServer();

  async function seed(): Promise<void> {
    const mercado = Categoria.criar({ id: 'cat-mercado', nome: 'Mercado', tipo: 'DESPESA', cor: null });
    const lazer = Categoria.criar({ id: 'cat-lazer', nome: 'Lazer', tipo: 'DESPESA', cor: null });
    await categorias.save(mercado);
    await categorias.save(lazer);

    // Janeiro/2026: P1 receita + despesas categorizadas.
    await lancamentos.save(
      Lancamento.criar({
        id: 'l1', tipo: 'RECEITA', categoria: 'Salário', categoriaId: null,
        descricao: null, valor: 5000, competencia: '2026-01',
      }),
    );
    await lancamentos.save(
      Lancamento.criar({
        id: 'l2', tipo: 'DESPESA', categoria: 'Mercado', categoriaId: 'cat-mercado',
        descricao: null, valor: 800, competencia: '2026-01',
      }),
    );
    await lancamentos.save(
      Lancamento.criar({
        id: 'l3', tipo: 'DESPESA', categoria: 'Lazer', categoriaId: 'cat-lazer',
        descricao: null, valor: 200, competencia: '2026-01',
      }),
    );

    // P4: aportes em baldes classificados por nome (poupança/viagem).
    const baldePoupanca = Balde.criar({ id: 'b1', nome: 'Poupança', saldoInicial: 0, cor: null });
    const baldeViagem = Balde.criar({ id: 'b2', nome: 'Viagem', saldoInicial: 0, cor: null });
    await baldes.save(baldePoupanca);
    await baldes.save(baldeViagem);
    await movimentos.save(
      MovimentoReserva.criar({
        id: 'm1', baldeId: 'b1', tipo: 'APORTE', valor: 500,
        competencia: '2026-01', descricao: null,
      }),
    );
    await movimentos.save(
      MovimentoReserva.criar({
        id: 'm2', baldeId: 'b2', tipo: 'APORTE', valor: 300,
        competencia: '2026-01', descricao: null,
      }),
    );
  }

  it('consolida cruzando P1+P2+P4: sobras = líquido − gastos − poupança − viagem', async () => {
    const res = await request(server()).get('/relatorios/consolidado?ano=2026').expect(200);
    const consolidado = res.body as ConsolidadoDTO;

    expect(consolidado.meses).toHaveLength(12);
    const janeiro = consolidado.meses[0];
    expect(janeiro).toEqual({
      competencia: '2026-01',
      liquidoRecebido: 5000,
      gastos: 1000,
      poupanca: 500,
      viagem: 300,
      sobras: 3200,
    });
    expect(consolidado.totais).toEqual({
      liquidoRecebido: 5000,
      gastos: 1000,
      poupanca: 500,
      viagem: 300,
      sobras: 3200,
    });
  });

  it('agrega gasto por categoria com nomes vindos de P2', async () => {
    const res = await request(server())
      .get('/relatorios/por-categoria?de=2026-01&ate=2026-01')
      .expect(200);
    const itens = res.body as GastoPorCategoriaItemDTO[];

    expect(itens.map((i) => i.categoria.nome)).toEqual(['Mercado', 'Lazer']);
    expect(itens[0].total).toBe(800);
    expect(itens[0].percentual).toBeCloseTo(0.8, 5);
  });

  it('exporta o consolidado em PDF', async () => {
    const res = await request(server())
      .get('/relatorios/exportar?formato=pdf&de=2026-01&ate=2026-12')
      .responseType('blob')
      .expect(200);

    expect(res.headers['content-type']).toContain('application/pdf');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect((res.body as Buffer).length).toBeGreaterThan(0);
  });

  it('exporta o consolidado em XLSX', async () => {
    const res = await request(server())
      .get('/relatorios/exportar?formato=xlsx&de=2026-01&ate=2026-12')
      .responseType('blob')
      .expect(200);

    expect(res.headers['content-type']).toContain('spreadsheetml');
    expect((res.body as Buffer).length).toBeGreaterThan(0);
  });

  it('rejeita intervalo inválido (de > ate) com 400', async () => {
    await request(server())
      .get('/relatorios/consolidado?de=2026-05&ate=2026-01')
      .expect(400);
  });

  it('rejeita formato de exportação inválido com 400', async () => {
    await request(server())
      .get('/relatorios/exportar?formato=csv&de=2026-01&ate=2026-12')
      .expect(400);
  });
});
