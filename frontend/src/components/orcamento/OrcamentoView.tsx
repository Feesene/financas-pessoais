'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Plus, AlertTriangle, Inbox } from 'lucide-react';
import type { LancamentoDTO, ResumoMensalDTO } from '@financas-pessoais/shared';
import { lancamentosApi } from '@/lib/api/lancamentos';
import { competenciaAtual, competenciaLabel, isCompetenciaValida } from '@/lib/competencia';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CartoesTotais } from './CartoesTotais';
import { LancamentoFormDialog } from './LancamentoFormDialog';
import { ListaLancamentos } from './ListaLancamentos';
import { NavegacaoMeses } from './NavegacaoMeses';

type Status = 'loading' | 'ready' | 'error';

export function OrcamentoView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const competenciaParam = searchParams.get('competencia');
  const competencia =
    competenciaParam && isCompetenciaValida(competenciaParam)
      ? competenciaParam
      : competenciaAtual();

  const irParaCompetencia = useCallback(
    (nova: string) => {
      router.push(`${pathname}?competencia=${nova}`);
    },
    [router, pathname],
  );

  const [lancamentos, setLancamentos] = useState<LancamentoDTO[]>([]);
  const [resumo, setResumo] = useState<ResumoMensalDTO | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const carregar = useCallback(async () => {
    setStatus('loading');
    try {
      const [lista, resumoMensal] = await Promise.all([
        lancamentosApi.listar(competencia),
        lancamentosApi.resumo(competencia),
      ]);
      setLancamentos(lista);
      setResumo(resumoMensal);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [competencia]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <main className="container max-w-4xl py-8">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamento Mensal</h1>
          <p className="text-sm capitalize text-muted-foreground">
            {competenciaLabel(competencia)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NavegacaoMeses competencia={competencia} onSelecionar={irParaCompetencia} />
          <LancamentoFormDialog
            competencia={competencia}
            onSalvo={carregar}
            trigger={
              <Button>
                <Plus />
                Novo lançamento
              </Button>
            }
          />
        </div>
      </header>

      {status === 'loading' && <OrcamentoSkeleton />}

      {status === 'error' && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-medium">Não foi possível carregar o orçamento.</p>
            <p className="text-sm text-muted-foreground">
              Verifique se o servidor da API está em execução e tente novamente.
            </p>
            <Button variant="outline" onClick={carregar}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {status === 'ready' && resumo && (
        <div className="space-y-8">
          <CartoesTotais resumo={resumo} />

          {lancamentos.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
                <Inbox className="h-8 w-8 text-muted-foreground" />
                <p className="font-medium">Nenhum lançamento neste mês.</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Comece adicionando sua primeira receita ou despesa para acompanhar o orçamento.
                </p>
                <LancamentoFormDialog
                  competencia={competencia}
                  onSalvo={carregar}
                  trigger={
                    <Button>
                      <Plus />
                      Adicionar lançamento
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          ) : (
            <ListaLancamentos lancamentos={lancamentos} onAlterado={carregar} />
          )}
        </div>
      )}
    </main>
  );
}

function OrcamentoSkeleton() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-[5.75rem] w-full" />
        ))}
      </div>
      <div className="space-y-3">
        <Skeleton className="h-6 w-32" />
        {[0, 1, 2].map((i) => (
          <Skeleton key={i} className="h-14 w-full" />
        ))}
      </div>
    </div>
  );
}
