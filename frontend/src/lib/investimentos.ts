import type { TipoAtivo, TipoMovimentoCarteira } from '@financas-pessoais/shared';

/** Rótulo legível de uma classe de ativo. */
export const TIPO_ATIVO_LABEL: Record<TipoAtivo, string> = {
  ACAO: 'Ações',
  FII: 'Fundos imobiliários',
  FUNDO: 'Fundos',
};

/** Rótulo no singular para uso em formulários. */
export const TIPO_ATIVO_SINGULAR: Record<TipoAtivo, string> = {
  ACAO: 'Ação',
  FII: 'Fundo imobiliário',
  FUNDO: 'Fundo',
};

/** true quando o ativo é cotado por quantidade × valor unitário (ação/FII). */
export function ehAtivoCotado(tipo: TipoAtivo): boolean {
  return tipo === 'ACAO' || tipo === 'FII';
}

export const TIPO_MOVIMENTO_LABEL: Record<TipoMovimentoCarteira, string> = {
  ENTRADA: 'Entrada',
  SAIDA: 'Saída',
  RENDIMENTO: 'Rendimento',
};
