'use client';

import { useState } from 'react';
import type { HistoricoCarteiraItemDTO } from '@financas-pessoais/shared';
import { investimentosApi } from '@/lib/api/investimentos';
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
  trigger: React.ReactNode;
}

export function HistoricoCarteiraDialog({ trigger }: Props) {
  const [aberto, setAberto] = useState(false);
  const [itens, setItens] = useState<HistoricoCarteiraItemDTO[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  async function aoMudarAbertura(estado: boolean) {
    setAberto(estado);
    if (!estado) return;
    setStatus('loading');
    try {
      const dados = await investimentosApi.historico();
      setItens(dados);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Histórico de movimentações</DialogTitle>
          <DialogDescription>
            Entradas, saídas, rendimentos e fluxo líquido por competência.
          </DialogDescription>
        </DialogHeader>

        {status === 'loading' && <Skeleton className="h-48 w-full" />}

        {status === 'error' && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Não foi possível carregar o histórico. Tente novamente.
          </p>
        )}

        {status === 'ready' &&
          (itens.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Nenhuma movimentação registrada ainda.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-muted-foreground">
                    <th className="py-2 pr-2 font-medium">Mês</th>
                    <th className="py-2 px-2 text-right font-medium">Entradas</th>
                    <th className="py-2 px-2 text-right font-medium">Saídas</th>
                    <th className="py-2 px-2 text-right font-medium">Rendimentos</th>
                    <th className="py-2 pl-2 text-right font-medium">Fluxo líquido</th>
                  </tr>
                </thead>
                <tbody>
                  {itens.map((item) => (
                    <tr key={item.competencia} className="border-b last:border-0">
                      <td className="py-2 pr-2 whitespace-nowrap">
                        {competenciaLabel(item.competencia)}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-success">
                        {formatarReais(item.entradas)}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums text-destructive">
                        {formatarReais(item.saidas)}
                      </td>
                      <td className="py-2 px-2 text-right tabular-nums">
                        {formatarReais(item.rendimentos)}
                      </td>
                      <td
                        className={cn(
                          'py-2 pl-2 text-right font-medium tabular-nums',
                          item.fluxoLiquido < 0 ? 'text-destructive' : 'text-foreground',
                        )}
                      >
                        {formatarReais(item.fluxoLiquido)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
      </DialogContent>
    </Dialog>
  );
}
