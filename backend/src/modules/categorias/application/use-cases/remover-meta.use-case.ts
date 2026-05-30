import { Inject, Injectable } from '@nestjs/common';
import { META_REPOSITORY, type MetaRepository } from '../../domain/repositories/meta.repository';
import { MetaNaoEncontradaError } from '../errors/meta-nao-encontrada.error';

@Injectable()
export class RemoverMetaUseCase {
  constructor(@Inject(META_REPOSITORY) private readonly metas: MetaRepository) {}

  async execute(categoriaId: string, competencia: string): Promise<void> {
    const removida = await this.metas.delete(categoriaId, competencia);
    if (!removida) {
      throw new MetaNaoEncontradaError(categoriaId, competencia);
    }
  }
}
