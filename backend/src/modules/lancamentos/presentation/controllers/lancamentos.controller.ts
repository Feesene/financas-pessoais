import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import type { LancamentoDTO, ResumoMensalDTO } from '@financas-pessoais/shared';
import { CriarLancamentoUseCase } from '../../application/use-cases/criar-lancamento.use-case';
import { ListarLancamentosUseCase } from '../../application/use-cases/listar-lancamentos.use-case';
import { EditarLancamentoUseCase } from '../../application/use-cases/editar-lancamento.use-case';
import { ExcluirLancamentoUseCase } from '../../application/use-cases/excluir-lancamento.use-case';
import { ObterResumoMensalUseCase } from '../../application/use-cases/obter-resumo-mensal.use-case';
import { LancamentoNaoEncontradoError } from '../../application/errors/lancamento-nao-encontrado.error';
import { CategoriaInexistenteError } from '../../application/errors/categoria-inexistente.error';
import { CriarLancamentoRequest } from '../dtos/criar-lancamento.request';
import { AtualizarLancamentoRequest } from '../dtos/atualizar-lancamento.request';
import { CompetenciaQueryRequest } from '../dtos/competencia-query.request';

@Controller('lancamentos')
export class LancamentosController {
  constructor(
    private readonly criarLancamento: CriarLancamentoUseCase,
    private readonly listarLancamentos: ListarLancamentosUseCase,
    private readonly editarLancamento: EditarLancamentoUseCase,
    private readonly excluirLancamento: ExcluirLancamentoUseCase,
    private readonly obterResumoMensal: ObterResumoMensalUseCase,
  ) {}

  @Post()
  async criar(@Body() body: CriarLancamentoRequest): Promise<LancamentoDTO> {
    try {
      return await this.criarLancamento.execute({
        tipo: body.tipo,
        categoria: body.categoria,
        categoriaId: body.categoriaId ?? null,
        descricao: body.descricao ?? null,
        valor: body.valor,
        competencia: body.competencia,
      });
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  @Get()
  async listar(@Query('competencia') competencia: string): Promise<LancamentoDTO[]> {
    return this.listarLancamentos.execute(competencia);
  }

  @Get('resumo')
  async resumo(@Query() query: CompetenciaQueryRequest): Promise<ResumoMensalDTO> {
    return this.obterResumoMensal.execute(query.competencia);
  }

  @Put(':id')
  async editar(
    @Param('id') id: string,
    @Body() body: AtualizarLancamentoRequest,
  ): Promise<LancamentoDTO> {
    try {
      return await this.editarLancamento.execute({
        id,
        tipo: body.tipo,
        categoria: body.categoria,
        categoriaId: body.categoriaId ?? null,
        descricao: body.descricao ?? null,
        valor: body.valor,
        competencia: body.competencia,
      });
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async excluir(@Param('id') id: string): Promise<void> {
    try {
      await this.excluirLancamento.execute(id);
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  private mapErro(error: unknown): unknown {
    if (error instanceof LancamentoNaoEncontradoError) {
      return new NotFoundException(error.message);
    }
    if (error instanceof CategoriaInexistenteError) {
      return new BadRequestException(error.message);
    }
    return error;
  }
}
