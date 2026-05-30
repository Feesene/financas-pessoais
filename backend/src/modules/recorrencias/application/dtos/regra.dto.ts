import type { RegraRecorrenteDTO, TipoLancamento } from '@financas-pessoais/shared';
import type { RegraRecorrente } from '../../domain/entities/regra-recorrente';

export interface CriarRegraInput {
  tipo: TipoLancamento;
  categoriaId: string;
  descricao?: string | null;
  /** Valor mensal (recorrência) ou base de cada parcela. */
  valorBase?: number;
  /** Valor total a parcelar; alternativa a `valorBase` no parcelamento. */
  valorTotal?: number;
  competenciaInicio: string;
  competenciaFim?: string | null;
  numeroParcelas?: number | null;
}

export interface EditarRegraInput extends CriarRegraInput {
  id: string;
  /** A partir de qual competência a alteração vale (edição prospectiva). */
  aPartirDe: string;
}

export function toRegraDTO(regra: RegraRecorrente): RegraRecorrenteDTO {
  return {
    id: regra.id,
    tipo: regra.tipo,
    categoriaId: regra.categoriaId,
    descricao: regra.descricao,
    valorBase: regra.valorBase,
    frequencia: regra.frequencia,
    competenciaInicio: regra.competenciaInicio,
    competenciaFim: regra.competenciaFim,
    numeroParcelas: regra.numeroParcelas,
    ativa: regra.ativa,
  };
}

/**
 * Resolve o valor a persistir em `valorBase`: para parcelamento usamos o total
 * (`valorTotal` ou `valorBase`), distribuído depois em N parcelas; para
 * recorrência, o `valorBase` mensal.
 */
export function resolverValorBase(input: CriarRegraInput): number {
  if (input.numeroParcelas != null) {
    return input.valorTotal ?? input.valorBase ?? 0;
  }
  return input.valorBase ?? 0;
}
