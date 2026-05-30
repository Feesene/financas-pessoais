import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { MetaMensalDTO } from '@financas-pessoais/shared';
import { MetaMensal } from '../../domain/entities/meta-mensal';
import {
  CATEGORIA_REPOSITORY,
  type CategoriaRepository,
} from '../../domain/repositories/categoria.repository';
import { META_REPOSITORY, type MetaRepository } from '../../domain/repositories/meta.repository';
import { CategoriaNaoEncontradaError } from '../errors/categoria-nao-encontrada.error';
import { MetaInvalidaError } from '../../domain/errors/meta-invalida.error';

export interface DefinirMetaInput {
  categoriaId: string;
  competencia: string;
  valor: number;
}

@Injectable()
export class DefinirMetaUseCase {
  constructor(
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
    @Inject(META_REPOSITORY) private readonly metas: MetaRepository,
  ) {}

  async execute(input: DefinirMetaInput): Promise<MetaMensalDTO> {
    const categoria = await this.categorias.findById(input.categoriaId);
    if (!categoria) {
      throw new CategoriaNaoEncontradaError(input.categoriaId);
    }
    if (!categoria.ehDespesa) {
      throw new MetaInvalidaError('Meta só pode ser definida para categorias de despesa.');
    }

    const existente = await this.metas.findByCategoriaECompetencia(
      input.categoriaId,
      input.competencia,
    );

    const meta = MetaMensal.criar({
      id: existente?.id ?? randomUUID(),
      categoriaId: input.categoriaId,
      competencia: input.competencia,
      valor: input.valor,
    });

    await this.metas.save(meta);

    return {
      id: meta.id,
      categoriaId: meta.categoriaId,
      competencia: meta.competencia,
      valor: meta.valor,
    };
  }
}
