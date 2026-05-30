export const COMPETENCIA_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

/** Número de meses de `inicio` até `alvo` (negativo se alvo for anterior). */
export function diferencaEmMeses(inicio: string, alvo: string): number {
  const [anoInicio, mesInicio] = inicio.split('-').map(Number);
  const [anoAlvo, mesAlvo] = alvo.split('-').map(Number);
  return (anoAlvo - anoInicio) * 12 + (mesAlvo - mesInicio);
}

/** Competência do mês imediatamente anterior (AAAA-MM). */
export function competenciaAnterior(competencia: string): string {
  let [ano, mes] = competencia.split('-').map(Number);
  mes -= 1;
  if (mes === 0) {
    mes = 12;
    ano -= 1;
  }
  return `${ano}-${String(mes).padStart(2, '0')}`;
}
