'use client';

import { useCallback, useEffect, useState } from 'react';
import {
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AlertTriangle, PieChart as PieChartIcon } from 'lucide-react';
import type { EvolucaoMensalItemDTO, GastoPorCategoriaItemDTO } from '@financas-pessoais/shared';
import { relatoriosApi } from '@/lib/api/relatorios';
import { competenciaLabel } from '@/lib/competencia';
import { formatarReais } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type Status = 'loading' | 'ready' | 'error';

const CORES_FALLBACK = [
  '#3b82f6',
  '#22c55e',
  '#f97316',
  '#a855f7',
  '#ef4444',
  '#14b8a6',
  '#eab308',
  '#ec4899',
];

interface Props {
  de: string;
  ate: string;
}

export function GraficosRelatorio({ de, ate }: Props) {
  const [categorias, setCategorias] = useState<GastoPorCategoriaItemDTO[]>([]);
  const [evolucao, setEvolucao] = useState<EvolucaoMensalItemDTO[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const carregar = useCallback(async () => {
    setStatus('loading');
    try {
      const [porCategoria, serie] = await Promise.all([
        relatoriosApi.porCategoria(de, ate),
        relatoriosApi.evolucao(de, ate),
      ]);
      setCategorias(porCategoria);
      setEvolucao(serie);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [de, ate]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  if (status === 'loading') {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-80 w-full" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  if (status === 'error') {
    return (
      <Card className="border-destructive/40">
        <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
          <AlertTriangle className="h-8 w-8 text-destructive" />
          <p className="font-medium">Não foi possível carregar os gráficos.</p>
          <Button variant="outline" onClick={carregar}>
            Tentar novamente
          </Button>
        </CardContent>
      </Card>
    );
  }

  const temEvolucao = evolucao.some((p) => p.receitas > 0 || p.despesas > 0);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Gasto por categoria</CardTitle>
        </CardHeader>
        <CardContent>
          {categorias.length === 0 ? (
            <EstadoVazio mensagem="Sem despesas no período." />
          ) : (
            <>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categorias}
                      dataKey="total"
                      nameKey="categoria.nome"
                      innerRadius={48}
                      outerRadius={88}
                      paddingAngle={2}
                    >
                      {categorias.map((item, i) => (
                        <Cell
                          key={item.categoria.id}
                          fill={item.categoria.cor ?? CORES_FALLBACK[i % CORES_FALLBACK.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatarReais(Number(v))}
                      labelFormatter={() => ''}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <ul className="mt-4 space-y-1.5 text-sm">
                {categorias.map((item, i) => (
                  <li key={item.categoria.id} className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 truncate">
                      <span
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            item.categoria.cor ?? CORES_FALLBACK[i % CORES_FALLBACK.length],
                        }}
                      />
                      <span className="truncate">{item.categoria.nome}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-muted-foreground">
                      {formatarReais(item.total)} ({(item.percentual * 100).toFixed(1)}%)
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução mensal</CardTitle>
        </CardHeader>
        <CardContent>
          {!temEvolucao ? (
            <EstadoVazio mensagem="Sem movimentação no período." />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={evolucao} margin={{ top: 8, right: 8, bottom: 8, left: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis
                    dataKey="competencia"
                    tickFormatter={(c: string) => competenciaLabel(c).slice(0, 3)}
                    fontSize={11}
                    tickMargin={8}
                  />
                  <YAxis width={72} fontSize={11} tickFormatter={(v: number) => formatarReais(v)} />
                  <Tooltip
                    formatter={(v, nome) => [formatarReais(Number(v)), rotuloSerie(String(nome))]}
                    labelFormatter={(l) => competenciaLabel(String(l))}
                  />
                  <Line type="monotone" dataKey="receitas" stroke="#22c55e" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="despesas" stroke="#ef4444" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="saldo" stroke="#3b82f6" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function rotuloSerie(chave: string): string {
  if (chave === 'receitas') return 'Receitas';
  if (chave === 'despesas') return 'Despesas';
  return 'Saldo';
}

function EstadoVazio({ mensagem }: { mensagem: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
      <PieChartIcon className="h-7 w-7" />
      {mensagem}
    </div>
  );
}
