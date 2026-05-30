import { Inject, Injectable } from '@nestjs/common';
import type { CategoriaDTO } from '@financas-pessoais/shared';
import {
  CATEGORIA_REPOSITORY,
  type CategoriaRepository,
} from '../../domain/repositories/categoria.repository';
import { toDTO } from './criar-categoria.use-case';

@Injectable()
export class ListarCategoriasUseCase {
  constructor(
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
  ) {}

  async execute(): Promise<CategoriaDTO[]> {
    const categorias = await this.categorias.findAll();
    return categorias.map(toDTO);
  }
}
