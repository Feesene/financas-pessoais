import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LANCAMENTO_REPOSITORY } from './domain/repositories/lancamento.repository';
import { CriarLancamentoUseCase } from './application/use-cases/criar-lancamento.use-case';
import { ListarLancamentosUseCase } from './application/use-cases/listar-lancamentos.use-case';
import { EditarLancamentoUseCase } from './application/use-cases/editar-lancamento.use-case';
import { ExcluirLancamentoUseCase } from './application/use-cases/excluir-lancamento.use-case';
import { ObterResumoMensalUseCase } from './application/use-cases/obter-resumo-mensal.use-case';
import { LancamentoSchema } from './infrastructure/persistence/entities/lancamento.schema';
import { TypeOrmLancamentoRepository } from './infrastructure/persistence/repositories/typeorm-lancamento.repository';
import { LancamentosController } from './presentation/controllers/lancamentos.controller';

@Module({
  imports: [TypeOrmModule.forFeature([LancamentoSchema])],
  controllers: [LancamentosController],
  providers: [
    CriarLancamentoUseCase,
    ListarLancamentosUseCase,
    EditarLancamentoUseCase,
    ExcluirLancamentoUseCase,
    ObterResumoMensalUseCase,
    { provide: LANCAMENTO_REPOSITORY, useClass: TypeOrmLancamentoRepository },
  ],
})
export class LancamentosModule {}
