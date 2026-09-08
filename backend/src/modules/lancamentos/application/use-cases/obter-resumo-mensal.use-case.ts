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
    // Todo lançamento da competência conta, pago ou não — `valorEfetivo` é a
    // definição única de valor agregável do sistema (ver shared/lancamento.ts),
    // a mesma usada por metas, relatórios e subtotais da lista.
    let receitasEmCentavos = 0;
    let despesasEmCentavos = 0;
    for (const lancamento of lancamentos) {
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
