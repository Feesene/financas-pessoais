import { CotacaoAtivoInvalidaError } from '../errors/cotacao-ativo-invalida.error';

const COMPETENCIA_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface CotacaoAtivoProps {
  id: string;
  ativoId: string;
  competencia: string;
  /** Preço unitário do mês (ACAO/FII); null para fundos. */
  valorUnitario: number | null;
  /** Valor bruto do mês (FUNDO); null para ações/FIIs. */
  valorBruto: number | null;
}

/**
 * Snapshot do preço/valor de um ativo numa competência. Estruturalmente, exatamente
 * um dos campos (`valorUnitario` para ação/FII; `valorBruto` para fundo) é preenchido
 * e ≥ 0; a coerência com o tipo do ativo é garantida no use case (que conhece o `Ativo`).
 */
export class CotacaoAtivo {
  private constructor(private readonly props: CotacaoAtivoProps) {}

  static criar(props: CotacaoAtivoProps): CotacaoAtivo {
    if (!COMPETENCIA_REGEX.test(props.competencia)) {
      throw new CotacaoAtivoInvalidaError('A competência deve estar no formato AAAA-MM.');
    }

    const temUnitario = props.valorUnitario !== null;
    const temBruto = props.valorBruto !== null;
    if (temUnitario === temBruto) {
      throw new CotacaoAtivoInvalidaError(
        'Informe exatamente um valor: valorUnitario (ação/FII) ou valorBruto (fundo).',
      );
    }

    const valor = temUnitario ? props.valorUnitario! : props.valorBruto!;
    if (valor < 0) {
      throw new CotacaoAtivoInvalidaError('O valor da cotação não pode ser negativo.');
    }

    return new CotacaoAtivo(props);
  }

  get id(): string {
    return this.props.id;
  }

  get ativoId(): string {
    return this.props.ativoId;
  }

  get competencia(): string {
    return this.props.competencia;
  }

  get valorUnitario(): number | null {
    return this.props.valorUnitario;
  }

  get valorBruto(): number | null {
    return this.props.valorBruto;
  }
}
