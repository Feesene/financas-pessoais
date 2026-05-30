import { Inject, Injectable } from '@nestjs/common';
import { BALDE_REPOSITORY, type BaldeRepository } from '../../domain/repositories/balde.repository';
import {
  MOVIMENTO_RESERVA_REPOSITORY,
  type MovimentoReservaRepository,
} from '../../domain/repositories/movimento-reserva.repository';
import { BaldeNaoEncontradoError } from '../errors/balde-nao-encontrado.error';
import { BaldeComMovimentosError } from '../errors/balde-com-movimentos.error';

@Injectable()
export class ExcluirBaldeUseCase {
  constructor(
    @Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository,
    @Inject(MOVIMENTO_RESERVA_REPOSITORY)
    private readonly movimentos: MovimentoReservaRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existente = await this.baldes.findById(id);
    if (!existente) {
      throw new BaldeNaoEncontradoError(id);
    }

    if (await this.movimentos.existsByBaldeId(id)) {
      throw new BaldeComMovimentosError(id);
    }

    await this.baldes.delete(id);
  }
}
