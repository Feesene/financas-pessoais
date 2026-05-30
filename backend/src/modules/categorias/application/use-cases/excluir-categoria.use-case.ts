import { Inject, Injectable } from '@nestjs/common';
import {
  CATEGORIA_REPOSITORY,
  type CategoriaRepository,
} from '../../domain/repositories/categoria.repository';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../../lancamentos/domain/repositories/lancamento.repository';
import { CategoriaNaoEncontradaError } from '../errors/categoria-nao-encontrada.error';
import { CategoriaEmUsoError } from '../errors/categoria-em-uso.error';

@Injectable()
export class ExcluirCategoriaUseCase {
  constructor(
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
  ) {}

  async execute(id: string): Promise<void> {
    const existente = await this.categorias.findById(id);
    if (!existente) {
      throw new CategoriaNaoEncontradaError(id);
    }

    if (await this.lancamentos.existsByCategoriaId(id)) {
      throw new CategoriaEmUsoError(id);
    }

    await this.categorias.delete(id);
  }
}
