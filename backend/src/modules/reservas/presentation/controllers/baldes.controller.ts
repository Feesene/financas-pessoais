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
} from '@nestjs/common';
import type {
  BaldeDTO,
  EvolucaoBaldeDTO,
  MovimentoReservaDTO,
} from '@financas-pessoais/shared';
import { CriarBaldeUseCase } from '../../application/use-cases/criar-balde.use-case';
import { ListarBaldesUseCase } from '../../application/use-cases/listar-baldes.use-case';
import { EditarBaldeUseCase } from '../../application/use-cases/editar-balde.use-case';
import { ExcluirBaldeUseCase } from '../../application/use-cases/excluir-balde.use-case';
import { RegistrarMovimentoUseCase } from '../../application/use-cases/registrar-movimento.use-case';
import { ListarMovimentosBaldeUseCase } from '../../application/use-cases/listar-movimentos-balde.use-case';
import { ObterEvolucaoBaldeUseCase } from '../../application/use-cases/obter-evolucao-balde.use-case';
import { BaldeNaoEncontradoError } from '../../application/errors/balde-nao-encontrado.error';
import { BaldeDuplicadoError } from '../../application/errors/balde-duplicado.error';
import { BaldeComMovimentosError } from '../../application/errors/balde-com-movimentos.error';
import { BaldeInvalidoError } from '../../domain/errors/balde-invalido.error';
import { MovimentoInvalidoError } from '../../domain/errors/movimento-invalido.error';
import { CriarBaldeRequest } from '../dtos/criar-balde.request';
import { AtualizarBaldeRequest } from '../dtos/atualizar-balde.request';
import { RegistrarMovimentoRequest } from '../dtos/registrar-movimento.request';

@Controller('baldes')
export class BaldesController {
  constructor(
    private readonly criarBalde: CriarBaldeUseCase,
    private readonly listarBaldes: ListarBaldesUseCase,
    private readonly editarBalde: EditarBaldeUseCase,
    private readonly excluirBalde: ExcluirBaldeUseCase,
    private readonly registrarMovimento: RegistrarMovimentoUseCase,
    private readonly listarMovimentos: ListarMovimentosBaldeUseCase,
    private readonly obterEvolucao: ObterEvolucaoBaldeUseCase,
  ) {}

  @Post()
  async criar(@Body() body: CriarBaldeRequest): Promise<BaldeDTO> {
    try {
      return await this.criarBalde.execute({
        nome: body.nome,
        saldoInicial: body.saldoInicial,
        cor: body.cor ?? null,
      });
    } catch (error) {
      throw mapErroReservas(error);
    }
  }

  @Get()
  async listar(): Promise<BaldeDTO[]> {
    return this.listarBaldes.execute();
  }

  @Put(':id')
  async editar(
    @Param('id') id: string,
    @Body() body: AtualizarBaldeRequest,
  ): Promise<BaldeDTO> {
    try {
      return await this.editarBalde.execute({
        id,
        nome: body.nome,
        saldoInicial: body.saldoInicial,
        cor: body.cor ?? null,
      });
    } catch (error) {
      throw mapErroReservas(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async excluir(@Param('id') id: string): Promise<void> {
    try {
      await this.excluirBalde.execute(id);
    } catch (error) {
      throw mapErroReservas(error);
    }
  }

  @Post(':id/movimentos')
  async movimentar(
    @Param('id') id: string,
    @Body() body: RegistrarMovimentoRequest,
  ): Promise<MovimentoReservaDTO> {
    try {
      return await this.registrarMovimento.execute({
        baldeId: id,
        tipo: body.tipo,
        valor: body.valor,
        competencia: body.competencia,
        descricao: body.descricao ?? null,
      });
    } catch (error) {
      throw mapErroReservas(error);
    }
  }

  @Get(':id/movimentos')
  async movimentos(@Param('id') id: string): Promise<MovimentoReservaDTO[]> {
    try {
      return await this.listarMovimentos.execute(id);
    } catch (error) {
      throw mapErroReservas(error);
    }
  }

  @Get(':id/evolucao')
  async evolucao(@Param('id') id: string): Promise<EvolucaoBaldeDTO[]> {
    try {
      return await this.obterEvolucao.execute(id);
    } catch (error) {
      throw mapErroReservas(error);
    }
  }
}

/** Mapeia erros de domínio/aplicação de reservas para os status HTTP da seção 5. */
export function mapErroReservas(error: unknown): unknown {
  if (error instanceof BaldeNaoEncontradoError) {
    return new NotFoundException(error.message);
  }
  if (error instanceof BaldeDuplicadoError || error instanceof BaldeComMovimentosError) {
    return new ConflictException(error.message);
  }
  if (error instanceof BaldeInvalidoError || error instanceof MovimentoInvalidoError) {
    return new BadRequestException(error.message);
  }
  return error;
}
