import { Inject, Injectable } from '@nestjs/common';
import {
  MOVIMENTO_CARTEIRA_REPOSITORY,
  type MovimentoCarteiraRepository,
} from '../../domain/repositories/movimento-carteira.repository';
import { MovimentoCarteiraNaoEncontradoError } from '../errors/movimento-carteira-nao-encontrado.error';

@Injectable()
export class ExcluirMovimentoCarteiraUseCase {
  constructor(
    @Inject(MOVIMENTO_CARTEIRA_REPOSITORY)
    private readonly movimentos: MovimentoCarteiraRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const removido = await this.movimentos.delete(id);
    if (!removido) {
      throw new MovimentoCarteiraNaoEncontradoError(id);
    }
  }
}
