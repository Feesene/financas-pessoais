'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  ArrowDownCircle,
  ArrowUpCircle,
  AlertTriangle,
  PiggyBank,
  Plus,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Line,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import type {
  ConsumoCategoriaDTO,
  EvolucaoMensalItemDTO,
  GastoPorCategoriaItemDTO,
  PosicaoCarteiraDTO,
  ResumoMensalDTO,
  SaldosReservaDTO,
} from '@financas-pessoais/shared';
import { lancamentosApi } from '@/lib/api/lancamentos';
import { categoriasApi } from '@/lib/api/categorias';
import { relatoriosApi } from '@/lib/api/relatorios';
import { reservasApi } from '@/lib/api/reservas';
import { investimentosApi } from '@/lib/api/investimentos';
import { recorrenciasApi } from '@/lib/api/recorrencias';
import { competenciaLabel, isCompetenciaValida, mesAnterior } from '@/lib/competencia';
import { useCompetencia } from '@/components/competencia/CompetenciaProvider';
import { formatarReais } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NavegacaoMeses } from '@/components/orcamento/NavegacaoMeses';
import { LancamentoFormDialog } from '@/components/orcamento/LancamentoFormDialog';

type Status = 'loading' | 'ready' | 'error';

interface DashboardData {
  resumo: ResumoMensalDTO;
  consumo: ConsumoCategoriaDTO[];
  evolucao: EvolucaoMensalItemDTO[];
  porCategoria: GastoPorCategoriaItemDTO[];
  reservas: SaldosReservaDTO;
  carteira: PosicaoCarteiraDTO;
}

const CORES_FALLBACK = [
  '#3b82f6', '#22c55e', '#f97316', '#a855f7',
  '#ef4444', '#14b8a6', '#eab308', '#ec4899',
];

function subtrairMeses(competencia: string, n: number): string {
  let c = competencia;
  for (let i = 0; i < n; i++) c = mesAnterior(c);
  return c;
}

export function DashboardView() {
  const { competencia, setCompetencia } = useCompetencia();
  const searchParams = useSearchParams();

  // Deep-link: na 1ª carga, ?competencia= válido alimenta o estado global (URL vence).
  const overrideAplicado = useRef(false);
  useEffect(() => {
    if (overrideAplicado.current) return;
    overrideAplicado.current = true;
    const param = searchParams.get('competencia');
    if (param && isCompetenciaValida(param) && param !== competencia) {
      setCompetencia(param);
    }
  }, [searchParams, competencia, setCompetencia]);

  const [dados, setDados] = useState<DashboardData | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const carregar = useCallback(async () => {
    setStatus('loading');
    try {
      try { await recorrenciasApi.materializar(competencia); } catch { /* idempotente */ }

      const inicio6m = subtrairMeses(competencia, 5);
      const [resumo, consumo, evolucao, porCategoria, reservas, carteira] = await Promise.all([
        lancamentosApi.resumo(competencia),
        categoriasApi.consumo(competencia),
        relatoriosApi.evolucao(inicio6m, competencia),
        relatoriosApi.porCategoria(competencia, competencia),
        reservasApi.saldos(),
        investimentosApi.posicao(),
      ]);
      setDados({ resumo, consumo, evolucao, porCategoria, reservas, carteira });
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [competencia]);

  useEffect(() => { void carregar(); }, [carregar]);

  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 py-6 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {competenciaLabel(competencia)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NavegacaoMeses />
          {dados && (
            <LancamentoFormDialog
              competencia={competencia}
              onSalvo={carregar}
              trigger={
                <Button>
                  <Plus />
                  Lançamento
                </Button>
              }
            />
          )}
        </div>
      </div>

      {status === 'loading' && <DashboardSkeleton />}

      {status === 'error' && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-medium">Não foi possível carregar o painel.</p>
            <p className="text-sm text-muted-foreground">
              Verifique se o servidor da API está em execução.
            </p>
            <Button variant="outline" onClick={carregar}>Tentar novamente</Button>
          </CardContent>
        </Card>
      )}

      {status === 'ready' && dados && (
        <div className="space-y-6">
          {/* KPI Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <KpiCard
              rotulo="Receitas"
              valor={dados.resumo.totalReceitas}
              icone={ArrowUpCircle}
              cor="text-success"
              fundo="bg-success/10"
            />
            <KpiCard
              rotulo="Despesas"
              valor={dados.resumo.totalDespesas}
              icone={ArrowDownCircle}
              cor="text-destructive"
              fundo="bg-destructive/10"
            />
            <KpiCard
              rotulo="Saldo do mês"
              valor={dados.resumo.saldo}
              icone={Wallet}
              cor={dados.resumo.saldo < 0 ? 'text-destructive' : 'text-primary'}
              fundo={dados.resumo.saldo < 0 ? 'bg-destructive/10' : 'bg-primary/10'}
            />
            <KpiCard
              rotulo="Total reservado"
              valor={dados.reservas.total}
              icone={PiggyBank}
              cor="text-primary"
              fundo="bg-primary/10"
            />
            <KpiCard
              rotulo="Carteira"
              valor={dados.carteira.total}
              icone={TrendingUp}
              cor="text-primary"
              fundo="bg-primary/10"
              detalhe={
                dados.carteira.rendimentoTotal > 0
                  ? `+${formatarReais(dados.carteira.rendimentoTotal)} rendimento`
                  : undefined
              }
            />
          </div>

          {/* Charts row */}
          <div className="grid gap-4 lg:grid-cols-3">
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Evolução — últimos 6 meses</CardTitle>
              </CardHeader>
              <CardContent>
                <GraficoEvolucao dados={dados.evolucao} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Gastos por categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <GraficoCategoria dados={dados.porCategoria} />
              </CardContent>
            </Card>
          </div>

          {/* Consumption goals */}
          {dados.consumo.filter((c) => c.meta !== null).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Metas por categoria</CardTitle>
              </CardHeader>
              <CardContent>
                <ConsumoGrid consumo={dados.consumo} />
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ──────────────────────────────────────────────────────── */

interface KpiProps {
  rotulo: string;
  valor: number;
  icone: React.ElementType;
  cor: string;
  fundo: string;
  detalhe?: string;
}

function KpiCard({ rotulo, valor, icone: Icone, cor, fundo, detalhe }: KpiProps) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <span className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-full', fundo)}>
          <Icone className={cn('h-5 w-5', cor)} />
        </span>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
          <p className={cn('text-xl font-bold tabular-nums truncate', cor)}>{formatarReais(valor)}</p>
          {detalhe && <p className="text-xs text-muted-foreground truncate">{detalhe}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

function GraficoEvolucao({ dados }: { dados: EvolucaoMensalItemDTO[] }) {
  const temDados = dados.some((p) => p.receitas > 0 || p.despesas > 0);
  if (!temDados) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        Sem movimentação no período.
      </div>
    );
  }
  return (
    <div className="h-52 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={dados} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis
            dataKey="competencia"
            tickFormatter={(c: string) => competenciaLabel(c).slice(0, 3)}
            fontSize={11}
            tickMargin={6}
          />
          <YAxis width={70} fontSize={11} tickFormatter={(v: number) => formatarReais(v)} />
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
  );
}

function GraficoCategoria({ dados }: { dados: GastoPorCategoriaItemDTO[] }) {
  if (dados.length === 0) {
    return (
      <div className="flex h-52 items-center justify-center text-sm text-muted-foreground">
        Sem despesas no mês.
      </div>
    );
  }
  const top5 = dados.slice(0, 5);
  return (
    <div className="space-y-3">
      <div className="h-36 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={top5}
              dataKey="total"
              nameKey="categoria.nome"
              innerRadius={36}
              outerRadius={62}
              paddingAngle={2}
            >
              {top5.map((item, i) => (
                <Cell
                  key={item.categoria.id}
                  fill={item.categoria.cor ?? CORES_FALLBACK[i % CORES_FALLBACK.length]}
                />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatarReais(Number(v))} labelFormatter={() => ''} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-1 text-xs">
        {top5.map((item, i) => (
          <li key={item.categoria.id} className="flex items-center justify-between gap-2">
            <span className="flex items-center gap-1.5 truncate">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: item.categoria.cor ?? CORES_FALLBACK[i % CORES_FALLBACK.length] }}
              />
              <span className="truncate">{item.categoria.nome}</span>
            </span>
            <span className="shrink-0 tabular-nums text-muted-foreground">
              {(item.percentual * 100).toFixed(0)}%
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ConsumoGrid({ consumo }: { consumo: ConsumoCategoriaDTO[] }) {
  const comMeta = consumo.filter((c) => c.meta !== null);
  return (
    <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
      {comMeta.map((item) => {
        const meta = item.meta ?? 0;
        const largura = meta > 0 ? Math.min(100, Math.round((item.gasto / meta) * 100)) : 0;
        return (
          <div key={item.categoria.id} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full border"
                  style={{ backgroundColor: item.categoria.cor ?? 'transparent' }}
                />
                <span className="truncate font-medium">{item.categoria.nome}</span>
                {item.estourou && <Badge variant="destructive" className="text-xs">!</Badge>}
              </span>
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {formatarReais(item.gasto)} / {formatarReais(meta)}
              </span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-secondary">
              <div
                className={cn('h-full rounded-full', item.estourou ? 'bg-destructive' : 'bg-success')}
                style={{ width: `${largura}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function rotuloSerie(chave: string): string {
  if (chave === 'receitas') return 'Receitas';
  if (chave === 'despesas') return 'Despesas';
  return 'Saldo';
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-[5.25rem]" />)}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </div>
      <Skeleton className="h-48" />
    </div>
  );
}
