import type { Frequencia, TipoLancamento } from '@financas-pessoais/shared';
import { RegraRecorrenteInvalidaError } from '../errors/regra-recorrente-invalida.error';
import { COMPETENCIA_REGEX, diferencaEmMeses } from '../competencia';

export interface RegraRecorrenteProps {
  id: string;
  tipo: TipoLancamento;
  categoriaId: string;
  descricao: string | null;
  /** Valor mensal (recorrência) ou valor total a parcelar (parcelamento). */
  valorBase: number;
  frequencia: Frequencia;
  competenciaInicio: string;
  competenciaFim: string | null;
  /** null = recorrência sem fim; preenchido = parcelamento de N ocorrências. */
  numeroParcelas: number | null;
  ativa: boolean;
}

/**
 * Regra que gera lançamentos recorrentes. Parcelamento é o caso especial com
 * `numeroParcelas` definido; nesse caso `valorBase` representa o valor total e é
 * distribuído em N parcelas (resíduo de arredondamento na última).
 */
export class RegraRecorrente {
  private constructor(private readonly props: RegraRecorrenteProps) {}

  static criar(props: RegraRecorrenteProps): RegraRecorrente {
    if (props.valorBase <= 0) {
      throw new RegraRecorrenteInvalidaError('O valor deve ser maior que zero.');
    }
    if (props.frequencia !== 'MENSAL') {
      throw new RegraRecorrenteInvalidaError('A frequência suportada é apenas MENSAL.');
    }
    if (!COMPETENCIA_REGEX.test(props.competenciaInicio)) {
      throw new RegraRecorrenteInvalidaError('A competência de início deve estar no formato AAAA-MM.');
    }
    if (props.competenciaFim !== null) {
      if (!COMPETENCIA_REGEX.test(props.competenciaFim)) {
        throw new RegraRecorrenteInvalidaError('A competência de fim deve estar no formato AAAA-MM.');
      }
      if (props.competenciaFim < props.competenciaInicio) {
        throw new RegraRecorrenteInvalidaError('A competência de fim não pode ser anterior ao início.');
      }
    }
    if (props.numeroParcelas !== null) {
      if (!Number.isInteger(props.numeroParcelas) || props.numeroParcelas < 1) {
        throw new RegraRecorrenteInvalidaError('O número de parcelas deve ser um inteiro >= 1.');
      }
    }
    return new RegraRecorrente({
      ...props,
      descricao: props.descricao?.trim() || null,
    });
  }

  get id(): string {
    return this.props.id;
  }

  get tipo(): TipoLancamento {
    return this.props.tipo;
  }

  get categoriaId(): string {
    return this.props.categoriaId;
  }

  get descricao(): string | null {
    return this.props.descricao;
  }

  get valorBase(): number {
    return this.props.valorBase;
  }

  get frequencia(): Frequencia {
    return this.props.frequencia;
  }

  get competenciaInicio(): string {
    return this.props.competenciaInicio;
  }

  get competenciaFim(): string | null {
    return this.props.competenciaFim;
  }

  get numeroParcelas(): number | null {
    return this.props.numeroParcelas;
  }

  get ativa(): boolean {
    return this.props.ativa;
  }

  get ehParcelamento(): boolean {
    return this.props.numeroParcelas !== null;
  }

  /** Índice (1-based) da ocorrência que cai na competência informada. */
  indiceNaCompetencia(competencia: string): number {
    return diferencaEmMeses(this.props.competenciaInicio, competencia) + 1;
  }

  /** True se a regra deve gerar ocorrência nesta competência. */
  ativaEmCompetencia(competencia: string): boolean {
    if (!this.props.ativa) {
      return false;
    }
    if (competencia < this.props.competenciaInicio) {
      return false;
    }
    if (this.props.competenciaFim !== null && competencia > this.props.competenciaFim) {
      return false;
    }
    if (this.props.numeroParcelas !== null) {
      const indice = this.indiceNaCompetencia(competencia);
      if (indice < 1 || indice > this.props.numeroParcelas) {
        return false;
      }
    }
    return true;
  }

  /** Valor da ocorrência de índice `indice` (1-based). Resíduo vai na última parcela. */
  valorDaOcorrencia(indice: number): number {
    if (this.props.numeroParcelas === null) {
      return this.props.valorBase;
    }
    const n = this.props.numeroParcelas;
    const totalCentavos = Math.round(this.props.valorBase * 100);
    const baseCentavos = Math.floor(totalCentavos / n);
    const residuoCentavos = totalCentavos - baseCentavos * n;
    const centavos = indice === n ? baseCentavos + residuoCentavos : baseCentavos;
    return centavos / 100;
  }

  /** Rótulo "k/N" para parcelamento; null para recorrência. */
  labelOcorrencia(indice: number): string | null {
    return this.props.numeroParcelas === null ? null : `${indice}/${this.props.numeroParcelas}`;
  }

  /** Nova instância encerrada (não materializa daqui em diante). */
  encerrar(competenciaFim?: string): RegraRecorrente {
    return RegraRecorrente.criar({
      ...this.props,
      ativa: false,
      competenciaFim: competenciaFim ?? this.props.competenciaFim,
    });
  }

  /** Nova instância com fim definido, preservando o restante (edição prospectiva). */
  comFim(competenciaFim: string): RegraRecorrente {
    return RegraRecorrente.criar({ ...this.props, competenciaFim });
  }
}
