import { Controller, Get, Query } from '@nestjs/common';
import type { SaldosReservaDTO } from '@financas-pessoais/shared';
import { ObterSaldosUseCase } from '../../application/use-cases/obter-saldos.use-case';
import { SaldosQueryRequest } from '../dtos/saldos-query.request';

@Controller('reservas')
export class ReservasController {
  constructor(private readonly obterSaldos: ObterSaldosUseCase) {}

  @Get('saldos')
  async saldos(@Query() query: SaldosQueryRequest): Promise<SaldosReservaDTO> {
    return this.obterSaldos.execute(query.competencia ?? null);
  }
}
