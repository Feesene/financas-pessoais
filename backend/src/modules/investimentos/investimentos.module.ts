import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ATIVO_REPOSITORY } from './domain/repositories/ativo.repository';
import { MOVIMENTO_CARTEIRA_REPOSITORY } from './domain/repositories/movimento-carteira.repository';
import { CriarAtivoUseCase } from './application/use-cases/criar-ativo.use-case';
import { ListarAtivosUseCase } from './application/use-cases/listar-ativos.use-case';
import { EditarAtivoUseCase } from './application/use-cases/editar-ativo.use-case';
import { ExcluirAtivoUseCase } from './application/use-cases/excluir-ativo.use-case';
import { RegistrarMovimentoCarteiraUseCase } from './application/use-cases/registrar-movimento-carteira.use-case';
import { EditarMovimentoCarteiraUseCase } from './application/use-cases/editar-movimento-carteira.use-case';
import { ExcluirMovimentoCarteiraUseCase } from './application/use-cases/excluir-movimento-carteira.use-case';
import { ObterPosicaoCarteiraUseCase } from './application/use-cases/obter-posicao-carteira.use-case';
import { ObterHistoricoCarteiraUseCase } from './application/use-cases/obter-historico-carteira.use-case';
import { AtivoSchema } from './infrastructure/persistence/entities/ativo.schema';
import { MovimentoCarteiraSchema } from './infrastructure/persistence/entities/movimento-carteira.schema';
import { TypeOrmAtivoRepository } from './infrastructure/persistence/repositories/typeorm-ativo.repository';
import { TypeOrmMovimentoCarteiraRepository } from './infrastructure/persistence/repositories/typeorm-movimento-carteira.repository';
import { AtivosController } from './presentation/controllers/ativos.controller';
import { MovimentosCarteiraController } from './presentation/controllers/movimentos-carteira.controller';
import { CarteiraController } from './presentation/controllers/carteira.controller';

@Module({
  imports: [TypeOrmModule.forFeature([AtivoSchema, MovimentoCarteiraSchema])],
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
    { provide: ATIVO_REPOSITORY, useClass: TypeOrmAtivoRepository },
    { provide: MOVIMENTO_CARTEIRA_REPOSITORY, useClass: TypeOrmMovimentoCarteiraRepository },
  ],
  exports: [ATIVO_REPOSITORY, MOVIMENTO_CARTEIRA_REPOSITORY],
})
export class InvestimentosModule {}
