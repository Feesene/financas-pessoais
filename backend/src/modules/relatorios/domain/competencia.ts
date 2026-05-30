export const COMPETENCIA_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isCompetenciaValida(competencia: string): boolean {
  return COMPETENCIA_REGEX.test(competencia);
}

/** Próxima competência (mês seguinte) no formato AAAA-MM. */
export function competenciaSeguinte(competencia: string): string {
  let [ano, mes] = competencia.split('-').map(Number);
  mes += 1;
  if (mes === 13) {
    mes = 1;
    ano += 1;
  }
  return `${ano}-${String(mes).padStart(2, '0')}`;
}

/**
 * Lista contínua de competências de `de` até `ate` (inclusive), em ordem.
 * Pressupõe `de` ≤ `ate`; ambos válidos no formato AAAA-MM.
 */
export function intervaloCompetencias(de: string, ate: string): string[] {
  const competencias: string[] = [];
  let atual = de;
  while (atual <= ate) {
    competencias.push(atual);
    atual = competenciaSeguinte(atual);
  }
  return competencias;
}
