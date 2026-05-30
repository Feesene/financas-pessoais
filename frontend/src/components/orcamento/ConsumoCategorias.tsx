import type { ConsumoCategoriaDTO } from '@financas-pessoais/shared';
import { formatarReais } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface Props {
  consumo: ConsumoCategoriaDTO[];
}

export function ConsumoCategorias({ consumo }: Props) {
  const comMeta = consumo.filter((c) => c.meta !== null);
  if (comMeta.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="border-b pb-2 text-lg font-semibold">Metas por categoria</h2>
      <div className="space-y-4">
        {comMeta.map((item) => (
          <LinhaConsumo key={item.categoria.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function LinhaConsumo({ item }: { item: ConsumoCategoriaDTO }) {
  const meta = item.meta ?? 0;
  const fracao = meta > 0 ? item.gasto / meta : 0;
  const largura = Math.min(100, Math.round(fracao * 100));
  const percentualLabel =
    item.percentual !== null ? `${Math.round(item.percentual * 100)}%` : '—';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2 text-sm">
        <span className="flex min-w-0 items-center gap-2">
          <span
            className="h-3 w-3 shrink-0 rounded-full border"
            style={{ backgroundColor: item.categoria.cor ?? 'transparent' }}
            aria-hidden
          />
          <span className="truncate font-medium">{item.categoria.nome}</span>
          {item.estourou && <Badge variant="destructive">Estourou</Badge>}
        </span>
        <span className="shrink-0 tabular-nums text-muted-foreground">
          {formatarReais(item.gasto)} / {formatarReais(meta)}
        </span>
      </div>

      <div
        className="h-2 w-full overflow-hidden rounded-full bg-secondary"
        role="progressbar"
        aria-valuenow={largura}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Consumo de ${item.categoria.nome}: ${percentualLabel}`}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all',
            item.estourou ? 'bg-destructive' : 'bg-success',
          )}
          style={{ width: `${largura}%` }}
        />
      </div>

      <p className="text-right text-xs text-muted-foreground tabular-nums">{percentualLabel}</p>
    </div>
  );
}
