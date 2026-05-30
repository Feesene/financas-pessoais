'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Plus, Repeat } from 'lucide-react';
import type { CategoriaDTO, RegraRecorrenteDTO } from '@financas-pessoais/shared';
import { recorrenciasApi } from '@/lib/api/recorrencias';
import { categoriasApi } from '@/lib/api/categorias';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { RecorrenciaFormDialog } from './RecorrenciaFormDialog';
import { RecorrenciaItem } from './RecorrenciaItem';

type Status = 'loading' | 'ready' | 'error';

export function RecorrenciasView() {
  const [regras, setRegras] = useState<RegraRecorrenteDTO[]>([]);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [status, setStatus] = useState<Status>('loading');

  const carregar = useCallback(async () => {
    setStatus('loading');
    try {
      const [listaRegras, listaCategorias] = await Promise.all([
        recorrenciasApi.listar(),
        categoriasApi.listar(),
      ]);
      setRegras(listaRegras);
      setCategorias(listaCategorias);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const categoriaPorId = new Map(categorias.map((c) => [c.id, c]));
  const ativas = regras.filter((r) => r.ativa);
  const encerradas = regras.filter((r) => !r.ativa);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recorrências e Parcelas</h1>
          <p className="text-sm text-muted-foreground">
            Regras que geram lançamentos automaticamente a cada mês.
          </p>
        </div>
        <RecorrenciaFormDialog
          categorias={categorias}
          onSalvo={carregar}
          trigger={
            <Button>
              <Plus />
              Nova recorrência
            </Button>
          }
        />
      </header>

      {status === 'loading' && <RecorrenciasSkeleton />}

      {status === 'error' && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-medium">Não foi possível carregar as recorrências.</p>
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
        (regras.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <Repeat className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Nenhuma recorrência cadastrada.</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Crie uma recorrência mensal (ex.: salário, aluguel) ou um parcelamento para gerar
                lançamentos automaticamente.
              </p>
              <RecorrenciaFormDialog
                categorias={categorias}
                onSalvo={carregar}
                trigger={
                  <Button>
                    <Plus />
                    Criar recorrência
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            <section className="space-y-3">
              <h2 className="border-b pb-2 text-lg font-semibold">Ativas</h2>
              <div className="space-y-2">
                {ativas.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhuma regra ativa.</p>
                ) : (
                  ativas.map((regra) => (
                    <RecorrenciaItem
                      key={regra.id}
                      regra={regra}
                      categoria={categoriaPorId.get(regra.categoriaId)}
                      categorias={categorias}
                      onAlterado={carregar}
                    />
                  ))
                )}
              </div>
            </section>

            {encerradas.length > 0 && (
              <section className="space-y-3">
                <h2 className="border-b pb-2 text-lg font-semibold">Encerradas</h2>
                <div className="space-y-2">
                  {encerradas.map((regra) => (
                    <RecorrenciaItem
                      key={regra.id}
                      regra={regra}
                      categoria={categoriaPorId.get(regra.categoriaId)}
                      categorias={categorias}
                      onAlterado={carregar}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        ))}
    </main>
  );
}

function RecorrenciasSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-32" />
      {[0, 1, 2].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
