import { Module } from '@nestjs/common';
import { HealthController } from './presentation/health.controller';

/**
 * Módulo operacional de saúde (spec §1, D-1). Diferente dos módulos de domínio, é enxuto —
 * apenas um controller com o keep-alive do banco, sem use-cases nem portas/adapters, pois
 * não há regra de negócio envolvida.
 */
@Module({
  controllers: [HealthController],
})
export class HealthModule {}
