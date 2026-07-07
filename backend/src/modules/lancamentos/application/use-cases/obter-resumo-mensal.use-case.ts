import { Inject, Injectable } from '@nestjs/common';
import type { ResumoMensalDTO } from '@financas-pessoais/shared';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../domain/repositories/lancamento.repository';

@Injectable()
export class ObterResumoMensalUseCase {
  constructor(
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
  ) {}

  async execute(competencia: string): Promise<ResumoMensalDTO> {
    const lancamentos = await this.lancamentos.findByCompetencia(competencia);

    // Soma em centavos (inteiros) para não acumular erro de ponto flutuante.
    // Os totais consideram apenas o que já foi efetivado: lançamentos manuais
    // (sem origem em recorrência) sempre contam; ocorrências de recorrência só
    // entram quando marcadas como pagas.
    let receitasEmCentavos = 0;
    let despesasEmCentavos = 0;
    for (const lancamento of lancamentos) {
      const efetivado = lancamento.origemRegraId === null || lancamento.pago;
      if (!efetivado) continue;

      const centavos = Math.round(lancamento.valorEfetivo * 100);
      if (lancamento.tipo === 'RECEITA') {
        receitasEmCentavos += centavos;
      } else {
        despesasEmCentavos += centavos;
      }
    }

    const totalReceitas = receitasEmCentavos / 100;
    const totalDespesas = despesasEmCentavos / 100;
    return {
      competencia,
      totalReceitas,
      totalDespesas,
      saldo: (receitasEmCentavos - despesasEmCentavos) / 100,
    };
  }
}
