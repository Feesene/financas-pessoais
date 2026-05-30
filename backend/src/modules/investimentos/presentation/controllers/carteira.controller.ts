import { Controller, Get, Query } from '@nestjs/common';
import type { HistoricoCarteiraItemDTO, PosicaoCarteiraDTO } from '@financas-pessoais/shared';
import { ObterPosicaoCarteiraUseCase } from '../../application/use-cases/obter-posicao-carteira.use-case';
import { ObterHistoricoCarteiraUseCase } from '../../application/use-cases/obter-historico-carteira.use-case';
import { HistoricoQueryRequest } from '../dtos/historico-query.request';

@Controller('carteira')
export class CarteiraController {
  constructor(
    private readonly obterPosicao: ObterPosicaoCarteiraUseCase,
    private readonly obterHistorico: ObterHistoricoCarteiraUseCase,
  ) {}

  @Get('posicao')
  async posicao(): Promise<PosicaoCarteiraDTO> {
    return this.obterPosicao.execute();
  }

  @Get('historico')
  async historico(@Query() query: HistoricoQueryRequest): Promise<HistoricoCarteiraItemDTO[]> {
    return this.obterHistorico.execute({ de: query.de ?? null, ate: query.ate ?? null });
  }
}
