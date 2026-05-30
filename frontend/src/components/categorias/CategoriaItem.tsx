'use client';

import { useState } from 'react';
import { Pencil, Target, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { CategoriaDTO } from '@financas-pessoais/shared';
import { categoriasApi } from '@/lib/api/categorias';
import { ApiError } from '@/lib/api/http';
import { formatarReais } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { MetaFormDialog } from './MetaFormDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CategoriaFormDialog } from './CategoriaFormDialog';

interface Props {
  categoria: CategoriaDTO;
  /** Competência ativa para gestão de metas (apenas despesas). */
  competencia?: string;
  /** Meta da competência ativa, ou null se não definida. */
  meta?: number | null;
  onAlterado: () => void;
}

export function CategoriaItem({ categoria, competencia, meta = null, onAlterado }: Props) {
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    setExcluindo(true);
    try {
      await categoriasApi.excluir(categoria.id);
      toast.success('Categoria excluída.');
      onAlterado();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error('Não é possível excluir: há lançamentos vinculados a esta categoria.');
      } else if (e instanceof ApiError && e.status === 404) {
        toast.warning('Esta categoria já não existe; a lista foi atualizada.');
        onAlterado();
      } else {
        toast.error(e instanceof Error ? e.message : 'Erro ao excluir a categoria.');
      }
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/40">
      <span
        className="h-4 w-4 shrink-0 rounded-full border"
        style={{ backgroundColor: categoria.cor ?? 'transparent' }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{categoria.nome}</p>
        {categoria.tipo === 'DESPESA' && competencia && (
          <p className="truncate text-xs text-muted-foreground">
            {meta !== null ? `Meta: ${formatarReais(meta)}` : 'Sem meta neste mês'}
          </p>
        )}
      </div>

      <div className="flex shrink-0 gap-1">
        {categoria.tipo === 'DESPESA' && competencia && (
          <MetaFormDialog
            categoria={categoria}
            competencia={competencia}
            valorAtual={meta}
            onSalvo={onAlterado}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                aria-label="Definir meta"
                title={meta !== null ? 'Editar meta' : 'Definir meta'}
              >
                <Target />
              </Button>
            }
          />
        )}
        <CategoriaFormDialog
          categoria={categoria}
          onSalvo={onAlterado}
          trigger={
            <Button variant="ghost" size="icon" aria-label="Editar" title="Editar">
              <Pencil />
            </Button>
          }
        />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Excluir"
              title="Excluir"
              disabled={excluindo}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2 />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Excluir categoria?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. A categoria <strong>{categoria.nome}</strong> será
                removida permanentemente. Categorias com lançamentos vinculados não podem ser
                excluídas.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={excluir}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Excluir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
