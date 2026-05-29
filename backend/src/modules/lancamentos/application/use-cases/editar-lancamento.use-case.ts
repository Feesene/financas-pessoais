import { Inject, Injectable } from '@nestjs/common';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../domain/repositories/lancamento.repository';
import { LancamentoNaoEncontradoError } from '../errors/lancamento-nao-encontrado.error';
import type {
  AtualizarLancamentoInput,
  AtualizarLancamentoOutput,
} from '../dtos/atualizar-lancamento.dto';

@Injectable()
export class EditarLancamentoUseCase {
  constructor(
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
  ) {}

  async execute(input: AtualizarLancamentoInput): Promise<AtualizarLancamentoOutput> {
    const existente = await this.lancamentos.findById(input.id);
    if (!existente) {
      throw new LancamentoNaoEncontradoError(input.id);
    }

    const atualizado = existente.atualizar({
      tipo: input.tipo,
      categoria: input.categoria,
      descricao: input.descricao ?? null,
      valor: input.valor,
      competencia: input.competencia,
    });

    await this.lancamentos.save(atualizado);

    return {
      id: atualizado.id,
      tipo: atualizado.tipo,
      categoria: atualizado.categoria,
      descricao: atualizado.descricao,
      valor: atualizado.valor,
      competencia: atualizado.competencia,
    };
  }
}
