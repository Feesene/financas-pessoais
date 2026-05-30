import { Inject, Injectable } from '@nestjs/common';
import {
  MOVIMENTO_RESERVA_REPOSITORY,
  type MovimentoReservaRepository,
} from '../../domain/repositories/movimento-reserva.repository';
import { MovimentoNaoEncontradoError } from '../errors/movimento-nao-encontrado.error';

@Injectable()
export class ExcluirMovimentoUseCase {
  constructor(
    @Inject(MOVIMENTO_RESERVA_REPOSITORY)
    private readonly movimentos: MovimentoReservaRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const removido = await this.movimentos.delete(id);
    if (!removido) {
      throw new MovimentoNaoEncontradoError(id);
    }
  }
}
