import { Inject, Injectable } from '@nestjs/common';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../domain/repositories/lancamento.repository';
import {
  CATEGORIA_REPOSITORY,
  type CategoriaRepository,
} from '../../../categorias/domain/repositories/categoria.repository';
import { LancamentoNaoEncontradoError } from '../errors/lancamento-nao-encontrado.error';
import { CategoriaInexistenteError } from '../errors/categoria-inexistente.error';
import type {
  AtualizarLancamentoInput,
  AtualizarLancamentoOutput,
} from '../dtos/atualizar-lancamento.dto';

@Injectable()
export class EditarLancamentoUseCase {
  constructor(
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
  ) {}

  async execute(input: AtualizarLancamentoInput): Promise<AtualizarLancamentoOutput> {
    const existente = await this.lancamentos.findById(input.id);
    if (!existente) {
      throw new LancamentoNaoEncontradoError(input.id);
    }

    const categoriaId = input.categoriaId ?? null;
    if (categoriaId && !(await this.categorias.findById(categoriaId))) {
      throw new CategoriaInexistenteError(categoriaId);
    }

    const atualizado = existente.atualizar({
      tipo: input.tipo,
      categoria: input.categoria,
      categoriaId,
      descricao: input.descricao ?? null,
      valor: input.valor,
      competencia: input.competencia,
    });

    await this.lancamentos.save(atualizado);

    return {
      id: atualizado.id,
      tipo: atualizado.tipo,
      categoria: atualizado.categoria,
      categoriaId: atualizado.categoriaId,
      descricao: atualizado.descricao,
      valor: atualizado.valor,
      competencia: atualizado.competencia,
      origemRegraId: atualizado.origemRegraId,
      ocorrenciaIndice: atualizado.ocorrenciaIndice,
    };
  }
}
