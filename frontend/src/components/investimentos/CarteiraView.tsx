'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, History, Plus, TrendingUp } from 'lucide-react';
import type { AtivoDTO, PosicaoCarteiraDTO, SubtotalTipoDTO, TipoAtivo } from '@financas-pessoais/shared';
import { investimentosApi } from '@/lib/api/investimentos';
import { useCompetencia } from '@/components/competencia/CompetenciaProvider';
import { formatarReais } from '@/lib/format';
import { TIPO_ATIVO_LABEL } from '@/lib/investimentos';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { AtivoCard } from './AtivoCard';
import { AtivoFormDialog } from './AtivoFormDialog';
import { HistoricoCarteiraDialog } from './HistoricoCarteiraDialog';

type Status = 'loading' | 'ready' | 'error';

const ORDEM_TIPOS: TipoAtivo[] = ['ACAO', 'FII', 'FUNDO'];

export function CarteiraView() {
  const { competencia } = useCompetencia();
  const [posicao, setPosicao] = useState<PosicaoCarteiraDTO | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const carregar = useCallback(async () => {
    setStatus('loading');
    try {
      const dados = await investimentosApi.posicao();
      setPosicao(dados);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Carteira de investimentos</h1>
          <p className="text-sm text-muted-foreground">
            Acompanhe seus ativos por classe, com subtotais e total geral.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <HistoricoCarteiraDialog
            trigger={
              <Button variant="outline" className="flex-1 sm:flex-none">
                <History />
                Histórico
              </Button>
            }
          />
          <AtivoFormDialog
            onSalvo={carregar}
            trigger={
              <Button className="flex-1 sm:flex-none">
                <Plus />
                Novo ativo
              </Button>
            }
          />
        </div>
      </header>

      {status === 'loading' && <CarteiraSkeleton />}

      {status === 'error' && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-medium">Não foi possível carregar a carteira.</p>
            <p className="text-sm text-muted-foreground">
              Verifique se o servidor da API está em execução e tente novamente.
            </p>
            <Button variant="outline" onClick={carregar}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {status === 'ready' &&
        posicao &&
        (posicao.ativos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Nenhum ativo cadastrado.</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Adicione ações, fundos imobiliários ou fundos para montar sua carteira.
              </p>
              <AtivoFormDialog
                onSalvo={carregar}
                trigger={
                  <Button>
                    <Plus />
                    Adicionar ativo
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="bg-primary/5">
              <CardContent className="flex items-center justify-between py-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total da carteira</p>
                  {posicao.rendimentoTotal > 0 && (
                    <p className="text-xs text-muted-foreground">
                      Rendimento acumulado: {formatarReais(posicao.rendimentoTotal)}
                    </p>
                  )}
                </div>
                <span className="text-2xl font-bold tabular-nums">
                  {formatarReais(posicao.total)}
                </span>
              </CardContent>
            </Card>

            {ORDEM_TIPOS.filter((tipo) => posicao.ativos.some((a) => a.tipo === tipo)).map(
              (tipo) => (
                <GrupoTipo
                  key={tipo}
                  tipo={tipo}
                  ativos={posicao.ativos.filter((a) => a.tipo === tipo)}
                  subtotal={posicao.subtotais.find((s) => s.tipo === tipo) ?? null}
                  competencia={competencia}
                  onAlterado={carregar}
                />
              ),
            )}
          </div>
        ))}
    </main>
  );
}

interface GrupoProps {
  tipo: TipoAtivo;
  ativos: AtivoDTO[];
  subtotal: SubtotalTipoDTO | null;
  competencia: string;
  onAlterado: () => void;
}

function GrupoTipo({ tipo, ativos, subtotal, competencia, onAlterado }: GrupoProps) {
  return (
    <section className="space-y-2">
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          {TIPO_ATIVO_LABEL[tipo]}
        </h2>
        <span className="text-sm font-medium tabular-nums">
          {formatarReais(subtotal?.total ?? 0)}
        </span>
      </div>
      <div className="space-y-2">
        {ativos.map((ativo) => (
          <AtivoCard
            key={ativo.id}
            ativo={ativo}
            competencia={competencia}
            onAlterado={onAlterado}
          />
        ))}
      </div>
    </section>
  );
}

function CarteiraSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full" />
      <div className="space-y-2">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
}
