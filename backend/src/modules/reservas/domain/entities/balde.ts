import { BaldeInvalidoError } from '../errors/balde-invalido.error';

const COR_HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const NOME_MAX = 80;

export interface BaldeProps {
  id: string;
  nome: string;
  saldoInicial: number;
  cor: string | null;
}

/**
 * Balde = objetivo de reserva (ex.: "Viagem", "Reserva de emergência").
 * Invariantes: nome obrigatório (≤ 80), saldoInicial ≥ 0 e cor, se presente, em hex.
 * A unicidade do nome é garantida na borda de persistência/aplicação.
 */
export class Balde {
  private constructor(private readonly props: BaldeProps) {}

  static criar(props: BaldeProps): Balde {
    const nome = props.nome.trim();
    if (nome.length === 0) {
      throw new BaldeInvalidoError('O nome do balde é obrigatório.');
    }
    if (nome.length > NOME_MAX) {
      throw new BaldeInvalidoError(`O nome do balde deve ter no máximo ${NOME_MAX} caracteres.`);
    }
    if (props.saldoInicial < 0) {
      throw new BaldeInvalidoError('O saldo inicial não pode ser negativo.');
    }
    const cor = props.cor?.trim() ? props.cor.trim() : null;
    if (cor !== null && !COR_HEX_REGEX.test(cor)) {
      throw new BaldeInvalidoError('A cor deve estar em formato hexadecimal (ex.: #22c55e).');
    }
    return new Balde({ ...props, nome, cor });
  }

  get id(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get saldoInicial(): number {
    return this.props.saldoInicial;
  }

  get cor(): string | null {
    return this.props.cor;
  }

  /** Retorna um novo balde com nome/saldoInicial/cor substituídos, preservando o id. */
  atualizar(props: { nome: string; saldoInicial: number; cor: string | null }): Balde {
    return Balde.criar({ id: this.props.id, ...props });
  }
}
