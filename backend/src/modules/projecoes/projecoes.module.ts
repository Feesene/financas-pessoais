import { Module } from '@nestjs/common';
import { CalcularProjecaoUseCase } from './application/use-cases/calcular-projecao.use-case';
import { ProjecoesController } from './presentation/controllers/projecoes.controller';

@Module({
  controllers: [ProjecoesController],
  providers: [CalcularProjecaoUseCase],
})
export class ProjecoesModule {}
