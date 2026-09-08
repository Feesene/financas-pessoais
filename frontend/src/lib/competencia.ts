const COMPETENCIA_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

/** Monta AAAA-MM a partir de ano e mês (1-12). */
export function formatarCompetencia(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}`;
}

export function isCompetenciaValida(competencia: string): boolean {
  return COMPETENCIA_REGEX.test(competencia);
}

/** Competência do mês corrente no formato AAAA-MM. */
export function competenciaAtual(): string {
  const agora = new Date();
  return formatarCompetencia(agora.getFullYear(), agora.getMonth() + 1);
}

/** Decompõe AAAA-MM em ano e mês (1-12). */
export function parseCompetencia(competencia: string): { ano: number; mes: number } {
  const [ano, mes] = competencia.split('-');
  return { ano: Number(ano), mes: Number(mes) };
}

export function mesAnterior(competencia: string): string {
  const { ano, mes } = parseCompetencia(competencia);
  return mes === 1 ? formatarCompetencia(ano - 1, 12) : formatarCompetencia(ano, mes - 1);
}

export function mesSeguinte(competencia: string): string {
  const { ano, mes } = parseCompetencia(competencia);
  return mes === 12 ? formatarCompetencia(ano + 1, 1) : formatarCompetencia(ano, mes + 1);
}

/** Rótulo legível, ex.: "2026-05" -> "Maio de 2026". */
export function competenciaLabel(competencia: string): string {
  const { ano, mes } = parseCompetencia(competencia);
  return `${MESES[mes - 1]} de ${ano}`;
}
