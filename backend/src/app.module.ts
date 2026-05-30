import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildTypeOrmConfig } from './shared/config/typeorm.config';
import { LancamentosModule } from './modules/lancamentos/lancamentos.module';
import { CategoriasModule } from './modules/categorias/categorias.module';
import { RecorrenciasModule } from './modules/recorrencias/recorrencias.module';
import { ReservasModule } from './modules/reservas/reservas.module';
import { RelatoriosModule } from './modules/relatorios/relatorios.module';
import { InvestimentosModule } from './modules/investimentos/investimentos.module';
import { ProjecoesModule } from './modules/projecoes/projecoes.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => buildTypeOrmConfig(config),
    }),
    LancamentosModule,
    CategoriasModule,
    RecorrenciasModule,
    ReservasModule,
    RelatoriosModule,
    InvestimentosModule,
    ProjecoesModule,
  ],
})
export class AppModule {}
