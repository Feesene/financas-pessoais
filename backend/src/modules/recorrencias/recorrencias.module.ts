import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { REGRA_RECORRENTE_REPOSITORY } from './domain/repositories/regra-recorrente.repository';
import { CriarRegraUseCase } from './application/use-cases/criar-regra.use-case';
import { ListarRegrasUseCase } from './application/use-cases/listar-regras.use-case';
import { EditarRegraUseCase } from './application/use-cases/editar-regra.use-case';
import { EncerrarRegraUseCase } from './application/use-cases/encerrar-regra.use-case';
import { MaterializarCompetenciaUseCase } from './application/use-cases/materializar-competencia.use-case';
import { RegraRecorrenteSchema } from './infrastructure/persistence/entities/regra-recorrente.schema';
import { TypeOrmRegraRecorrenteRepository } from './infrastructure/persistence/repositories/typeorm-regra-recorrente.repository';
import { RecorrenciasController } from './presentation/controllers/recorrencias.controller';
import { LANCAMENTO_REPOSITORY } from '../lancamentos/domain/repositories/lancamento.repository';
import { OCORRENCIA_EXCLUIDA_REPOSITORY } from '../lancamentos/domain/repositories/ocorrencia-excluida.repository';
import { LancamentoSchema } from '../lancamentos/infrastructure/persistence/entities/lancamento.schema';
import { OcorrenciaExcluidaSchema } from '../lancamentos/infrastructure/persistence/entities/ocorrencia-excluida.schema';
import { TypeOrmLancamentoRepository } from '../lancamentos/infrastructure/persistence/repositories/typeorm-lancamento.repository';
import { TypeOrmOcorrenciaExcluidaRepository } from '../lancamentos/infrastructure/persistence/repositories/typeorm-ocorrencia-excluida.repository';
import { CATEGORIA_REPOSITORY } from '../categorias/domain/repositories/categoria.repository';
import { CategoriaSchema } from '../categorias/infrastructure/persistence/entities/categoria.schema';
import { TypeOrmCategoriaRepository } from '../categorias/infrastructure/persistence/repositories/typeorm-categoria.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      RegraRecorrenteSchema,
      LancamentoSchema,
      OcorrenciaExcluidaSchema,
      CategoriaSchema,
    ]),
  ],
  controllers: [RecorrenciasController],
  providers: [
    CriarRegraUseCase,
    ListarRegrasUseCase,
    EditarRegraUseCase,
    EncerrarRegraUseCase,
    MaterializarCompetenciaUseCase,
    { provide: REGRA_RECORRENTE_REPOSITORY, useClass: TypeOrmRegraRecorrenteRepository },
    { provide: LANCAMENTO_REPOSITORY, useClass: TypeOrmLancamentoRepository },
    { provide: OCORRENCIA_EXCLUIDA_REPOSITORY, useClass: TypeOrmOcorrenciaExcluidaRepository },
    { provide: CATEGORIA_REPOSITORY, useClass: TypeOrmCategoriaRepository },
  ],
  exports: [REGRA_RECORRENTE_REPOSITORY],
})
export class RecorrenciasModule {}
