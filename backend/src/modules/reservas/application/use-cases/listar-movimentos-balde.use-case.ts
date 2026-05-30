import { Inject, Injectable } from '@nestjs/common';
import type { MovimentoReservaDTO } from '@financas-pessoais/shared';
import { BALDE_REPOSITORY, type BaldeRepository } from '../../domain/repositories/balde.repository';
import {
  MOVIMENTO_RESERVA_REPOSITORY,
  type MovimentoReservaRepository,
} from '../../domain/repositories/movimento-reserva.repository';
import { BaldeNaoEncontradoError } from '../errors/balde-nao-encontrado.error';
import { movimentoToDTO } from './registrar-movimento.use-case';

@Injectable()
export class ListarMovimentosBaldeUseCase {
  constructor(
    @Inject(BALDE_REPOSITORY) private readonly baldes: BaldeRepository,
    @Inject(MOVIMENTO_RESERVA_REPOSITORY)
    private readonly movimentos: MovimentoReservaRepository,
  ) {}

  /** Lista os movimentos de um balde, do mais recente para o mais antigo. */
  async execute(baldeId: string): Promise<MovimentoReservaDTO[]> {
    const balde = await this.baldes.findById(baldeId);
    if (!balde) {
      throw new BaldeNaoEncontradoError(baldeId);
    }

    const movimentos = await this.movimentos.findByBaldeId(baldeId);
    return movimentos
      .sort((a, b) => b.criadoEm.localeCompare(a.criadoEm))
      .map(movimentoToDTO);
  }
}
