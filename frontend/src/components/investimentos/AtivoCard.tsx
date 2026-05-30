'use client';

import { useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AtivoDTO } from '@financas-pessoais/shared';
import { investimentosApi } from '@/lib/api/investimentos';
import { ApiError } from '@/lib/api/http';
import { ehAtivoCotado } from '@/lib/investimentos';
import { formatarReais } from '@/lib/format';
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
import { AtivoFormDialog } from './AtivoFormDialog';
import { MovimentoCarteiraFormDialog } from './MovimentoCarteiraFormDialog';

interface Props {
  ativo: AtivoDTO;
  /** Competência ativa sugerida no formulário de movimento. */
  competencia: string;
  onAlterado: () => void;
}

export function AtivoCard({ ativo, competencia, onAlterado }: Props) {
  const [excluindo, setExcluindo] = useState(false);
  const cotado = ehAtivoCotado(ativo.tipo);

  async function excluir() {
    setExcluindo(true);
    try {
      await investimentosApi.excluirAtivo(ativo.id);
      toast.success('Ativo excluído.');
      onAlterado();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error('Não é possível excluir: há movimentos registrados neste ativo.');
      } else if (e instanceof ApiError && e.status === 404) {
        toast.warning('Este ativo já não existe; a lista foi atualizada.');
        onAlterado();
      } else {
        toast.error(e instanceof Error ? e.message : 'Erro ao excluir o ativo.');
      }
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-medium">{ativo.descricao}</p>
        <p className="text-xs text-muted-foreground">
          {cotado
            ? `${ativo.quantidade} × ${formatarReais(ativo.valorUnitario ?? 0)}`
            : 'Valor informado'}
          {ativo.rendimento > 0 && ` · rendimento ${formatarReais(ativo.rendimento)}`}
        </p>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg font-semibold tabular-nums">{formatarReais(ativo.valorBruto)}</span>
        <div className="flex items-center">
          <MovimentoCarteiraFormDialog
            ativo={ativo}
            competenciaInicial={competencia}
            onSalvo={onAlterado}
            trigger={
              <Button variant="ghost" size="icon" aria-label="Movimentar" title="Movimentar">
                <Plus />
              </Button>
            }
          />
          <AtivoFormDialog
            ativo={ativo}
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
                <AlertDialogTitle>Excluir ativo?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O ativo <strong>{ativo.descricao}</strong> será
                  removido permanentemente. Ativos com movimentos registrados não podem ser
                  excluídos.
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
    </div>
  );
}
