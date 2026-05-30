import type { LancamentoDTO, TipoLancamento } from '@financas-pessoais/shared';

export interface CriarLancamentoInput {
  tipo: TipoLancamento;
  categoria: string;
  categoriaId?: string | null;
  descricao?: string | null;
  valor: number;
  competencia: string;
}

export type CriarLancamentoOutput = LancamentoDTO;
