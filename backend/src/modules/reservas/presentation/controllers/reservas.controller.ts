import { Controller, Get, Query } from '@nestjs/common';
import type {
  EvolucaoReservaItemDTO,
  MovimentoReservaComBaldeDTO,
  SaldosReservaDTO,
} from '@financas-pessoais/shared';
import { ObterSaldosUseCase } from '../../application/use-cases/obter-saldos.use-case';
import { ListarMovimentosCompetenciaUseCase } from '../../application/use-cases/listar-movimentos-competencia.use-case';
import { ObterEvolucaoReservasUseCase } from '../../application/use-cases/obter-evolucao-reservas.use-case';
import { SaldosQueryRequest } from '../dtos/saldos-query.request';
import { MovimentosCompetenciaQueryRequest } from '../dtos/movimentos-competencia-query.request';
import { EvolucaoAnualQueryRequest } from '../dtos/evolucao-anual-query.request';

@Controller('reservas')
export class ReservasController {
  constructor(
    private readonly obterSaldos: ObterSaldosUseCase,
    private readonly listarMovimentos: ListarMovimentosCompetenciaUseCase,
    private readonly obterEvolucaoReservas: ObterEvolucaoReservasUseCase,
  ) {}

  @Get('saldos')
  async saldos(@Query() query: SaldosQueryRequest): Promise<SaldosReservaDTO> {
    return this.obterSaldos.execute(query.competencia ?? null);
  }

  @Get('movimentos')
  async movimentos(
    @Query() query: MovimentosCompetenciaQueryRequest,
  ): Promise<MovimentoReservaComBaldeDTO[]> {
    return this.listarMovimentos.execute(query.competencia);
  }

  @Get('evolucao-anual')
  async evolucaoAnual(
    @Query() query: EvolucaoAnualQueryRequest,
  ): Promise<EvolucaoReservaItemDTO[]> {
    return this.obterEvolucaoReservas.execute(query.ano);
  }
}
