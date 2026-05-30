'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ConsolidadoDTO } from '@financas-pessoais/shared';
import { relatoriosApi } from '@/lib/api/relatorios';
import { parseCompetencia } from '@/lib/competencia';
import { formatarReais } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const MESES_CURTOS = [
  'Jan',
  'Fev',
  'Mar',
  'Abr',
  'Mai',
  'Jun',
  'Jul',
  'Ago',
  'Set',
  'Out',
  'Nov',
  'Dez',
];

type Status = 'loading' | 'ready' | 'error';

interface Props {
  ano: number;
}

export function HistoricoTabela({ ano }: Props) {
  const [consolidado, setConsolidado] = useState<ConsolidadoDTO | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const carregar = useCallback(async () => {
    setStatus('loading');
    try {
      setConsolidado(await relatoriosApi.consolidadoPorAno(ano));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [ano]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (status === 'loading') return <Skeleton className="h-96 w-full" />;

  if (status === 'error') {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="font-medium">Não foi possível carregar o histórico.</p>
          <Button variant="outline" onClick={carregar}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!consolidado) return null;
  const { meses, totais } = consolidado;

  return (
    <Card>
      <CardContent className="overflow-x-auto p-0">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="px-4 py-3 text-left font-medium">Mês</th>
              <th className="px-4 py-3 text-right font-medium">Líquido</th>
              <th className="px-4 py-3 text-right font-medium">Gastos</th>
              <th className="px-4 py-3 text-right font-medium">Poupança</th>
              <th className="px-4 py-3 text-right font-medium">Viagem</th>
              <th className="px-4 py-3 text-right font-medium">Sobras</th>
            </tr>
          </thead>
          <tbody>
            {meses.map((mes) => {
              const { mes: numeroMes } = parseCompetencia(mes.competencia);
              return (
                <tr key={mes.competencia} className="border-b last:border-0">
                  <td className="px-4 py-2.5 font-medium">{MESES_CURTOS[numeroMes - 1]}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatarReais(mes.liquidoRecebido)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatarReais(mes.gastos)}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums">
                    {formatarReais(mes.poupanca)}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums">{formatarReais(mes.viagem)}</td>
                  <td
                    className={cn(
                      'px-4 py-2.5 text-right font-medium tabular-nums',
                      mes.sobras < 0 ? 'text-destructive' : 'text-success',
                    )}
                  >
                    {formatarReais(mes.sobras)}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 bg-muted/40 font-semibold">
              <td className="px-4 py-3">Totais</td>
              <td className="px-4 py-3 text-right tabular-nums">
                {formatarReais(totais.liquidoRecebido)}
              </td>
              <td className="px-4 py-3 text-right tabular-nums">{formatarReais(totais.gastos)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatarReais(totais.poupanca)}</td>
              <td className="px-4 py-3 text-right tabular-nums">{formatarReais(totais.viagem)}</td>
              <td
                className={cn(
                  'px-4 py-3 text-right tabular-nums',
                  totais.sobras < 0 ? 'text-destructive' : 'text-success',
                )}
              >
                {formatarReais(totais.sobras)}
              </td>
            </tr>
          </tfoot>
        </table>
      </CardContent>
    </Card>
  );
}
