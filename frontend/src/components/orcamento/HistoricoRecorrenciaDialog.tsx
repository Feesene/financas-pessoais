'use client';

import { useState } from 'react';
import type { HistoricoRecorrenciaDTO, LancamentoDTO } from '@financas-pessoais/shared';
import { lancamentosApi } from '@/lib/api/lancamentos';
import { competenciaLabel } from '@/lib/competencia';
import { formatarReais } from '@/lib/format';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

type Status = 'loading' | 'ready' | 'error';

interface Props {
  /** Lançamento gerado pela regra; serve de rótulo e de destaque na lista. */
  lancamento: LancamentoDTO;
  trigger: React.ReactNode;
}

/** Histórico de todas as ocorrências já lançadas por uma recorrência (previsto x pago). */
export function HistoricoRecorrenciaDialog({ lancamento, trigger }: Props) {
  const [aberto, setAberto] = useState(false);
  const [historico, setHistorico] = useState<HistoricoRecorrenciaDTO | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  async function aoMudarAbertura(estado: boolean) {
    setAberto(estado);
    if (!estado || lancamento.origemRegraId === null) return;
    setStatus('loading');
    try {
      setHistorico(await lancamentosApi.historicoRecorrencia(lancamento.origemRegraId));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  const ocorrencias = historico?.ocorrencias ?? [];

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico da recorrência</DialogTitle>
          <DialogDescription>
            {lancamento.descricao ?? lancamento.categoria} — todos os meses já lançados, com o
            previsto e o efetivamente pago.
          </DialogDescription>
        </DialogHeader>

        {status === 'loading' && <Skeleton className="h-48 w-full" />}

        {status === 'error' && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Não foi possível carregar o histórico. Tente novamente.
          </p>
        )}

        {status === 'ready' && historico && (
          <>
            <dl className="grid grid-cols-3 gap-2 rounded-lg border bg-muted/40 p-3 text-center">
              <div>
                <dt className="text-xs text-muted-foreground">Ocorrências</dt>
                <dd className="font-semibold tabular-nums">
                  {historico.quantidadePagas}/{ocorrencias.length} pagas
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Total previsto</dt>
                <dd className="font-semibold tabular-nums">
                  {formatarReais(historico.totalPrevisto)}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-muted-foreground">Total pago</dt>
                <dd className="font-semibold tabular-nums">{formatarReais(historico.totalPago)}</dd>
              </div>
            </dl>

            {ocorrencias.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Nenhuma ocorrência lançada ainda.
              </p>
            ) : (
              <div className="max-h-[50vh] overflow-x-auto overflow-y-auto pr-2">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="py-2 pr-2 font-medium">Mês</th>
                      <th className="py-2 px-2 text-right font-medium">Previsto</th>
                      <th className="py-2 px-2 text-right font-medium">Pago</th>
                      <th className="hidden py-2 pl-2 text-right font-medium sm:table-cell">
                        Diferença
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {ocorrencias.map((o) => {
                      const diferenca =
                        o.pago && o.valorPago !== null ? o.valorPago - o.valor : null;
                      // Receber acima do previsto é bom; pagar acima do previsto é ruim.
                      const favoravel =
                        diferenca === null || diferenca === 0
                          ? null
                          : o.tipo === 'RECEITA'
                            ? diferenca > 0
                            : diferenca < 0;
                      return (
                        <tr
                          key={o.id}
                          className={cn(
                            'border-b last:border-0',
                            o.id === lancamento.id && 'bg-accent/40',
                          )}
                        >
                          <td className="py-2 pr-2 whitespace-nowrap">
                            {competenciaLabel(o.competencia)}
                            {o.ocorrenciaIndice !== null && (
                              <span className="ml-1 text-xs text-muted-foreground">
                                ({o.ocorrenciaIndice}ª)
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums">
                            {formatarReais(o.valor)}
                          </td>
                          <td className="py-2 px-2 text-right tabular-nums">
                            {o.pago && o.valorPago !== null ? (
                              formatarReais(o.valorPago)
                            ) : (
                              <span className="text-muted-foreground">Em aberto</span>
                            )}
                          </td>
                          <td
                            className={cn(
                              'hidden py-2 pl-2 text-right font-medium tabular-nums sm:table-cell',
                              diferenca === null && 'text-muted-foreground',
                              favoravel === true && 'text-success',
                              favoravel === false && 'text-destructive',
                            )}
                          >
                            {diferenca === null
                              ? '—'
                              : `${diferenca > 0 ? '+' : ''}${formatarReais(diferenca)}`}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
