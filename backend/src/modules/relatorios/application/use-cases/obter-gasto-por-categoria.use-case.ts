import { Inject, Injectable } from '@nestjs/common';
import type { GastoPorCategoriaItemDTO } from '@financas-pessoais/shared';
import {
  CATEGORIA_QUERY_PORT,
  type CategoriaQueryPort,
} from '../../domain/ports/categoria-query.port';
import {
  LANCAMENTO_QUERY_PORT,
  type LancamentoQueryPort,
} from '../../domain/ports/lancamento-query.port';
import { validarIntervalo } from '../validar-intervalo';

@Injectable()
export class ObterGastoPorCategoriaUseCase {
  constructor(
    @Inject(LANCAMENTO_QUERY_PORT) private readonly lancamentos: LancamentoQueryPort,
    @Inject(CATEGORIA_QUERY_PORT) private readonly categorias: CategoriaQueryPort,
  ) {}

  /**
   * Agrega despesas por categoria no período e calcula a participação (0..1) sobre o total
   * de despesas. Mostra apenas categorias com gasto > 0 (D4), ordenadas desc por total.
   */
  async execute(de: string, ate: string): Promise<GastoPorCategoriaItemDTO[]> {
    validarIntervalo(de, ate);

    const [despesas, categorias] = await Promise.all([
      this.lancamentos.somarDespesaPorCategoria(de, ate),
      this.categorias.listar(),
    ]);

    const totalCentavos = despesas.reduce((soma, d) => soma + Math.round(d.total * 100), 0);
    const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));

    const itens: GastoPorCategoriaItemDTO[] = [];
    for (const despesa of despesas) {
      if (despesa.categoriaId === null || despesa.total <= 0) continue;
      const categoria = categoriaPorId.get(despesa.categoriaId);
      if (!categoria) continue;
      const itemCentavos = Math.round(despesa.total * 100);
      itens.push({
        categoria,
        total: itemCentavos / 100,
        percentual: totalCentavos > 0 ? itemCentavos / totalCentavos : 0,
      });
    }

    return itens.sort((a, b) => b.total - a.total);
  }
}
