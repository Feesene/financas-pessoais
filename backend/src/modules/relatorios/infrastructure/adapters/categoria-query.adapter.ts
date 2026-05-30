import { Inject, Injectable } from '@nestjs/common';
import type { CategoriaDTO } from '@financas-pessoais/shared';
import {
  CATEGORIA_REPOSITORY,
  type CategoriaRepository,
} from '../../../categorias/domain/repositories/categoria.repository';
import type { CategoriaQueryPort } from '../../domain/ports/categoria-query.port';

/** Adapter (ACL) que implementa CategoriaQueryPort sobre o repositório real de P2. */
@Injectable()
export class CategoriaQueryAdapter implements CategoriaQueryPort {
  constructor(
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
  ) {}

  async listar(): Promise<CategoriaDTO[]> {
    const categorias = await this.categorias.findAll();
    return categorias.map((categoria) => ({
      id: categoria.id,
      nome: categoria.nome,
      tipo: categoria.tipo,
      cor: categoria.cor,
    }));
  }
}
