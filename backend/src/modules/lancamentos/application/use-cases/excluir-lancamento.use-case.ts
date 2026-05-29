import { Inject, Injectable } from '@nestjs/common';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../domain/repositories/lancamento.repository';
import { LancamentoNaoEncontradoError } from '../errors/lancamento-nao-encontrado.error';

@Injectable()
export class ExcluirLancamentoUseCase {
  constructor(
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const removido = await this.lancamentos.delete(id);
    if (!removido) {
      throw new LancamentoNaoEncontradoError(id);
    }
  }
}
