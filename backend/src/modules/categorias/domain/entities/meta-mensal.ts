import { MetaInvalidaError } from '../errors/meta-invalida.error';

const COMPETENCIA_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;

export interface MetaMensalProps {
  id: string;
  categoriaId: string;
  competencia: string;
  valor: number;
}

/**
 * Meta mensal de gasto de uma categoria de despesa, por competência.
 * Invariantes: valor > 0 e competência no formato AAAA-MM.
 * A restrição "só categoria de despesa" é aplicada no use case (precisa do tipo da categoria).
 */
export class MetaMensal {
  private constructor(private readonly props: MetaMensalProps) {}

  static criar(props: MetaMensalProps): MetaMensal {
    if (props.valor <= 0) {
      throw new MetaInvalidaError('O valor da meta deve ser maior que zero.');
    }
    if (!COMPETENCIA_REGEX.test(props.competencia)) {
      throw new MetaInvalidaError('A competência deve estar no formato AAAA-MM.');
    }
    return new MetaMensal({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get categoriaId(): string {
    return this.props.categoriaId;
  }

  get competencia(): string {
    return this.props.competencia;
  }

  get valor(): number {
    return this.props.valor;
  }
}
