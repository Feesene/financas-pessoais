'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { ProjecaoAnoDTO } from '@financas-pessoais/shared';
import { formatarReais } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  anos: ProjecaoAnoDTO[];
}

export function ProjecaoGrafico({ anos }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Investido vs. sem investir</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={anos} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="ano"
                fontSize={11}
                tickMargin={8}
                tickFormatter={(v: number) => `${v}a`}
              />
              <YAxis
                width={72}
                fontSize={11}
                tickFormatter={(v: number) => compacto(v)}
              />
              <Tooltip
                formatter={(v, nome) => [formatarReais(Number(v)), rotuloSerie(String(nome))]}
                labelFormatter={(l) => `Ano ${l}`}
              />
              <Line
                type="monotone"
                dataKey="saldoInvestido"
                stroke="#22c55e"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="saldoNaoInvestido"
                stroke="#94a3b8"
                strokeWidth={2}
                strokeDasharray="4 4"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-3 flex justify-center gap-6 text-xs text-muted-foreground">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
            Investido
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-slate-400" />
            Sem investir
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function rotuloSerie(chave: string): string {
  return chave === 'saldoInvestido' ? 'Investido' : 'Sem investir';
}

/** Rótulo compacto do eixo Y, ex.: 1.250.000 -> "R$ 1,3M". */
function compacto(valor: number): string {
  if (Math.abs(valor) >= 1_000_000) return `R$ ${(valor / 1_000_000).toFixed(1)}M`;
  if (Math.abs(valor) >= 1_000) return `R$ ${(valor / 1_000).toFixed(0)}k`;
  return formatarReais(valor);
}
