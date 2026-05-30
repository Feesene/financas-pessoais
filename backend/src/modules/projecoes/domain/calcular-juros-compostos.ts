import type { ProjecaoAnoDTO, ProjecaoParametrosDTO } from '@financas-pessoais/shared';

/**
 * Calcula a projeção de juros compostos de forma pura e determinística.
 *
 * Capitalização mensal com taxa mensal equivalente `(1 + taxaAnual)^(1/12) − 1`;
 * aporte aplicado ao fim de cada mês (annuity ordinary). No mês 0 ambos os saldos
 * valem `entrada`. Agrega os resultados ao fim de cada ano (D2, D3 da spec).
 *
 * Pressupõe parâmetros já validados — não lança erros.
 */
export function calcularJurosCompostos(parametros: ProjecaoParametrosDTO): ProjecaoAnoDTO[] {
  const { entrada, aporteMensal, taxaAnual, anos } = parametros;
  const taxaMensal = Math.pow(1 + taxaAnual, 1 / 12) - 1;

  const linhas: ProjecaoAnoDTO[] = [];
  let saldoInvestido = entrada;

  for (let mes = 1; mes <= anos * 12; mes += 1) {
    saldoInvestido = saldoInvestido * (1 + taxaMensal) + aporteMensal;

    if (mes % 12 === 0) {
      const ano = mes / 12;
      const totalAportado = entrada + aporteMensal * mes;
      linhas.push({
        ano,
        totalAportado,
        saldoNaoInvestido: totalAportado,
        saldoInvestido,
        jurosAcumulados: saldoInvestido - totalAportado,
      });
    }
  }

  return linhas;
}
