import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import type {
  ComparacaoMesesDTO,
  ConsolidadoDTO,
  EvolucaoMensalItemDTO,
  GastoPorCategoriaItemDTO,
  PrevistoPagoItemDTO,
} from '@financas-pessoais/shared';
import { ObterConsolidadoUseCase } from '../../application/use-cases/obter-consolidado.use-case';
import { ObterGastoPorCategoriaUseCase } from '../../application/use-cases/obter-gasto-por-categoria.use-case';
import { ObterEvolucaoUseCase } from '../../application/use-cases/obter-evolucao.use-case';
import { ObterPrevistoPagoUseCase } from '../../application/use-cases/obter-previsto-pago.use-case';
import { CompararMesesUseCase } from '../../application/use-cases/comparar-meses.use-case';
import { ExportacaoService } from '../../application/exportacao.service';
import { IntervaloInvalidoError } from '../../application/errors/intervalo-invalido.error';
import { ConsolidadoQueryRequest } from '../dtos/consolidado-query.request';
import { IntervaloQueryRequest } from '../dtos/intervalo-query.request';
import { CompararQueryRequest } from '../dtos/comparar-query.request';
import { ExportarQueryRequest } from '../dtos/exportar-query.request';

@Controller('relatorios')
export class RelatoriosController {
  constructor(
    private readonly obterConsolidado: ObterConsolidadoUseCase,
    private readonly obterGastoPorCategoria: ObterGastoPorCategoriaUseCase,
    private readonly obterEvolucao: ObterEvolucaoUseCase,
    private readonly obterPrevistoPago: ObterPrevistoPagoUseCase,
    private readonly compararMeses: CompararMesesUseCase,
    private readonly exportacao: ExportacaoService,
  ) {}

  @Get('consolidado')
  async consolidado(@Query() query: ConsolidadoQueryRequest): Promise<ConsolidadoDTO> {
    const { de, ate } = resolverIntervalo(query);
    return executar(() => this.obterConsolidado.execute(de, ate));
  }

  @Get('por-categoria')
  async porCategoria(
    @Query() query: IntervaloQueryRequest,
  ): Promise<GastoPorCategoriaItemDTO[]> {
    return executar(() => this.obterGastoPorCategoria.execute(query.de, query.ate));
  }

  @Get('evolucao')
  async evolucao(@Query() query: IntervaloQueryRequest): Promise<EvolucaoMensalItemDTO[]> {
    return executar(() => this.obterEvolucao.execute(query.de, query.ate));
  }

  @Get('previsto-pago')
  async previstoPago(@Query() query: IntervaloQueryRequest): Promise<PrevistoPagoItemDTO[]> {
    return executar(() => this.obterPrevistoPago.execute(query.de, query.ate));
  }

  @Get('comparar')
  async comparar(@Query() query: CompararQueryRequest): Promise<ComparacaoMesesDTO> {
    return executar(() => this.compararMeses.execute(query.a, query.b));
  }

  @Get('exportar')
  async exportar(
    @Query() query: ExportarQueryRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const consolidado = await executar(() => this.obterConsolidado.execute(query.de, query.ate));
    const nomeBase = `consolidado-${query.de}-a-${query.ate}`;

    if (query.formato === 'xlsx') {
      const buffer = await this.exportacao.gerarXlsx(consolidado);
      res.set({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${nomeBase}.xlsx"`,
      });
      return new StreamableFile(buffer);
    }

    const buffer = await this.exportacao.gerarPdf(consolidado);
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${nomeBase}.pdf"`,
    });
    return new StreamableFile(buffer);
  }
}

/** Resolve o intervalo do consolidado a partir de ?ano=AAAA ou ?de=&ate=. */
function resolverIntervalo(query: ConsolidadoQueryRequest): { de: string; ate: string } {
  if (query.ano) {
    return { de: `${query.ano}-01`, ate: `${query.ano}-12` };
  }
  if (query.de && query.ate) {
    return { de: query.de, ate: query.ate };
  }
  throw new BadRequestException('Informe ?ano=AAAA ou ?de=AAAA-MM&ate=AAAA-MM.');
}

/** Executa um caso de uso mapeando IntervaloInvalidoError → 400. */
async function executar<T>(acao: () => Promise<T>): Promise<T> {
  try {
    return await acao();
  } catch (error) {
    if (error instanceof IntervaloInvalidoError) {
      throw new BadRequestException(error.message);
    }
    throw error;
  }
}
