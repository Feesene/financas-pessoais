import { Inject, Injectable } from '@nestjs/common';
import { ATIVO_REPOSITORY, type AtivoRepository } from '../../domain/repositories/ativo.repository';
import {
  MOVIMENTO_CARTEIRA_REPOSITORY,
  type MovimentoCarteiraRepository,
} from '../../domain/repositories/movimento-carteira.repository';
import { AtivoNaoEncontradoError } from '../errors/ativo-nao-encontrado.error';
import { AtivoComMovimentosError } from '../errors/ativo-com-movimentos.error';

@Injectable()
export class ExcluirAtivoUseCase {
  constructor(
    @Inject(ATIVO_REPOSITORY) private readonly ativos: AtivoRepository,
    @Inject(MOVIMENTO_CARTEIRA_REPOSITORY)
    private readonly movimentos: MovimentoCarteiraRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existente = await this.ativos.findById(id);
    if (!existente) {
      throw new AtivoNaoEncontradoError(id);
    }

    if (await this.movimentos.existsByAtivoId(id)) {
      throw new AtivoComMovimentosError(id);
    }

    await this.ativos.delete(id);
  }
}
