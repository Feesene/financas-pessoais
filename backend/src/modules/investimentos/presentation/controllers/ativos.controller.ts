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
import type { AtivoDTO, MovimentoCarteiraDTO } from '@financas-pessoais/shared';
import { CriarAtivoUseCase } from '../../application/use-cases/criar-ativo.use-case';
import { ListarAtivosUseCase } from '../../application/use-cases/listar-ativos.use-case';
import { EditarAtivoUseCase } from '../../application/use-cases/editar-ativo.use-case';
import { ExcluirAtivoUseCase } from '../../application/use-cases/excluir-ativo.use-case';
import { RegistrarMovimentoCarteiraUseCase } from '../../application/use-cases/registrar-movimento-carteira.use-case';
import { AtivoNaoEncontradoError } from '../../application/errors/ativo-nao-encontrado.error';
import { AtivoComMovimentosError } from '../../application/errors/ativo-com-movimentos.error';
import { MovimentoCarteiraNaoEncontradoError } from '../../application/errors/movimento-carteira-nao-encontrado.error';
import { AtivoInvalidoError } from '../../domain/errors/ativo-invalido.error';
import { MovimentoCarteiraInvalidoError } from '../../domain/errors/movimento-carteira-invalido.error';
import { CriarAtivoRequest } from '../dtos/criar-ativo.request';
import { AtualizarAtivoRequest } from '../dtos/atualizar-ativo.request';
import { RegistrarMovimentoCarteiraRequest } from '../dtos/registrar-movimento-carteira.request';

@Controller('ativos')
export class AtivosController {
  constructor(
    private readonly criarAtivo: CriarAtivoUseCase,
    private readonly listarAtivos: ListarAtivosUseCase,
    private readonly editarAtivo: EditarAtivoUseCase,
    private readonly excluirAtivo: ExcluirAtivoUseCase,
    private readonly registrarMovimento: RegistrarMovimentoCarteiraUseCase,
  ) {}

  @Post()
  async criar(@Body() body: CriarAtivoRequest): Promise<AtivoDTO> {
    try {
      return await this.criarAtivo.execute({
        tipo: body.tipo,
        descricao: body.descricao,
        quantidade: body.quantidade ?? null,
        valorUnitario: body.valorUnitario ?? null,
        valorBruto: body.valorBruto,
        rendimento: body.rendimento,
      });
    } catch (error) {
      throw mapErroInvestimentos(error);
    }
  }

  @Get()
  async listar(): Promise<AtivoDTO[]> {
    return this.listarAtivos.execute();
  }

  @Put(':id')
  async editar(
    @Param('id') id: string,
    @Body() body: AtualizarAtivoRequest,
  ): Promise<AtivoDTO> {
    try {
      return await this.editarAtivo.execute({
        id,
        descricao: body.descricao,
        quantidade: body.quantidade ?? null,
        valorUnitario: body.valorUnitario ?? null,
        valorBruto: body.valorBruto,
        rendimento: body.rendimento,
      });
    } catch (error) {
      throw mapErroInvestimentos(error);
    }
  }

  @Delete(':id')
  @HttpCode(204)
  async excluir(@Param('id') id: string): Promise<void> {
    try {
      await this.excluirAtivo.execute(id);
    } catch (error) {
      throw mapErroInvestimentos(error);
    }
  }

  @Post(':id/movimentos')
  async movimentar(
    @Param('id') id: string,
    @Body() body: RegistrarMovimentoCarteiraRequest,
  ): Promise<MovimentoCarteiraDTO> {
    try {
      return await this.registrarMovimento.execute({
        ativoId: id,
        tipo: body.tipo,
        valor: body.valor,
        competencia: body.competencia,
        descricao: body.descricao ?? null,
      });
    } catch (error) {
      throw mapErroInvestimentos(error);
    }
  }
}

/** Mapeia erros de domínio/aplicação de investimentos para os status HTTP da seção 5. */
export function mapErroInvestimentos(error: unknown): unknown {
  if (
    error instanceof AtivoNaoEncontradoError ||
    error instanceof MovimentoCarteiraNaoEncontradoError
  ) {
    return new NotFoundException(error.message);
  }
  if (error instanceof AtivoComMovimentosError) {
    return new ConflictException(error.message);
  }
  if (
    error instanceof AtivoInvalidoError ||
    error instanceof MovimentoCarteiraInvalidoError
  ) {
    return new BadRequestException(error.message);
  }
  return error;
}
