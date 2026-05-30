import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import type { ProjecaoResultadoDTO } from '@financas-pessoais/shared';
import { CalcularProjecaoUseCase } from '../../application/use-cases/calcular-projecao.use-case';
import { ParametrosInvalidosError } from '../../application/errors/parametros-invalidos.error';
import { CalcularProjecaoRequest } from '../dtos/calcular-projecao.request';

@Controller('projecoes')
export class ProjecoesController {
  constructor(private readonly calcularProjecao: CalcularProjecaoUseCase) {}

  @Post('calcular')
  @HttpCode(200)
  calcular(@Body() body: CalcularProjecaoRequest): ProjecaoResultadoDTO {
    try {
      return this.calcularProjecao.execute(body);
    } catch (error) {
      if (error instanceof ParametrosInvalidosError) {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }
}
