import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CATEGORIA_REPOSITORY } from './domain/repositories/categoria.repository';
import { META_REPOSITORY } from './domain/repositories/meta.repository';
import { LANCAMENTO_REPOSITORY } from '../lancamentos/domain/repositories/lancamento.repository';
import { CriarCategoriaUseCase } from './application/use-cases/criar-categoria.use-case';
import { ListarCategoriasUseCase } from './application/use-cases/listar-categorias.use-case';
import { EditarCategoriaUseCase } from './application/use-cases/editar-categoria.use-case';
import { ExcluirCategoriaUseCase } from './application/use-cases/excluir-categoria.use-case';
import { DefinirMetaUseCase } from './application/use-cases/definir-meta.use-case';
import { RemoverMetaUseCase } from './application/use-cases/remover-meta.use-case';
import { ObterConsumoCategoriasUseCase } from './application/use-cases/obter-consumo-categorias.use-case';
import { CategoriaSchema } from './infrastructure/persistence/entities/categoria.schema';
import { MetaMensalSchema } from './infrastructure/persistence/entities/meta-mensal.schema';
import { TypeOrmCategoriaRepository } from './infrastructure/persistence/repositories/typeorm-categoria.repository';
import { TypeOrmMetaRepository } from './infrastructure/persistence/repositories/typeorm-meta.repository';
import { LancamentoSchema } from '../lancamentos/infrastructure/persistence/entities/lancamento.schema';
import { TypeOrmLancamentoRepository } from '../lancamentos/infrastructure/persistence/repositories/typeorm-lancamento.repository';
import { CategoriasController } from './presentation/controllers/categorias.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CategoriaSchema, MetaMensalSchema, LancamentoSchema])],
  controllers: [CategoriasController],
  providers: [
    CriarCategoriaUseCase,
    ListarCategoriasUseCase,
    EditarCategoriaUseCase,
    ExcluirCategoriaUseCase,
    DefinirMetaUseCase,
    RemoverMetaUseCase,
    ObterConsumoCategoriasUseCase,
    { provide: CATEGORIA_REPOSITORY, useClass: TypeOrmCategoriaRepository },
    { provide: META_REPOSITORY, useClass: TypeOrmMetaRepository },
    { provide: LANCAMENTO_REPOSITORY, useClass: TypeOrmLancamentoRepository },
  ],
  exports: [CATEGORIA_REPOSITORY],
})
export class CategoriasModule {}
