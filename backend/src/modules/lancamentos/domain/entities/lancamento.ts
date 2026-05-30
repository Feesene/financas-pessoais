import type { TipoLancamento } from '@financas-pessoais/shared';
import { LancamentoInvalidoError } from '../errors/lancamento-invalido.error';
import { PagamentoLancamentoManualError } from '../errors/pagamento-lancamento-manual.error';

const COMPETENCIA_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface LancamentoProps {
  id: string;
  tipo: TipoLancamento;
  categoria: string;
  /** Categoria cadastrada referenciada; null enquanto não migrado (compat P1). */
  categoriaId: string | null;
  descricao: string | null;
  valor: number;
  competencia: string;
  /** Regra recorrente que originou o lançamento; null se manual (P3). */
  origemRegraId?: string | null;
  /** Índice (1-based) da ocorrência na regra; usado para idempotência e label "k/N". */
  ocorrenciaIndice?: number | null;
  /** Se a ocorrência (de recorrência) já foi paga; só pode ser true se origemRegraId !== null. */
  pago?: boolean;
  /** Valor efetivamente pago; null quando não pago. */
  valorPago?: number | null;
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

    const origemRegraId = props.origemRegraId ?? null;
    const pago = props.pago ?? false;
    if (pago && origemRegraId === null) {
      throw new PagamentoLancamentoManualError();
    }
    const valorPago = pago ? (props.valorPago ?? props.valor) : null;
    if (valorPago !== null && valorPago <= 0) {
      throw new LancamentoInvalidoError('O valor pago deve ser maior que zero.');
    }

    return new Lancamento({
      ...props,
      categoria: props.categoria.trim(),
      origemRegraId,
      ocorrenciaIndice: props.ocorrenciaIndice ?? null,
      pago,
      valorPago,
    });
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

  get categoriaId(): string | null {
    return this.props.categoriaId;
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

  get origemRegraId(): string | null {
    return this.props.origemRegraId ?? null;
  }

  get ocorrenciaIndice(): number | null {
    return this.props.ocorrenciaIndice ?? null;
  }

  get pago(): boolean {
    return this.props.pago ?? false;
  }

  get valorPago(): number | null {
    return this.props.valorPago ?? null;
  }

  /** Valor que rege as agregações: o pago quando marcado, senão o previsto. */
  get valorEfetivo(): number {
    return this.pago && this.valorPago !== null ? this.valorPago : this.props.valor;
  }

  /** Valor com sinal: positivo para receita, negativo para despesa. */
  get valorComSinal(): number {
    return this.props.tipo === 'RECEITA' ? this.props.valor : -this.props.valor;
  }

  /** valorEfetivo com sinal: positivo para receita, negativo para despesa. */
  get valorEfetivoComSinal(): number {
    return this.props.tipo === 'RECEITA' ? this.valorEfetivo : -this.valorEfetivo;
  }

  /**
   * Retorna um novo lançamento com os atributos substituídos, preservando o `id`.
   * Reaplica as invariantes via factory (substituição completa, sem patch parcial).
   * A origem (regra/ocorrência) e o estado de pagamento são preservados: edição
   * manual não desvincula da regra nem altera `pago`/`valorPago`.
   */
  atualizar(props: Omit<LancamentoProps, 'id'>): Lancamento {
    return Lancamento.criar({
      ...props,
      id: this.props.id,
      origemRegraId: props.origemRegraId ?? this.props.origemRegraId ?? null,
      ocorrenciaIndice: props.ocorrenciaIndice ?? this.props.ocorrenciaIndice ?? null,
      pago: this.pago,
      valorPago: this.valorPago,
    });
  }

  /**
   * Registra (ou remove) o pagamento da ocorrência, preservando o `id` e demais
   * atributos. Só ocorrências de recorrência (`origemRegraId !== null`) podem ser
   * pagas; `pago=true` sem valor assume o previsto; `pago=false` zera o valorPago.
   */
  registrarPagamento(pago: boolean, valorPago?: number | null): Lancamento {
    if (this.origemRegraId === null) {
      throw new PagamentoLancamentoManualError();
    }
    return Lancamento.criar({
      ...this.props,
      pago,
      valorPago: pago ? (valorPago ?? this.props.valor) : null,
    });
  }
}
