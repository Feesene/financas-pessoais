'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus, AlertTriangle, Inbox } from 'lucide-react';
import type {
  ConsumoCategoriaDTO,
  LancamentoDTO,
  ResumoMensalDTO,
} from '@financas-pessoais/shared';
import { lancamentosApi } from '@/lib/api/lancamentos';
import { categoriasApi } from '@/lib/api/categorias';
import { recorrenciasApi } from '@/lib/api/recorrencias';
import { competenciaLabel, isCompetenciaValida } from '@/lib/competencia';
import { useCompetencia } from '@/components/competencia/CompetenciaProvider';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { CartoesTotais } from './CartoesTotais';
import { ConsumoCategorias } from './ConsumoCategorias';
import { LancamentoFormDialog } from './LancamentoFormDialog';
import { ListaLancamentos } from './ListaLancamentos';
import { NavegacaoMeses } from './NavegacaoMeses';

type Status = 'loading' | 'ready' | 'error';

export function OrcamentoView() {
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

  const [lancamentos, setLancamentos] = useState<LancamentoDTO[]>([]);
  const [resumo, setResumo] = useState<ResumoMensalDTO | null>(null);
  const [consumo, setConsumo] = useState<ConsumoCategoriaDTO[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  // Refetch dos dados do mês. `comEsqueleto` controla se a tela troca para o
  // estado de carregamento (carga inicial/troca de competência) ou atualiza em
  // silêncio, preservando a rolagem — usado após registrar/desmarcar pagamento.
  const recarregar = useCallback(
    async (comEsqueleto: boolean) => {
      if (comEsqueleto) setStatus('loading');
      try {
        try {
          await recorrenciasApi.materializar(competencia);
        } catch {
          // Falha na materialização não deve impedir a leitura do orçamento existente.
        }
        const [lista, resumoMensal, consumoCategorias] = await Promise.all([
          lancamentosApi.listar(competencia),
          lancamentosApi.resumo(competencia),
          categoriasApi.consumo(competencia),
        ]);
        setLancamentos(lista);
        setResumo(resumoMensal);
        setConsumo(consumoCategorias);
        setStatus('ready');
      } catch {
        if (comEsqueleto) setStatus('error');
      }
    },
    [competencia],
  );

  const carregar = useCallback(() => recarregar(true), [recarregar]);
  const recarregarSilencioso = useCallback(() => recarregar(false), [recarregar]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Orçamento Mensal</h1>
          <p className="text-sm text-muted-foreground">{competenciaLabel(competencia)}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <NavegacaoMeses />
          <LancamentoFormDialog
            competencia={competencia}
            onSalvo={recarregarSilencioso}
            trigger={
              <Button className="w-full sm:w-auto">
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

          <ConsumoCategorias consumo={consumo} />

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
            <ListaLancamentos lancamentos={lancamentos} onAlterado={recarregarSilencioso} />
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
