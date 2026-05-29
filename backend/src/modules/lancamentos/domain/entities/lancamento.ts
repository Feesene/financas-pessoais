import type { TipoLancamento } from '@financas-pessoais/shared';
import { LancamentoInvalidoError } from '../errors/lancamento-invalido.error';

const COMPETENCIA_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface LancamentoProps {
  id: string;
  tipo: TipoLancamento;
  categoria: string;
  descricao: string | null;
  valor: number;
  competencia: string;
}

/**
 * Lançamento financeiro (receita ou despesa) de um mês de competência.
 * Encapsula as invariantes do domínio: valor positivo, categoria preenchida
 * e competência no formato AAAA-MM.
 */
export class Lancamento {
  private constructor(private readonly props: LancamentoProps) {}

  static criar(props: LancamentoProps): Lancamento {
    if (props.valor <= 0) {
      throw new LancamentoInvalidoError('O valor do lançamento deve ser maior que zero.');
    }
    if (props.categoria.trim().length === 0) {
      throw new LancamentoInvalidoError('A categoria é obrigatória.');
    }
    if (!COMPETENCIA_REGEX.test(props.competencia)) {
      throw new LancamentoInvalidoError('A competência deve estar no formato AAAA-MM.');
    }
    return new Lancamento({ ...props, categoria: props.categoria.trim() });
  }

  get id(): string {
    return this.props.id;
  }

  get tipo(): TipoLancamento {
    return this.props.tipo;
  }

  get categoria(): string {
    return this.props.categoria;
  }

  get descricao(): string | null {
    return this.props.descricao;
  }

  get valor(): number {
    return this.props.valor;
  }

  get competencia(): string {
    return this.props.competencia;
  }

  /** Valor com sinal: positivo para receita, negativo para despesa. */
  get valorComSinal(): number {
    return this.props.tipo === 'RECEITA' ? this.props.valor : -this.props.valor;
  }

  /**
   * Retorna um novo lançamento com os atributos substituídos, preservando o `id`.
   * Reaplica as invariantes via factory (substituição completa, sem patch parcial).
   */
  atualizar(props: Omit<LancamentoProps, 'id'>): Lancamento {
    return Lancamento.criar({ ...props, id: this.props.id });
  }
}
