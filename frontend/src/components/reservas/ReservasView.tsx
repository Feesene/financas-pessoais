'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, PiggyBank, Plus } from 'lucide-react';
import type { SaldoBaldeDTO } from '@financas-pessoais/shared';
import { reservasApi } from '@/lib/api/reservas';
import { competenciaAtual } from '@/lib/competencia';
import { formatarReais } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NavegacaoMeses } from '@/components/orcamento/NavegacaoMeses';
import { BaldeCard } from './BaldeCard';
import { BaldeFormDialog } from './BaldeFormDialog';

type Status = 'loading' | 'ready' | 'error';

export function ReservasView() {
  const [competencia, setCompetencia] = useState(competenciaAtual);
  const [baldes, setBaldes] = useState<SaldoBaldeDTO[]>([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState<Status>('loading');

  const carregar = useCallback(async () => {
    setStatus('loading');
    try {
      const saldos = await reservasApi.saldos(competencia);
      setBaldes(saldos.baldes);
      setTotal(saldos.total);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [competencia]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reservas por objetivo</h1>
          <p className="text-sm text-muted-foreground">
            Organize sua reserva em baldes e acompanhe o saldo de cada objetivo.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NavegacaoMeses competencia={competencia} onSelecionar={setCompetencia} />
          <BaldeFormDialog
            onSalvo={carregar}
            trigger={
              <Button>
                <Plus />
                Novo balde
              </Button>
            }
          />
        </div>
      </header>

      {status === 'loading' && <ReservasSkeleton />}

      {status === 'error' && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-medium">Não foi possível carregar as reservas.</p>
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
        (baldes.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <PiggyBank className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Nenhum balde cadastrado.</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Crie baldes para separar sua reserva por objetivo (emergência, viagem, etc.).
              </p>
              <BaldeFormDialog
                onSalvo={carregar}
                trigger={
                  <Button>
                    <Plus />
                    Criar balde
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            <Card className="bg-primary/5">
              <CardContent className="flex items-center justify-between py-4">
                <span className="text-sm font-medium text-muted-foreground">Total reservado</span>
                <span className="text-2xl font-bold tabular-nums">{formatarReais(total)}</span>
              </CardContent>
            </Card>

            <div className="grid gap-4 sm:grid-cols-2">
              {baldes.map((item) => (
                <BaldeCard
                  key={item.balde.id}
                  item={item}
                  competencia={competencia}
                  onAlterado={carregar}
                />
              ))}
            </div>
          </div>
        ))}
    </main>
  );
}

function ReservasSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-16 w-full" />
      <div className="grid gap-4 sm:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    </div>
  );
}
