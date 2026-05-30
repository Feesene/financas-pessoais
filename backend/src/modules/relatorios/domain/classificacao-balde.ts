export type CategoriaBalde = 'POUPANCA' | 'VIAGEM' | null;

/** Remove acentos e baixa caixa para comparação tolerante (ex.: "Poupança" → "poupanca"). */
function normalizar(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Classifica um balde como POUPANCA/VIAGEM pelo nome (D2): P4 não modela categoria de balde.
 * Default: nome contendo "poupanc" → POUPANCA; contendo "viagem" → VIAGEM; senão null.
 */
export function classificarBalde(nome: string): CategoriaBalde {
  const normalizado = normalizar(nome);
  if (normalizado.includes('poupanc')) return 'POUPANCA';
  if (normalizado.includes('viagem')) return 'VIAGEM';
  return null;
}
