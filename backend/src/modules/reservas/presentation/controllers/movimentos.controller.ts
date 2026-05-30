import { Body, Controller, Delete, HttpCode, Param, Put } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';
import type { MovimentoReservaDTO } from '@financas-pessoais/shared';
import { EditarMovimentoUseCase } from '../../application/use-cases/editar-movimento.use-case';
import { ExcluirMovimentoUseCase } from '../../application/use-cases/excluir-movimento.use-case';
import { MovimentoNaoEncontradoError } from '../../application/errors/movimento-nao-encontrado.error';
import { RegistrarMovimentoRequest } from '../dtos/registrar-movimento.request';
import { mapErroReservas } from './baldes.controller';

@Controller('movimentos')
export class MovimentosController {
  constructor(
    private readonly editarMovimento: EditarMovimentoUseCase,
    private readonly excluirMovimento: ExcluirMovimentoUseCase,
  ) {}

  @Put(':id')
  async editar(
    @Param('id') id: string,
    @Body() body: RegistrarMovimentoRequest,
  ): Promise<MovimentoReservaDTO> {
    try {
      return await this.editarMovimento.execute({
        id,
        tipo: body.tipo,
        valor: body.valor,
        competencia: body.competencia,
        descricao: body.descricao ?? null,
      });
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async excluir(@Param('id') id: string): Promise<void> {
    try {
      await this.excluirMovimento.execute(id);
    } catch (error) {
      throw this.mapErro(error);
    }
  }

  private mapErro(error: unknown): unknown {
    if (error instanceof MovimentoNaoEncontradoError) {
      return new NotFoundException(error.message);
    }
    return mapErroReservas(error);
  }
}
