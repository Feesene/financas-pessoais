'use client';

import { useState } from 'react';
import { AlertTriangle, History, LineChart, Pencil, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { SaldoBaldeDTO } from '@financas-pessoais/shared';
import { reservasApi } from '@/lib/api/reservas';
import { ApiError } from '@/lib/api/http';
import { cn } from '@/lib/utils';
import { formatarReais } from '@/lib/format';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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
import { BaldeFormDialog } from './BaldeFormDialog';
import { MovimentoFormDialog } from './MovimentoFormDialog';
import { MovimentosBaldeDialog } from './MovimentosBaldeDialog';
import { EvolucaoDialog } from './EvolucaoDialog';

interface Props {
  item: SaldoBaldeDTO;
  /** Competência ativa para sugerir no formulário de movimento. */
  competencia: string;
  onAlterado: () => void;
}

export function BaldeCard({ item, competencia, onAlterado }: Props) {
  const { balde, saldo, negativo } = item;
  const [excluindo, setExcluindo] = useState(false);

  async function excluir() {
    setExcluindo(true);
    try {
      await reservasApi.excluirBalde(balde.id);
      toast.success('Balde excluído.');
      onAlterado();
    } catch (e) {
      if (e instanceof ApiError && e.status === 409) {
        toast.error('Não é possível excluir: há movimentos registrados neste balde.');
      } else if (e instanceof ApiError && e.status === 404) {
        toast.warning('Este balde já não existe; a lista foi atualizada.');
        onAlterado();
      } else {
        toast.error(e instanceof Error ? e.message : 'Erro ao excluir o balde.');
      }
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="h-1.5 w-full" style={{ backgroundColor: balde.cor ?? 'hsl(var(--muted))' }} />
      <CardContent className="flex flex-col gap-3 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate font-medium">{balde.nome}</p>
            <p
              className={cn(
                'text-2xl font-bold tabular-nums',
                negativo ? 'text-destructive' : 'text-foreground',
              )}
            >
              {formatarReais(saldo)}
            </p>
          </div>
          <div className="flex shrink-0 items-center">
            <MovimentosBaldeDialog
              balde={balde}
              onAlterado={onAlterado}
              trigger={
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Ver movimentos"
                  title="Ver movimentos"
                >
                  <History />
                </Button>
              }
            />
            <EvolucaoDialog
              balde={balde}
              trigger={
                <Button variant="ghost" size="icon" aria-label="Ver evolução" title="Ver evolução">
                  <LineChart />
                </Button>
              }
            />
          </div>
        </div>

        {negativo && (
          <p className="flex items-center gap-1.5 text-xs font-medium text-destructive">
            <AlertTriangle className="h-3.5 w-3.5" />
            Saldo negativo
          </p>
        )}

        <div className="flex items-center gap-1">
          <MovimentoFormDialog
            balde={balde}
            competenciaInicial={competencia}
            onSalvo={onAlterado}
            trigger={
              <Button size="sm" variant="outline" className="flex-1">
                <Plus />
                Movimentar
              </Button>
            }
          />
          <BaldeFormDialog
            balde={balde}
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
                <AlertDialogTitle>Excluir balde?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. O balde <strong>{balde.nome}</strong> será
                  removido permanentemente. Baldes com movimentos registrados não podem ser
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
      </CardContent>
    </Card>
  );
}
