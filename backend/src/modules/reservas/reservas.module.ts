import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BALDE_REPOSITORY } from './domain/repositories/balde.repository';
import { MOVIMENTO_RESERVA_REPOSITORY } from './domain/repositories/movimento-reserva.repository';
import { CriarBaldeUseCase } from './application/use-cases/criar-balde.use-case';
import { ListarBaldesUseCase } from './application/use-cases/listar-baldes.use-case';
import { EditarBaldeUseCase } from './application/use-cases/editar-balde.use-case';
import { ExcluirBaldeUseCase } from './application/use-cases/excluir-balde.use-case';
import { RegistrarMovimentoUseCase } from './application/use-cases/registrar-movimento.use-case';
import { ListarMovimentosBaldeUseCase } from './application/use-cases/listar-movimentos-balde.use-case';
import { ListarMovimentosCompetenciaUseCase } from './application/use-cases/listar-movimentos-competencia.use-case';
import { EditarMovimentoUseCase } from './application/use-cases/editar-movimento.use-case';
import { ExcluirMovimentoUseCase } from './application/use-cases/excluir-movimento.use-case';
import { ObterSaldosUseCase } from './application/use-cases/obter-saldos.use-case';
import { ObterEvolucaoBaldeUseCase } from './application/use-cases/obter-evolucao-balde.use-case';
import { ObterEvolucaoReservasUseCase } from './application/use-cases/obter-evolucao-reservas.use-case';
import { BaldeSchema } from './infrastructure/persistence/entities/balde.schema';
import { MovimentoReservaSchema } from './infrastructure/persistence/entities/movimento-reserva.schema';
import { TypeOrmBaldeRepository } from './infrastructure/persistence/repositories/typeorm-balde.repository';
import { TypeOrmMovimentoReservaRepository } from './infrastructure/persistence/repositories/typeorm-movimento-reserva.repository';
import { BaldesController } from './presentation/controllers/baldes.controller';
import { MovimentosController } from './presentation/controllers/movimentos.controller';
import { ReservasController } from './presentation/controllers/reservas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([BaldeSchema, MovimentoReservaSchema])],
  controllers: [BaldesController, MovimentosController, ReservasController],
  providers: [
    CriarBaldeUseCase,
    ListarBaldesUseCase,
    EditarBaldeUseCase,
    ExcluirBaldeUseCase,
    RegistrarMovimentoUseCase,
    ListarMovimentosBaldeUseCase,
    ListarMovimentosCompetenciaUseCase,
    EditarMovimentoUseCase,
    ExcluirMovimentoUseCase,
    ObterSaldosUseCase,
    ObterEvolucaoBaldeUseCase,
    ObterEvolucaoReservasUseCase,
    { provide: BALDE_REPOSITORY, useClass: TypeOrmBaldeRepository },
    { provide: MOVIMENTO_RESERVA_REPOSITORY, useClass: TypeOrmMovimentoReservaRepository },
  ],
  exports: [BALDE_REPOSITORY, MOVIMENTO_RESERVA_REPOSITORY],
})
export class ReservasModule {}
