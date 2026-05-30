import {
  BadRequestException,
  Body,
  ConflictException,
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
import type {
  CategoriaDTO,
  ConsumoCategoriaDTO,
  MetaMensalDTO,
} from '@financas-pessoais/shared';
import { CriarCategoriaUseCase } from '../../application/use-cases/criar-categoria.use-case';
import { ListarCategoriasUseCase } from '../../application/use-cases/listar-categorias.use-case';
import { EditarCategoriaUseCase } from '../../application/use-cases/editar-categoria.use-case';
import { ExcluirCategoriaUseCase } from '../../application/use-cases/excluir-categoria.use-case';
import { DefinirMetaUseCase } from '../../application/use-cases/definir-meta.use-case';
import { RemoverMetaUseCase } from '../../application/use-cases/remover-meta.use-case';
import { ObterConsumoCategoriasUseCase } from '../../application/use-cases/obter-consumo-categorias.use-case';
import { CategoriaNaoEncontradaError } from '../../application/errors/categoria-nao-encontrada.error';
import { CategoriaDuplicadaError } from '../../application/errors/categoria-duplicada.error';
import { CategoriaEmUsoError } from '../../application/errors/categoria-em-uso.error';
import { MetaNaoEncontradaError } from '../../application/errors/meta-nao-encontrada.error';
import { MetaInvalidaError } from '../../domain/errors/meta-invalida.error';
import { CategoriaInvalidaError } from '../../domain/errors/categoria-invalida.error';
import { CriarCategoriaRequest } from '../dtos/criar-categoria.request';
import { AtualizarCategoriaRequest } from '../dtos/atualizar-categoria.request';
import { DefinirMetaRequest } from '../dtos/definir-meta.request';
import { CompetenciaQueryRequest } from '../dtos/competencia-query.request';

@Controller('categorias')
export class CategoriasController {
  constructor(
    private readonly criarCategoria: CriarCategoriaUseCase,
    private readonly listarCategorias: ListarCategoriasUseCase,
    private readonly editarCategoria: EditarCategoriaUseCase,
    private readonly excluirCategoria: ExcluirCategoriaUseCase,
    private readonly definirMeta: DefinirMetaUseCase,
    private readonly removerMeta: RemoverMetaUseCase,
    private readonly obterConsumo: ObterConsumoCategoriasUseCase,
  ) {}

  @Post()
  async criar(@Body() body: CriarCategoriaRequest): Promise<CategoriaDTO> {
    try {
      return await this.criarCategoria.execute({
        nome: body.nome,
        tipo: body.tipo,
        cor: body.cor ?? null,
      });
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  @Get()
  async listar(): Promise<CategoriaDTO[]> {
    return this.listarCategorias.execute();
  }

  @Get('consumo')
  async consumo(@Query() query: CompetenciaQueryRequest): Promise<ConsumoCategoriaDTO[]> {
    return this.obterConsumo.execute(query.competencia);
  }

  @Put(':id')
  async editar(
    @Param('id') id: string,
    @Body() body: AtualizarCategoriaRequest,
  ): Promise<CategoriaDTO> {
    try {
      return await this.editarCategoria.execute({ id, nome: body.nome, cor: body.cor ?? null });
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async excluir(@Param('id') id: string): Promise<void> {
    try {
      await this.excluirCategoria.execute(id);
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  @Put(':id/metas')
  async definir(
    @Param('id') id: string,
    @Body() body: DefinirMetaRequest,
  ): Promise<MetaMensalDTO> {
    try {
      return await this.definirMeta.execute({
        categoriaId: id,
        competencia: body.competencia,
        valor: body.valor,
      });
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  @Delete(':id/metas')
  @HttpCode(204)
  async removerMetaDaCompetencia(
    @Param('id') id: string,
    @Query() query: CompetenciaQueryRequest,
  ): Promise<void> {
    try {
      await this.removerMeta.execute(id, query.competencia);
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  private mapErro(error: unknown): unknown {
    if (error instanceof CategoriaNaoEncontradaError || error instanceof MetaNaoEncontradaError) {
      return new NotFoundException(error.message);
    }
    if (error instanceof CategoriaDuplicadaError || error instanceof CategoriaEmUsoError) {
      return new ConflictException(error.message);
    }
    if (error instanceof MetaInvalidaError || error instanceof CategoriaInvalidaError) {
      return new BadRequestException(error.message);
    }
    return error;
  }
}
