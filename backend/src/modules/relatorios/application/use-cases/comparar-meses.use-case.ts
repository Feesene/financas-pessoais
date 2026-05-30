import { Inject, Injectable } from '@nestjs/common';
import type {
  ComparacaoCategoriaItemDTO,
  ComparacaoMesesDTO,
} from '@financas-pessoais/shared';
import {
  CATEGORIA_QUERY_PORT,
  type CategoriaQueryPort,
} from '../../domain/ports/categoria-query.port';
import {
  LANCAMENTO_QUERY_PORT,
  type LancamentoQueryPort,
} from '../../domain/ports/lancamento-query.port';
import { validarCompetencia } from '../validar-intervalo';

@Injectable()
export class CompararMesesUseCase {
  constructor(
    @Inject(LANCAMENTO_QUERY_PORT) private readonly lancamentos: LancamentoQueryPort,
    @Inject(CATEGORIA_QUERY_PORT) private readonly categorias: CategoriaQueryPort,
  ) {}

  /**
   * Compara, por categoria, o gasto do mês A com o do mês B: variação absoluta e percentual.
   * variacaoPct é null quando gastoA = 0 (evita divisão por zero — edge case 4).
   */
  async execute(a: string, b: string): Promise<ComparacaoMesesDTO> {
    validarCompetencia(a, 'A');
    validarCompetencia(b, 'B');

    const [despesasA, despesasB, categorias] = await Promise.all([
      this.lancamentos.somarDespesaPorCategoria(a, a),
      this.lancamentos.somarDespesaPorCategoria(b, b),
      this.categorias.listar(),
    ]);

    const centavosA = mapearCentavosPorCategoria(despesasA);
    const centavosB = mapearCentavosPorCategoria(despesasB);
    const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));

    const idsComGasto = new Set<string>([...centavosA.keys(), ...centavosB.keys()]);
    const itens: ComparacaoCategoriaItemDTO[] = [];
    for (const categoriaId of idsComGasto) {
      const categoria = categoriaPorId.get(categoriaId);
      if (!categoria) continue;
      const gastoACentavos = centavosA.get(categoriaId) ?? 0;
      const gastoBCentavos = centavosB.get(categoriaId) ?? 0;
      const variacaoCentavos = gastoBCentavos - gastoACentavos;
      itens.push({
        categoria,
        gastoA: gastoACentavos / 100,
        gastoB: gastoBCentavos / 100,
        variacao: variacaoCentavos / 100,
        variacaoPct: gastoACentavos === 0 ? null : variacaoCentavos / gastoACentavos,
      });
    }

    itens.sort((x, y) => Math.max(y.gastoA, y.gastoB) - Math.max(x.gastoA, x.gastoB));
    return { a, b, itens };
  }
}

/** Soma despesas (em centavos) por categoriaId, ignorando lançamentos sem categoria. */
function mapearCentavosPorCategoria(
  despesas: { categoriaId: string | null; total: number }[],
): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const despesa of despesas) {
    if (despesa.categoriaId === null || despesa.total <= 0) continue;
    mapa.set(despesa.categoriaId, Math.round(despesa.total * 100));
  }
  return mapa;
}
