import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LANCAMENTO_REPOSITORY } from './domain/repositories/lancamento.repository';
import { OCORRENCIA_EXCLUIDA_REPOSITORY } from './domain/repositories/ocorrencia-excluida.repository';
import { CriarLancamentoUseCase } from './application/use-cases/criar-lancamento.use-case';
import { ListarLancamentosUseCase } from './application/use-cases/listar-lancamentos.use-case';
import { EditarLancamentoUseCase } from './application/use-cases/editar-lancamento.use-case';
import { ExcluirLancamentoUseCase } from './application/use-cases/excluir-lancamento.use-case';
import { ObterResumoMensalUseCase } from './application/use-cases/obter-resumo-mensal.use-case';
import { RegistrarPagamentoUseCase } from './application/use-cases/registrar-pagamento.use-case';
import { LancamentoSchema } from './infrastructure/persistence/entities/lancamento.schema';
import { OcorrenciaExcluidaSchema } from './infrastructure/persistence/entities/ocorrencia-excluida.schema';
import { TypeOrmLancamentoRepository } from './infrastructure/persistence/repositories/typeorm-lancamento.repository';
import { TypeOrmOcorrenciaExcluidaRepository } from './infrastructure/persistence/repositories/typeorm-ocorrencia-excluida.repository';
import { LancamentosController } from './presentation/controllers/lancamentos.controller';
import { CATEGORIA_REPOSITORY } from '../categorias/domain/repositories/categoria.repository';
import { CategoriaSchema } from '../categorias/infrastructure/persistence/entities/categoria.schema';
import { TypeOrmCategoriaRepository } from '../categorias/infrastructure/persistence/repositories/typeorm-categoria.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([LancamentoSchema, OcorrenciaExcluidaSchema, CategoriaSchema]),
  ],
  controllers: [LancamentosController],
  providers: [
    CriarLancamentoUseCase,
    ListarLancamentosUseCase,
    EditarLancamentoUseCase,
    ExcluirLancamentoUseCase,
    ObterResumoMensalUseCase,
    RegistrarPagamentoUseCase,
    { provide: LANCAMENTO_REPOSITORY, useClass: TypeOrmLancamentoRepository },
    { provide: OCORRENCIA_EXCLUIDA_REPOSITORY, useClass: TypeOrmOcorrenciaExcluidaRepository },
    { provide: CATEGORIA_REPOSITORY, useClass: TypeOrmCategoriaRepository },
  ],
  exports: [LANCAMENTO_REPOSITORY, OCORRENCIA_EXCLUIDA_REPOSITORY],
})
export class LancamentosModule {}
