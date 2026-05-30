'use client';

import { useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { BaldeDTO, EvolucaoBaldeDTO } from '@financas-pessoais/shared';
import { reservasApi } from '@/lib/api/reservas';
import { competenciaLabel } from '@/lib/competencia';
import { formatarReais } from '@/lib/format';
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
  balde: BaldeDTO;
  trigger: React.ReactNode;
}

export function EvolucaoDialog({ balde, trigger }: Props) {
  const [aberto, setAberto] = useState(false);
  const [pontos, setPontos] = useState<EvolucaoBaldeDTO[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  async function aoMudarAbertura(estado: boolean) {
    setAberto(estado);
    if (!estado) return;
    setStatus('loading');
    try {
      const dados = await reservasApi.evolucao(balde.id);
      setPontos(dados);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  const cor = balde.cor ?? '#3b82f6';

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Evolução de “{balde.nome}”</DialogTitle>
          <DialogDescription>Saldo acumulado ao fim de cada competência.</DialogDescription>
        </DialogHeader>

        {status === 'loading' && <Skeleton className="h-64 w-full" />}

        {status === 'error' && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Não foi possível carregar a evolução. Tente novamente.
          </p>
        )}

        {status === 'ready' &&
          (pontos.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Sem movimentos registrados para exibir a evolução.
            </p>
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={pontos} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="competencia"
                    tickFormatter={competenciaLabel}
                    fontSize={11}
                    tickMargin={8}
                  />
                  <YAxis
                    width={72}
                    fontSize={11}
                    tickFormatter={(v: number) => formatarReais(v)}
                  />
                  <Tooltip
                    formatter={(v) => [formatarReais(Number(v)), 'Saldo']}
                    labelFormatter={(l) => competenciaLabel(String(l))}
                  />
                  <Line
                    type="monotone"
                    dataKey="saldo"
                    stroke={cor}
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ))}
      </DialogContent>
    </Dialog>
  );
}
