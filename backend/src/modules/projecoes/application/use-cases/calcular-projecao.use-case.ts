import { Injectable } from '@nestjs/common';
import type { ProjecaoParametrosDTO, ProjecaoResultadoDTO } from '@financas-pessoais/shared';
import { calcularJurosCompostos } from '../../domain/calcular-juros-compostos';
import { ParametrosInvalidosError } from '../errors/parametros-invalidos.error';

@Injectable()
export class CalcularProjecaoUseCase {
  /**
   * Valida os parâmetros e monta o resultado da projeção. Cálculo determinístico
   * e stateless: mesma entrada → mesma saída, sem I/O.
   */
  execute(parametros: ProjecaoParametrosDTO): ProjecaoResultadoDTO {
    validar(parametros);

    const anos = calcularJurosCompostos(parametros);
    const ultimo = anos[anos.length - 1];
    const totalFinalInvestido = ultimo.saldoInvestido;
    const totalFinalNaoInvestido = ultimo.saldoNaoInvestido;

    return {
      parametros,
      anos,
      totalFinalInvestido,
      totalFinalNaoInvestido,
      jurosGanhos: totalFinalInvestido - totalFinalNaoInvestido,
    };
  }
}

function validar(p: ProjecaoParametrosDTO): void {
  if (!Number.isFinite(p.entrada) || p.entrada < 0) {
    throw new ParametrosInvalidosError('entrada deve ser um número ≥ 0.');
  }
  if (!Number.isFinite(p.aporteMensal) || p.aporteMensal < 0) {
    throw new ParametrosInvalidosError('aporteMensal deve ser um número ≥ 0.');
  }
  if (!Number.isFinite(p.taxaAnual) || p.taxaAnual < 0) {
    throw new ParametrosInvalidosError('taxaAnual deve ser um número ≥ 0.');
  }
  if (!Number.isInteger(p.anos) || p.anos < 1 || p.anos > 60) {
    throw new ParametrosInvalidosError('anos deve ser um inteiro entre 1 e 60.');
  }
}
