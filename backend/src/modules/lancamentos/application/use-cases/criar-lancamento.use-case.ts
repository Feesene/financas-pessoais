import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Lancamento } from '../../domain/entities/lancamento';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../domain/repositories/lancamento.repository';
import type { CriarLancamentoInput, CriarLancamentoOutput } from '../dtos/criar-lancamento.dto';

@Injectable()
export class CriarLancamentoUseCase {
  constructor(
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
  ) {}

  async execute(input: CriarLancamentoInput): Promise<CriarLancamentoOutput> {
    const lancamento = Lancamento.criar({
      id: randomUUID(),
      tipo: input.tipo,
      categoria: input.categoria,
      descricao: input.descricao ?? null,
      valor: input.valor,
      competencia: input.competencia,
    });

    await this.lancamentos.save(lancamento);

    return {
      id: lancamento.id,
      tipo: lancamento.tipo,
      categoria: lancamento.categoria,
      descricao: lancamento.descricao,
      valor: lancamento.valor,
      competencia: lancamento.competencia,
    };
  }
}
