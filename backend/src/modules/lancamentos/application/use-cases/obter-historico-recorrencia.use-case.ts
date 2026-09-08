import { Inject, Injectable } from '@nestjs/common';
import type { HistoricoRecorrenciaDTO } from '@financas-pessoais/shared';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../domain/repositories/lancamento.repository';

/** Histórico das ocorrências já materializadas de uma regra recorrente. */
@Injectable()
export class ObterHistoricoRecorrenciaUseCase {
  constructor(@Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository) {}

  async execute(regraId: string): Promise<HistoricoRecorrenciaDTO> {
    const ocorrencias = await this.lancamentos.findByOrigemRegraId(regraId);

    return {
      regraId,
      // Da mais recente para a mais antiga: o mês corrente é o que mais interessa.
      ocorrencias: [...ocorrencias].reverse().map((l) => ({
        id: l.id,
        tipo: l.tipo,
        categoria: l.categoria,
        categoriaId: l.categoriaId,
        descricao: l.descricao,
        valor: l.valor,
        competencia: l.competencia,
        origemRegraId: l.origemRegraId,
        ocorrenciaIndice: l.ocorrenciaIndice,
        pago: l.pago,
        valorPago: l.valorPago,
      })),
      totalPrevisto: arredondar(ocorrencias.reduce((soma, l) => soma + l.valor, 0)),
      totalPago: arredondar(ocorrencias.reduce((soma, l) => soma + (l.valorPago ?? 0), 0)),
      quantidadePagas: ocorrencias.filter((l) => l.pago).length,
    };
  }
}

function arredondar(valor: number): number {
  return Number(valor.toFixed(2));
}
