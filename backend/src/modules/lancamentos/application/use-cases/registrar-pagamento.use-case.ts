import { Inject, Injectable } from '@nestjs/common';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../domain/repositories/lancamento.repository';
import { LancamentoNaoEncontradoError } from '../errors/lancamento-nao-encontrado.error';
import type {
  RegistrarPagamentoInput,
  RegistrarPagamentoOutput,
} from '../dtos/registrar-pagamento.dto';

@Injectable()
export class RegistrarPagamentoUseCase {
  constructor(
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
  ) {}

  async execute(input: RegistrarPagamentoInput): Promise<RegistrarPagamentoOutput> {
    const existente = await this.lancamentos.findById(input.id);
    if (!existente) {
      throw new LancamentoNaoEncontradoError(input.id);
    }

    const atualizado = existente.registrarPagamento(input.pago, input.valorPago ?? undefined);
    await this.lancamentos.save(atualizado);

    return {
      id: atualizado.id,
      tipo: atualizado.tipo,
      categoria: atualizado.categoria,
      categoriaId: atualizado.categoriaId,
      descricao: atualizado.descricao,
      valor: atualizado.valor,
      competencia: atualizado.competencia,
      origemRegraId: atualizado.origemRegraId,
      ocorrenciaIndice: atualizado.ocorrenciaIndice,
      pago: atualizado.pago,
      valorPago: atualizado.valorPago,
    };
  }
}
