import { Inject, Injectable } from '@nestjs/common';
import { valorNoModo, type ModoValor, type ResumoMensalDTO } from '@financas-pessoais/shared';
import {
  LANCAMENTO_REPOSITORY,
  type LancamentoRepository,
} from '../../domain/repositories/lancamento.repository';

@Injectable()
export class ObterResumoMensalUseCase {
  constructor(
    @Inject(LANCAMENTO_REPOSITORY) private readonly lancamentos: LancamentoRepository,
  ) {}

  async execute(competencia: string, modo: ModoValor = 'PREVISTO'): Promise<ResumoMensalDTO> {
    const lancamentos = await this.lancamentos.findByCompetencia(competencia);

    // Soma em centavos (inteiros) para não acumular erro de ponto flutuante.
    // `valorNoModo` é a definição única de valor agregável do sistema (ver
    // shared/lancamento.ts), a mesma usada por metas, relatórios e subtotais da
    // lista: em PREVISTO toda linha conta, em REALIZADO só o que já se moveu.
    let receitasEmCentavos = 0;
    let despesasEmCentavos = 0;
    for (const lancamento of lancamentos) {
      const centavos = Math.round(valorNoModo(lancamento, modo) * 100);
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
