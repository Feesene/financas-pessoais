import type { TipoMovimentoCarteira } from '@financas-pessoais/shared';
import { MovimentoCarteiraInvalidoError } from '../errors/movimento-carteira-invalido.error';

const COMPETENCIA_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const TIPOS: TipoMovimentoCarteira[] = ['ENTRADA', 'SAIDA', 'RENDIMENTO'];

export interface MovimentoCarteiraProps {
  id: string;
  ativoId: string;
  tipo: TipoMovimentoCarteira;
  valor: number;
  competencia: string;
  descricao: string | null;
}

/**
 * Movimento de carteira de um ativo: entrada, saída ou rendimento por competência.
 * Invariantes: valor > 0, competência AAAA-MM e tipo ENTRADA|SAIDA|RENDIMENTO.
 */
export class MovimentoCarteira {
  private constructor(private readonly props: MovimentoCarteiraProps) {}

  static criar(props: MovimentoCarteiraProps): MovimentoCarteira {
    if (!TIPOS.includes(props.tipo)) {
      throw new MovimentoCarteiraInvalidoError(
        'O tipo do movimento deve ser ENTRADA, SAIDA ou RENDIMENTO.',
      );
    }
    if (props.valor <= 0) {
      throw new MovimentoCarteiraInvalidoError('O valor do movimento deve ser maior que zero.');
    }
    if (!COMPETENCIA_REGEX.test(props.competencia)) {
      throw new MovimentoCarteiraInvalidoError('A competência deve estar no formato AAAA-MM.');
    }
    const descricao = props.descricao?.trim() ? props.descricao.trim() : null;
    return new MovimentoCarteira({ ...props, descricao });
  }

  get id(): string {
    return this.props.id;
  }

  get ativoId(): string {
    return this.props.ativoId;
  }

  get tipo(): TipoMovimentoCarteira {
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

  /** Retorna um novo movimento com campos substituídos, preservando id e ativoId. */
  atualizar(props: {
    tipo: TipoMovimentoCarteira;
    valor: number;
    competencia: string;
    descricao: string | null;
  }): MovimentoCarteira {
    return MovimentoCarteira.criar({
      id: this.props.id,
      ativoId: this.props.ativoId,
      ...props,
    });
  }
}
