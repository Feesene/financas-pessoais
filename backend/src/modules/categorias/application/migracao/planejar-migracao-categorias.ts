import { randomUUID } from 'node:crypto';
import type { TipoLancamento } from '@financas-pessoais/shared';

export interface LancamentoParaMigrar {
  id: string;
  categoria: string;
  tipo: TipoLancamento;
  categoriaId: string | null;
}

export interface CategoriaExistente {
  id: string;
  nome: string;
  tipo: TipoLancamento;
}

export interface CategoriaCriada {
  id: string;
  nome: string;
  tipo: TipoLancamento;
  cor: null;
}

export interface AtribuicaoCategoria {
  lancamentoId: string;
  categoriaId: string;
}

export interface PlanoMigracao {
  novasCategorias: CategoriaCriada[];
  atribuicoes: AtribuicaoCategoria[];
}

function chave(nome: string, tipo: TipoLancamento): string {
  return `${tipo}::${nome.trim().toLowerCase()}`;
}

/**
 * A partir dos lançamentos com categoria em texto livre (P1), determina quais
 * categorias precisam ser criadas (uma por (nome, tipo) distinto, reutilizando as
 * já existentes) e a qual categoriaId cada lançamento deve apontar.
 *
 * Pura e idempotente: lançamentos já com categoriaId são ignorados; textos vazios
 * não geram categoria nem atribuição. Não realiza I/O.
 */
export function planejarMigracaoCategorias(
  lancamentos: LancamentoParaMigrar[],
  categoriasExistentes: CategoriaExistente[],
): PlanoMigracao {
  const idPorChave = new Map<string, string>();
  for (const categoria of categoriasExistentes) {
    idPorChave.set(chave(categoria.nome, categoria.tipo), categoria.id);
  }

  const novasCategorias: CategoriaCriada[] = [];
  const atribuicoes: AtribuicaoCategoria[] = [];

  for (const lancamento of lancamentos) {
    if (lancamento.categoriaId) continue;
    const nome = lancamento.categoria.trim();
    if (nome.length === 0) continue;

    const k = chave(nome, lancamento.tipo);
    let categoriaId = idPorChave.get(k);
    if (!categoriaId) {
      categoriaId = randomUUID();
      idPorChave.set(k, categoriaId);
      novasCategorias.push({ id: categoriaId, nome, tipo: lancamento.tipo, cor: null });
    }
    atribuicoes.push({ lancamentoId: lancamento.id, categoriaId });
  }

  return { novasCategorias, atribuicoes };
}
