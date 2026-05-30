'use client';

import { ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import type { MovimentoReservaComBaldeDTO } from '@financas-pessoais/shared';
import { competenciaLabel } from '@/lib/competencia';
import { formatarReais } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

interface Props {
  competencia: string;
  movimentos: MovimentoReservaComBaldeDTO[];
}

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

export function MovimentosMesLista({ competencia, movimentos }: Props) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Movimentos de {competenciaLabel(competencia)}</h2>

      {movimentos.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nenhum movimento neste mês.
          </CardContent>
        </Card>
      ) : (
        <ul className="space-y-2">
          {movimentos.map((movimento) => {
            const aporte = movimento.tipo === 'APORTE';
            const Icone = aporte ? ArrowUpCircle : ArrowDownCircle;
            return (
              <li
                key={movimento.id}
                className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3"
              >
                <Icone
                  className={cn('h-5 w-5 shrink-0', aporte ? 'text-success' : 'text-destructive')}
                  aria-hidden
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{movimento.baldeNome}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {movimento.descricao ? `${movimento.descricao} · ` : ''}
                    {dataHora.format(new Date(movimento.criadoEm))}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 font-semibold tabular-nums',
                    aporte ? 'text-success' : 'text-destructive',
                  )}
                >
                  {aporte ? '+' : '−'} {formatarReais(movimento.valor)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
