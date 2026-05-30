import { Inject, Injectable } from '@nestjs/common';
import type { CategoriaDTO } from '@financas-pessoais/shared';
import {
  CATEGORIA_REPOSITORY,
  type CategoriaRepository,
} from '../../domain/repositories/categoria.repository';
import { CategoriaNaoEncontradaError } from '../errors/categoria-nao-encontrada.error';
import { CategoriaDuplicadaError } from '../errors/categoria-duplicada.error';
import { toDTO } from './criar-categoria.use-case';

export interface EditarCategoriaInput {
  id: string;
  nome: string;
  cor?: string | null;
}

@Injectable()
export class EditarCategoriaUseCase {
  constructor(
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
  ) {}

  async execute(input: EditarCategoriaInput): Promise<CategoriaDTO> {
    const existente = await this.categorias.findById(input.id);
    if (!existente) {
      throw new CategoriaNaoEncontradaError(input.id);
    }

    const atualizada = existente.atualizar({ nome: input.nome, cor: input.cor ?? null });

    const conflito = await this.categorias.findByNomeETipo(atualizada.nome, atualizada.tipo);
    if (conflito && conflito.id !== atualizada.id) {
      throw new CategoriaDuplicadaError(atualizada.nome, atualizada.tipo);
    }

    await this.categorias.save(atualizada);
    return toDTO(atualizada);
  }
}
