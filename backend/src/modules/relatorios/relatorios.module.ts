import { Module } from '@nestjs/common';
import { LancamentosModule } from '../lancamentos/lancamentos.module';
import { CategoriasModule } from '../categorias/categorias.module';
import { ReservasModule } from '../reservas/reservas.module';
import { LANCAMENTO_QUERY_PORT } from './domain/ports/lancamento-query.port';
import { CATEGORIA_QUERY_PORT } from './domain/ports/categoria-query.port';
import { RESERVA_QUERY_PORT } from './domain/ports/reserva-query.port';
import { LancamentoQueryAdapter } from './infrastructure/adapters/lancamento-query.adapter';
import { CategoriaQueryAdapter } from './infrastructure/adapters/categoria-query.adapter';
import { ReservaQueryAdapter } from './infrastructure/adapters/reserva-query.adapter';
import { ObterConsolidadoUseCase } from './application/use-cases/obter-consolidado.use-case';
import { ObterGastoPorCategoriaUseCase } from './application/use-cases/obter-gasto-por-categoria.use-case';
import { ObterEvolucaoUseCase } from './application/use-cases/obter-evolucao.use-case';
import { ObterPrevistoPagoUseCase } from './application/use-cases/obter-previsto-pago.use-case';
import { CompararMesesUseCase } from './application/use-cases/comparar-meses.use-case';
import { ExportacaoService } from './application/exportacao.service';
import { RelatoriosController } from './presentation/controllers/relatorios.controller';

@Module({
  imports: [LancamentosModule, CategoriasModule, ReservasModule],
  controllers: [RelatoriosController],
  providers: [
    ObterConsolidadoUseCase,
    ObterGastoPorCategoriaUseCase,
    ObterEvolucaoUseCase,
    ObterPrevistoPagoUseCase,
    CompararMesesUseCase,
    ExportacaoService,
    { provide: LANCAMENTO_QUERY_PORT, useClass: LancamentoQueryAdapter },
    { provide: CATEGORIA_QUERY_PORT, useClass: CategoriaQueryAdapter },
    { provide: RESERVA_QUERY_PORT, useClass: ReservaQueryAdapter },
  ],
})
export class RelatoriosModule {}
