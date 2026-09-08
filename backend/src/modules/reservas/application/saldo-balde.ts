/** Movimento reduzido ao que importa para reconstruir a linha do tempo do balde. */
export interface EfeitoNaLinhaDoTempo {
  competencia: string;
  efeitoEmCentavos: number;
}

/**
 * Percorre o saldo do balde mês a mês e devolve a primeira competência em que
 * ele ficaria negativo — null se a linha do tempo inteira for válida.
 *
 * Os efeitos são agrupados por competência antes da soma acumulada: dentro do
 * mesmo mês não há ordem entre movimentos, então um aporte e uma retirada de
 * igual valor em maio se cancelam em vez de acusar negativo transitório.
 * É a mesma regra de `ObterSaldosUseCase` (saldo ao fim da competência C),
 * aplicada a todos os meses para que uma retirada não deixe um mês futuro
 * negativo pelas costas.
 */
export function competenciaComSaldoNegativo(
  saldoInicial: number,
  efeitos: readonly EfeitoNaLinhaDoTempo[],
): { competencia: string; saldoEmCentavos: number } | null {
  const porCompetencia = new Map<string, number>();
  for (const efeito of efeitos) {
    porCompetencia.set(
      efeito.competencia,
      (porCompetencia.get(efeito.competencia) ?? 0) + efeito.efeitoEmCentavos,
    );
  }

  let acumulado = Math.round(saldoInicial * 100);
  for (const competencia of [...porCompetencia.keys()].sort()) {
    acumulado += porCompetencia.get(competencia) ?? 0;
    if (acumulado < 0) {
      return { competencia, saldoEmCentavos: acumulado };
    }
  }
  return null;
}
