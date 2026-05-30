import type { TipoAtivo } from '@financas-pessoais/shared';
import { AtivoInvalidoError } from '../errors/ativo-invalido.error';

const DESCRICAO_MAX = 80;
const TIPOS: TipoAtivo[] = ['FUNDO', 'ACAO', 'FII'];

export interface AtivoProps {
  id: string;
  tipo: TipoAtivo;
  descricao: string;
  quantidade: number | null;
  valorUnitario: number | null;
  /** Apenas relevante para FUNDO; em ACAO/FII é derivado e ignorado. */
  valorBruto: number;
  rendimento: number;
}

/** true para ativos cotados por quantidade × valor unitário (ação e FII). */
function ehCotado(tipo: TipoAtivo): boolean {
  return tipo === 'ACAO' || tipo === 'FII';
}

/**
 * Ativo da carteira. O `valorBruto` de ações/FIIs é **derivado** de
 * `quantidade × valorUnitario` (fonte única); fundos informam o `valorBruto`
 * diretamente, com `quantidade`/`valorUnitario` nulos.
 */
export class Ativo {
  private readonly props: AtivoProps;

  private constructor(props: AtivoProps) {
    this.props = props;
  }

  static criar(props: AtivoProps): Ativo {
    if (!TIPOS.includes(props.tipo)) {
      throw new AtivoInvalidoError('O tipo do ativo deve ser FUNDO, ACAO ou FII.');
    }

    const descricao = props.descricao.trim();
    if (descricao.length === 0) {
      throw new AtivoInvalidoError('A descrição do ativo é obrigatória.');
    }
    if (descricao.length > DESCRICAO_MAX) {
      throw new AtivoInvalidoError(
        `A descrição do ativo deve ter no máximo ${DESCRICAO_MAX} caracteres.`,
      );
    }

    if (props.rendimento < 0) {
      throw new AtivoInvalidoError('O rendimento não pode ser negativo.');
    }

    if (ehCotado(props.tipo)) {
      return Ativo.criarCotado({ ...props, descricao });
    }
    return Ativo.criarFundo({ ...props, descricao });
  }

  private static criarCotado(props: AtivoProps): Ativo {
    if (props.quantidade === null || props.valorUnitario === null) {
      throw new AtivoInvalidoError(
        'Ações e FIIs exigem quantidade e valor unitário.',
      );
    }
    if (props.quantidade <= 0) {
      throw new AtivoInvalidoError('A quantidade deve ser maior que zero.');
    }
    if (props.valorUnitario < 0) {
      throw new AtivoInvalidoError('O valor unitário não pode ser negativo.');
    }
    const valorBruto = arredondar(props.quantidade * props.valorUnitario);
    return new Ativo({ ...props, valorBruto });
  }

  private static criarFundo(props: AtivoProps): Ativo {
    if (props.quantidade !== null || props.valorUnitario !== null) {
      throw new AtivoInvalidoError(
        'Fundos não aceitam quantidade nem valor unitário.',
      );
    }
    if (props.valorBruto < 0) {
      throw new AtivoInvalidoError('O valor bruto não pode ser negativo.');
    }
    return new Ativo({ ...props });
  }

  get id(): string {
    return this.props.id;
  }

  get tipo(): TipoAtivo {
    return this.props.tipo;
  }

  get descricao(): string {
    return this.props.descricao;
  }

  get quantidade(): number | null {
    return this.props.quantidade;
  }

  get valorUnitario(): number | null {
    return this.props.valorUnitario;
  }

  get valorBruto(): number {
    return this.props.valorBruto;
  }

  get rendimento(): number {
    return this.props.rendimento;
  }

  /** Retorna um novo ativo com campos substituídos, preservando o id e o tipo. */
  atualizar(props: {
    descricao: string;
    quantidade: number | null;
    valorUnitario: number | null;
    valorBruto: number;
    rendimento: number;
  }): Ativo {
    return Ativo.criar({ id: this.props.id, tipo: this.props.tipo, ...props });
  }
}

/** Arredonda para 2 casas em centavos, evitando erro de ponto flutuante. */
function arredondar(valor: number): number {
  return Math.round(valor * 100) / 100;
}
