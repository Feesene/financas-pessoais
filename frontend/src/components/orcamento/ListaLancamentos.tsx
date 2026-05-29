import type { LancamentoDTO, TipoLancamento } from '@financas-pessoais/shared';
import { formatarReais } from '@/lib/format';
import { LancamentoItem } from './LancamentoItem';

const ROTULO_TIPO: Record<TipoLancamento, string> = {
  RECEITA: 'Receitas',
  DESPESA: 'Despesas',
};

const ORDEM_TIPOS: TipoLancamento[] = ['RECEITA', 'DESPESA'];

interface Props {
  lancamentos: LancamentoDTO[];
  onAlterado: () => void;
}

function agruparPorCategoria(lancamentos: LancamentoDTO[]): Map<string, LancamentoDTO[]> {
  const grupos = new Map<string, LancamentoDTO[]>();
  for (const lancamento of lancamentos) {
    const atual = grupos.get(lancamento.categoria) ?? [];
    atual.push(lancamento);
    grupos.set(lancamento.categoria, atual);
  }
  return grupos;
}

function subtotal(itens: LancamentoDTO[]): number {
  return itens.reduce((soma, l) => soma + l.valor, 0);
}

export function ListaLancamentos({ lancamentos, onAlterado }: Props) {
  return (
    <div className="space-y-8">
      {ORDEM_TIPOS.map((tipo) => {
        const doTipo = lancamentos.filter((l) => l.tipo === tipo);
        if (doTipo.length === 0) return null;
        const porCategoria = agruparPorCategoria(doTipo);
        const receita = tipo === 'RECEITA';

        return (
          <section key={tipo} className="space-y-4">
            <div className="flex items-center justify-between border-b pb-2">
              <h2 className="text-lg font-semibold">{ROTULO_TIPO[tipo]}</h2>
              <span
                className={`text-sm font-semibold tabular-nums ${
                  receita ? 'text-success' : 'text-destructive'
                }`}
              >
                {formatarReais(subtotal(doTipo))}
              </span>
            </div>

            {[...porCategoria.entries()].map(([categoria, itens]) => (
              <div key={categoria} className="space-y-2">
                <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                  {categoria}
                </h3>
                <div className="space-y-2">
                  {itens.map((lancamento) => (
                    <LancamentoItem
                      key={lancamento.id}
                      lancamento={lancamento}
                      onAlterado={onAlterado}
                    />
                  ))}
                </div>
              </div>
            ))}
          </section>
        );
      })}
    </div>
  );
}
