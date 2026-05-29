'use client';

import { useState } from 'react';
import { Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { LancamentoDTO } from '@financas-pessoais/shared';
import { ApiError, lancamentosApi } from '@/lib/api/lancamentos';
import { formatarReais } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { LancamentoFormDialog } from './LancamentoFormDialog';

interface Props {
  lancamento: LancamentoDTO;
  onAlterado: () => void;
}

export function LancamentoItem({ lancamento, onAlterado }: Props) {
  const [excluindo, setExcluindo] = useState(false);
  const receita = lancamento.tipo === 'RECEITA';

  async function excluir() {
    setExcluindo(true);
    try {
      await lancamentosApi.excluir(lancamento.id);
      toast.success('Lançamento excluído.');
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        toast.warning('Este lançamento já não existe; a lista foi atualizada.');
      } else {
        toast.error(e instanceof Error ? e.message : 'Erro ao excluir o lançamento.');
      }
    } finally {
      setExcluindo(false);
      onAlterado();
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/40">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{lancamento.descricao ?? lancamento.categoria}</p>
        {lancamento.descricao && (
          <p className="truncate text-xs text-muted-foreground">{lancamento.categoria}</p>
        )}
      </div>

      <span
        className={cn(
          'shrink-0 font-semibold tabular-nums',
          receita ? 'text-success' : 'text-destructive',
        )}
      >
        {receita ? '+' : '−'} {formatarReais(lancamento.valor)}
      </span>

      <div className="flex shrink-0 gap-1">
        <LancamentoFormDialog
          competencia={lancamento.competencia}
          lancamento={lancamento}
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
              <AlertDialogTitle>Excluir lançamento?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação não pode ser desfeita. O lançamento{' '}
                <strong>{lancamento.descricao ?? lancamento.categoria}</strong> (
                {formatarReais(lancamento.valor)}) será removido permanentemente.
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
