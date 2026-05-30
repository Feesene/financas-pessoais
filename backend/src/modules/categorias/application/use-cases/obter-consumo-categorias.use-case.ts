import { Inject, Injectable } from '@nestjs/common';
import type { ConsumoCategoriaDTO } from '@financas-pessoais/shared';
import {
  CATEGORIA_REPOSITORY,
  type CategoriaRepository,
} from '../../domain/repositories/categoria.repository';
import { META_REPOSITORY, type MetaRepository } from '../../domain/repositories/meta.repository';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../../lancamentos/domain/repositories/lancamento.repository';
import { toDTO } from './criar-categoria.use-case';

@Injectable()
export class ObterConsumoCategoriasUseCase {
  constructor(
    @Inject(CATEGORIA_REPOSITORY) private readonly categorias: CategoriaRepository,
    @Inject(META_REPOSITORY) private readonly metas: MetaRepository,
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
  ) {}

  async execute(competencia: string): Promise<ConsumoCategoriaDTO[]> {
    const [categorias, metas, lancamentos] = await Promise.all([
      this.categorias.findAll(),
      this.metas.findByCompetencia(competencia),
      this.lancamentos.findByCompetencia(competencia),
    ]);

    const metaPorCategoria = new Map(metas.map((m) => [m.categoriaId, m.valor]));

    // Soma despesas em centavos por categoriaId para evitar erro de ponto flutuante.
    const gastoEmCentavos = new Map<string, number>();
    for (const lancamento of lancamentos) {
      if (lancamento.tipo !== 'DESPESA' || lancamento.categoriaId === null) continue;
      const atual = gastoEmCentavos.get(lancamento.categoriaId) ?? 0;
      gastoEmCentavos.set(lancamento.categoriaId, atual + Math.round(lancamento.valorEfetivo * 100));
    }

    return categorias
      .filter((categoria) => categoria.ehDespesa)
      .map((categoria) => {
        const gasto = (gastoEmCentavos.get(categoria.id) ?? 0) / 100;
        const meta = metaPorCategoria.get(categoria.id) ?? null;
        const percentual = meta !== null ? gasto / meta : null;
        const estourou = meta !== null && gasto > meta;
        return {
          categoria: toDTO(categoria),
          meta,
          gasto,
          percentual,
          estourou,
        };
      });
  }
}
