import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import type { MaterializarResultadoDTO, RegraRecorrenteDTO } from '@financas-pessoais/shared';
import { CriarRegraUseCase } from '../../application/use-cases/criar-regra.use-case';
import { ListarRegrasUseCase } from '../../application/use-cases/listar-regras.use-case';
import { EditarRegraUseCase } from '../../application/use-cases/editar-regra.use-case';
import { EncerrarRegraUseCase } from '../../application/use-cases/encerrar-regra.use-case';
import { MaterializarCompetenciaUseCase } from '../../application/use-cases/materializar-competencia.use-case';
import { RegraNaoEncontradaError } from '../../application/errors/regra-nao-encontrada.error';
import { CategoriaInexistenteError } from '../../application/errors/categoria-inexistente.error';
import { RegraRecorrenteInvalidaError } from '../../domain/errors/regra-recorrente-invalida.error';
import { CriarRegraRequest } from '../dtos/criar-regra.request';
import { EditarRegraRequest } from '../dtos/editar-regra.request';
import { MaterializarRequest } from '../dtos/materializar.request';

@Controller('recorrencias')
export class RecorrenciasController {
  constructor(
    private readonly criarRegra: CriarRegraUseCase,
    private readonly listarRegras: ListarRegrasUseCase,
    private readonly editarRegra: EditarRegraUseCase,
    private readonly encerrarRegra: EncerrarRegraUseCase,
    private readonly materializar: MaterializarCompetenciaUseCase,
  ) {}

  @Post()
  async criar(@Body() body: CriarRegraRequest): Promise<RegraRecorrenteDTO> {
    try {
      return await this.criarRegra.execute({
        tipo: body.tipo,
        categoriaId: body.categoriaId,
        descricao: body.descricao ?? null,
        valorBase: body.valorBase,
        valorTotal: body.valorTotal,
        competenciaInicio: body.competenciaInicio,
        competenciaFim: body.competenciaFim ?? null,
        numeroParcelas: body.numeroParcelas ?? null,
      });
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  @Get()
  async listar(): Promise<RegraRecorrenteDTO[]> {
    return this.listarRegras.execute();
  }

  @Post('materializar')
  @HttpCode(200)
  async materializarCompetencia(
    @Body() body: MaterializarRequest,
  ): Promise<MaterializarResultadoDTO> {
    return this.materializar.execute(body.competencia);
  }

  @Put(':id')
  async editar(
    @Param('id') id: string,
    @Body() body: EditarRegraRequest,
  ): Promise<RegraRecorrenteDTO> {
    try {
      return await this.editarRegra.execute({
        id,
        aPartirDe: body.aPartirDe,
        tipo: body.tipo,
        categoriaId: body.categoriaId,
        descricao: body.descricao ?? null,
        valorBase: body.valorBase,
        valorTotal: body.valorTotal,
        competenciaInicio: body.competenciaInicio,
        competenciaFim: body.competenciaFim ?? null,
        numeroParcelas: body.numeroParcelas ?? null,
      });
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  @Post(':id/encerrar')
  @HttpCode(200)
  async encerrar(@Param('id') id: string): Promise<RegraRecorrenteDTO> {
    try {
      return await this.encerrarRegra.execute(id);
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  private mapErro(error: unknown): unknown {
    if (error instanceof RegraNaoEncontradaError) {
      return new NotFoundException(error.message);
    }
    if (
      error instanceof CategoriaInexistenteError ||
      error instanceof RegraRecorrenteInvalidaError
    ) {
      return new BadRequestException(error.message);
    }
    return error;
  }
}
