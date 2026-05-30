import { Body, Controller, Delete, HttpCode, Param, Put } from '@nestjs/common';
import type { MovimentoCarteiraDTO } from '@financas-pessoais/shared';
import { EditarMovimentoCarteiraUseCase } from '../../application/use-cases/editar-movimento-carteira.use-case';
import { ExcluirMovimentoCarteiraUseCase } from '../../application/use-cases/excluir-movimento-carteira.use-case';
import { RegistrarMovimentoCarteiraRequest } from '../dtos/registrar-movimento-carteira.request';
import { mapErroInvestimentos } from './ativos.controller';

@Controller('movimentos-carteira')
export class MovimentosCarteiraController {
  constructor(
    private readonly editarMovimento: EditarMovimentoCarteiraUseCase,
    private readonly excluirMovimento: ExcluirMovimentoCarteiraUseCase,
  ) {}

  @Put(':id')
  async editar(
    @Param('id') id: string,
    @Body() body: RegistrarMovimentoCarteiraRequest,
  ): Promise<MovimentoCarteiraDTO> {
    try {
      return await this.editarMovimento.execute({
        id,
        tipo: body.tipo,
        valor: body.valor,
        competencia: body.competencia,
        descricao: body.descricao ?? null,
      });
    } catch (error) {
      throw mapErroInvestimentos(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async excluir(@Param('id') id: string): Promise<void> {
    try {
      await this.excluirMovimento.execute(id);
    } catch (error) {
      throw mapErroInvestimentos(error);
    }
  }
}
