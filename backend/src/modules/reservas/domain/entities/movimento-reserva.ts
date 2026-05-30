import type { TipoMovimentoReserva } from '@financas-pessoais/shared';
import { MovimentoInvalidoError } from '../errors/movimento-invalido.error';

const COMPETENCIA_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const TIPOS: TipoMovimentoReserva[] = ['APORTE', 'RETIRADA'];

export interface MovimentoReservaProps {
  id: string;
  baldeId: string;
  tipo: TipoMovimentoReserva;
  valor: number;
  competencia: string;
  descricao: string | null;
  /** Timestamp ISO de criação. Gerado no `criar()` quando ausente; imutável. */
  criadoEm?: string;
}

interface MovimentoReservaState extends Required<MovimentoReservaProps> {}

/**
 * Movimento de reserva: aporte (entrada) ou retirada (saída) de um balde.
 * Invariantes: valor > 0, competência no formato AAAA-MM e tipo APORTE|RETIRADA.
 */
export class MovimentoReserva {
  private constructor(private readonly props: MovimentoReservaState) {}

  static criar(props: MovimentoReservaProps): MovimentoReserva {
    if (!TIPOS.includes(props.tipo)) {
      throw new MovimentoInvalidoError('O tipo do movimento deve ser APORTE ou RETIRADA.');
    }
    if (props.valor <= 0) {
      throw new MovimentoInvalidoError('O valor do movimento deve ser maior que zero.');
    }
    if (!COMPETENCIA_REGEX.test(props.competencia)) {
      throw new MovimentoInvalidoError('A competência deve estar no formato AAAA-MM.');
    }
    const descricao = props.descricao?.trim() ? props.descricao.trim() : null;
    const criadoEm = props.criadoEm ?? new Date().toISOString();
    return new MovimentoReserva({ ...props, descricao, criadoEm });
  }

  get id(): string {
    return this.props.id;
  }

  get baldeId(): string {
    return this.props.baldeId;
  }

  get tipo(): TipoMovimentoReserva {
    return this.props.tipo;
  }

  get valor(): number {
    return this.props.valor;
  }

  get competencia(): string {
    return this.props.competencia;
  }

  get descricao(): string | null {
    return this.props.descricao;
  }

  get criadoEm(): string {
    return this.props.criadoEm;
  }

  /** Efeito no saldo em centavos: positivo para aporte, negativo para retirada. */
  get efeitoEmCentavos(): number {
    const centavos = Math.round(this.props.valor * 100);
    return this.props.tipo === 'APORTE' ? centavos : -centavos;
  }

  /** Retorna um novo movimento com campos substituídos, preservando id e baldeId. */
  atualizar(props: {
    tipo: TipoMovimentoReserva;
    valor: number;
    competencia: string;
    descricao: string | null;
  }): MovimentoReserva {
    return MovimentoReserva.criar({
      id: this.props.id,
      baldeId: this.props.baldeId,
      criadoEm: this.props.criadoEm,
      ...props,
    });
  }
}
