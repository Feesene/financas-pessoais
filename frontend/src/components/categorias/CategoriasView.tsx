'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Plus, Tag } from 'lucide-react';
import type { CategoriaDTO, TipoLancamento } from '@financas-pessoais/shared';
import { categoriasApi } from '@/lib/api/categorias';
import { competenciaAtual } from '@/lib/competencia';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { NavegacaoMeses } from '@/components/orcamento/NavegacaoMeses';
import { CategoriaFormDialog } from './CategoriaFormDialog';
import { CategoriaItem } from './CategoriaItem';

type Status = 'loading' | 'ready' | 'error';

const ROTULO_TIPO: Record<TipoLancamento, string> = {
  RECEITA: 'Receitas',
  DESPESA: 'Despesas',
};

const ORDEM_TIPOS: TipoLancamento[] = ['DESPESA', 'RECEITA'];

export function CategoriasView() {
  const [competencia, setCompetencia] = useState(competenciaAtual);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);
  const [metaPorCategoria, setMetaPorCategoria] = useState<Map<string, number>>(new Map());
  const [status, setStatus] = useState<Status>('loading');

  const carregar = useCallback(async () => {
    setStatus('loading');
    try {
      const [lista, consumo] = await Promise.all([
        categoriasApi.listar(),
        categoriasApi.consumo(competencia),
      ]);
      const metas = new Map<string, number>();
      for (const c of consumo) {
        if (c.meta !== null) metas.set(c.categoria.id, c.meta);
      }
      setCategorias(lista);
      setMetaPorCategoria(metas);
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
          <h1 className="text-2xl font-bold tracking-tight">Categorias</h1>
          <p className="text-sm text-muted-foreground">
            Organize receitas e despesas e defina metas mensais.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <NavegacaoMeses competencia={competencia} onSelecionar={setCompetencia} />
          <CategoriaFormDialog
            onSalvo={carregar}
            trigger={
              <Button>
                <Plus />
                Nova categoria
              </Button>
            }
          />
        </div>
      </header>

      {status === 'loading' && <CategoriasSkeleton />}

      {status === 'error' && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-medium">Não foi possível carregar as categorias.</p>
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
        (categorias.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
              <Tag className="h-8 w-8 text-muted-foreground" />
              <p className="font-medium">Nenhuma categoria cadastrada.</p>
              <p className="max-w-sm text-sm text-muted-foreground">
                Crie categorias para classificar seus lançamentos e acompanhar metas.
              </p>
              <CategoriaFormDialog
                onSalvo={carregar}
                trigger={
                  <Button>
                    <Plus />
                    Criar categoria
                  </Button>
                }
              />
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {ORDEM_TIPOS.map((tipo) => {
              const doTipo = categorias.filter((c) => c.tipo === tipo);
              if (doTipo.length === 0) return null;
              return (
                <section key={tipo} className="space-y-3">
                  <h2 className="border-b pb-2 text-lg font-semibold">{ROTULO_TIPO[tipo]}</h2>
                  <div className="space-y-2">
                    {doTipo.map((categoria) => (
                      <CategoriaItem
                        key={categoria.id}
                        categoria={categoria}
                        competencia={tipo === 'DESPESA' ? competencia : undefined}
                        meta={metaPorCategoria.get(categoria.id) ?? null}
                        onAlterado={carregar}
                      />
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        ))}
    </main>
  );
}

function CategoriasSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-32" />
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-14 w-full" />
      ))}
    </div>
  );
}
