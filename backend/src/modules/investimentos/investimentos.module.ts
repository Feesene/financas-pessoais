import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ATIVO_REPOSITORY } from './domain/repositories/ativo.repository';
import { MOVIMENTO_CARTEIRA_REPOSITORY } from './domain/repositories/movimento-carteira.repository';
import { COTACAO_ATIVO_REPOSITORY } from './domain/repositories/cotacao-ativo.repository';
import { CriarAtivoUseCase } from './application/use-cases/criar-ativo.use-case';
import { ListarAtivosUseCase } from './application/use-cases/listar-ativos.use-case';
import { EditarAtivoUseCase } from './application/use-cases/editar-ativo.use-case';
import { ExcluirAtivoUseCase } from './application/use-cases/excluir-ativo.use-case';
import { RegistrarMovimentoCarteiraUseCase } from './application/use-cases/registrar-movimento-carteira.use-case';
import { EditarMovimentoCarteiraUseCase } from './application/use-cases/editar-movimento-carteira.use-case';
import { ExcluirMovimentoCarteiraUseCase } from './application/use-cases/excluir-movimento-carteira.use-case';
import { ObterPosicaoCarteiraUseCase } from './application/use-cases/obter-posicao-carteira.use-case';
import { ObterHistoricoCarteiraUseCase } from './application/use-cases/obter-historico-carteira.use-case';
import { RegistrarCotacaoUseCase } from './application/use-cases/registrar-cotacao.use-case';
import { ListarCotacoesUseCase } from './application/use-cases/listar-cotacoes.use-case';
import { ObterEvolucaoAtivoUseCase } from './application/use-cases/obter-evolucao-ativo.use-case';
import { ExcluirCotacaoUseCase } from './application/use-cases/excluir-cotacao.use-case';
import { AtivoSchema } from './infrastructure/persistence/entities/ativo.schema';
import { MovimentoCarteiraSchema } from './infrastructure/persistence/entities/movimento-carteira.schema';
import { CotacaoAtivoSchema } from './infrastructure/persistence/entities/cotacao-ativo.schema';
import { TypeOrmAtivoRepository } from './infrastructure/persistence/repositories/typeorm-ativo.repository';
import { TypeOrmMovimentoCarteiraRepository } from './infrastructure/persistence/repositories/typeorm-movimento-carteira.repository';
import { TypeOrmCotacaoAtivoRepository } from './infrastructure/persistence/repositories/typeorm-cotacao-ativo.repository';
import { AtivosController } from './presentation/controllers/ativos.controller';
import { MovimentosCarteiraController } from './presentation/controllers/movimentos-carteira.controller';
import { CarteiraController } from './presentation/controllers/carteira.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AtivoSchema, MovimentoCarteiraSchema, CotacaoAtivoSchema]),
  ],
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
    RegistrarCotacaoUseCase,
    ListarCotacoesUseCase,
    ObterEvolucaoAtivoUseCase,
    ExcluirCotacaoUseCase,
    { provide: ATIVO_REPOSITORY, useClass: TypeOrmAtivoRepository },
    { provide: MOVIMENTO_CARTEIRA_REPOSITORY, useClass: TypeOrmMovimentoCarteiraRepository },
    { provide: COTACAO_ATIVO_REPOSITORY, useClass: TypeOrmCotacaoAtivoRepository },
  ],
  exports: [ATIVO_REPOSITORY, MOVIMENTO_CARTEIRA_REPOSITORY, COTACAO_ATIVO_REPOSITORY],
})
export class InvestimentosModule {}
