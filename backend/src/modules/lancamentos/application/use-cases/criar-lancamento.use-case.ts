import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { Lancamento } from '../../domain/entities/lancamento';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../domain/repositories/lancamento.repository';
import {
  CATEGORIA_REPOSITORY,
  type CategoriaRepository,
} from '../../../categorias/domain/repositories/categoria.repository';
import { CategoriaInexistenteError } from '../errors/categoria-inexistente.error';
import type { CriarLancamentoInput, CriarLancamentoOutput } from '../dtos/criar-lancamento.dto';

@Injectable()
export class CriarLancamentoUseCase {
  constructor(
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
  ) {}

  async execute(input: CriarLancamentoInput): Promise<CriarLancamentoOutput> {
    const categoriaId = input.categoriaId ?? null;
    if (categoriaId && !(await this.categorias.findById(categoriaId))) {
      throw new CategoriaInexistenteError(categoriaId);
    }

    const lancamento = Lancamento.criar({
      id: randomUUID(),
      tipo: input.tipo,
      categoria: input.categoria,
      categoriaId,
      descricao: input.descricao ?? null,
      valor: input.valor,
      competencia: input.competencia,
    });

    await this.lancamentos.save(lancamento);

    return {
      id: lancamento.id,
      tipo: lancamento.tipo,
      categoria: lancamento.categoria,
      categoriaId: lancamento.categoriaId,
      descricao: lancamento.descricao,
      valor: lancamento.valor,
      competencia: lancamento.competencia,
      origemRegraId: lancamento.origemRegraId,
      ocorrenciaIndice: lancamento.ocorrenciaIndice,
    };
  }
}
