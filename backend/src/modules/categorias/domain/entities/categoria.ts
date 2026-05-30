import type { TipoLancamento } from '@financas-pessoais/shared';
import { CategoriaInvalidaError } from '../errors/categoria-invalida.error';

const COR_HEX_REGEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;
const NOME_MAX = 80;

export interface CategoriaProps {
  id: string;
  nome: string;
  tipo: TipoLancamento;
  cor: string | null;
}

/**
 * Categoria reutilizável para classificar lançamentos.
 * Invariantes: nome obrigatório (≤ 80) e cor, se presente, em hex.
 * A unicidade (nome, tipo) é garantida na borda de persistência/aplicação.
 */
export class Categoria {
  private constructor(private readonly props: CategoriaProps) {}

  static criar(props: CategoriaProps): Categoria {
    const nome = props.nome.trim();
    if (nome.length === 0) {
      throw new CategoriaInvalidaError('O nome da categoria é obrigatório.');
    }
    if (nome.length > NOME_MAX) {
      throw new CategoriaInvalidaError(`O nome da categoria deve ter no máximo ${NOME_MAX} caracteres.`);
    }
    const cor = props.cor?.trim() ? props.cor.trim() : null;
    if (cor !== null && !COR_HEX_REGEX.test(cor)) {
      throw new CategoriaInvalidaError('A cor deve estar em formato hexadecimal (ex.: #22c55e).');
    }
    return new Categoria({ ...props, nome, cor });
  }

  get id(): string {
    return this.props.id;
  }

  get nome(): string {
    return this.props.nome;
  }

  get tipo(): TipoLancamento {
    return this.props.tipo;
  }

  get cor(): string | null {
    return this.props.cor;
  }

  get ehDespesa(): boolean {
    return this.props.tipo === 'DESPESA';
  }

  /** Retorna uma nova categoria com nome/cor substituídos, preservando id e tipo. */
  atualizar(props: { nome: string; cor: string | null }): Categoria {
    return Categoria.criar({
      id: this.props.id,
      tipo: this.props.tipo,
      nome: props.nome,
      cor: props.cor,
    });
  }
}
