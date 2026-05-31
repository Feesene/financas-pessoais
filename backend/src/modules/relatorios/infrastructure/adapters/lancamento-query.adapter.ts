import { Inject, Injectable } from '@nestjs/common';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../../lancamentos/domain/repositories/lancamento.repository';
import { intervaloCompetencias } from '../../domain/competencia';
import type {
  DespesaPorCategoria,
  LancamentoQueryPort,
  PrevistoPagoCompetencia,
  SomaTipoCompetencia,
} from '../../domain/ports/lancamento-query.port';

/** Adapter (ACL) que implementa LancamentoQueryPort sobre o repositório real de P1. */
@Injectable()
export class LancamentoQueryAdapter implements LancamentoQueryPort {
  constructor(
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
  ) {}

  async somarPorTipoECompetencia(de: string, ate: string): Promise<SomaTipoCompetencia[]> {
    const competencias = intervaloCompetencias(de, ate);
    const porMes = await Promise.all(
      competencias.map(async (competencia) => {
        const lancamentos = await this.lancamentos.findByCompetencia(competencia);
        if (lancamentos.length === 0) return null;
        let receitasCentavos = 0;
        let despesasCentavos = 0;
        for (const lancamento of lancamentos) {
          const centavos = Math.round(lancamento.valorEfetivo * 100);
          if (lancamento.tipo === 'RECEITA') receitasCentavos += centavos;
          else despesasCentavos += centavos;
        }
        return {
          competencia,
          receitas: receitasCentavos / 100,
          despesas: despesasCentavos / 100,
        };
      }),
    );
    return porMes.filter((m): m is SomaTipoCompetencia => m !== null);
  }

  async somarDespesaPorCategoria(de: string, ate: string): Promise<DespesaPorCategoria[]> {
    const competencias = intervaloCompetencias(de, ate);
    const listas = await Promise.all(
      competencias.map((competencia) => this.lancamentos.findByCompetencia(competencia)),
    );

    // Acumula em centavos por categoriaId (null para sem categoria) para evitar erro de ponto flutuante.
    const porCategoria = new Map<string | null, number>();
    for (const lancamentos of listas) {
      for (const lancamento of lancamentos) {
        if (lancamento.tipo !== 'DESPESA') continue;
        const chave = lancamento.categoriaId;
        porCategoria.set(
          chave,
          (porCategoria.get(chave) ?? 0) + Math.round(lancamento.valorEfetivo * 100),
        );
      }
    }

    return [...porCategoria.entries()].map(([categoriaId, centavos]) => ({
      categoriaId,
      total: centavos / 100,
    }));
  }

  async somarPrevistoPagoPorCompetencia(
    de: string,
    ate: string,
  ): Promise<PrevistoPagoCompetencia[]> {
    const competencias = intervaloCompetencias(de, ate);
    const porMes = await Promise.all(
      competencias.map(async (competencia) => {
        const lancamentos = await this.lancamentos.findByCompetencia(competencia);
        if (lancamentos.length === 0) return null;
        let receitasPrevisto = 0;
        let receitasPago = 0;
        let despesasPrevisto = 0;
        let despesasPago = 0;
        for (const lancamento of lancamentos) {
          const previsto = Math.round(lancamento.valor * 100);
          const pago = lancamento.pago ? Math.round(lancamento.valorEfetivo * 100) : 0;
          if (lancamento.tipo === 'RECEITA') {
            receitasPrevisto += previsto;
            receitasPago += pago;
          } else {
            despesasPrevisto += previsto;
            despesasPago += pago;
          }
        }
        return {
          competencia,
          receitasPrevisto: receitasPrevisto / 100,
          receitasPago: receitasPago / 100,
          despesasPrevisto: despesasPrevisto / 100,
          despesasPago: despesasPago / 100,
        };
      }),
    );
    return porMes.filter((m): m is PrevistoPagoCompetencia => m !== null);
  }
}
