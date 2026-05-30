import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import type { CategoriaDTO, TipoLancamento } from '@financas-pessoais/shared';
import { Categoria } from '../../domain/entities/categoria';
import {
  CATEGORIA_REPOSITORY,
  type CategoriaRepository,
} from '../../domain/repositories/categoria.repository';
import { CategoriaDuplicadaError } from '../errors/categoria-duplicada.error';

export interface CriarCategoriaInput {
  nome: string;
  tipo: TipoLancamento;
  cor?: string | null;
}

@Injectable()
export class CriarCategoriaUseCase {
  constructor(
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
  ) {}

  async execute(input: CriarCategoriaInput): Promise<CategoriaDTO> {
    const categoria = Categoria.criar({
      id: randomUUID(),
      nome: input.nome,
      tipo: input.tipo,
      cor: input.cor ?? null,
    });

    const existente = await this.categorias.findByNomeETipo(categoria.nome, categoria.tipo);
    if (existente) {
      throw new CategoriaDuplicadaError(categoria.nome, categoria.tipo);
    }

    await this.categorias.save(categoria);
    return toDTO(categoria);
  }
}

export function toDTO(categoria: Categoria): CategoriaDTO {
  return {
    id: categoria.id,
    nome: categoria.nome,
    tipo: categoria.tipo,
    cor: categoria.cor,
  };
}
