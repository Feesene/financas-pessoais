'use client';

import { useState } from 'react';
import { Pencil, Repeat, Trash2 } from 'lucide-react';
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
import { PagamentoDialog } from './PagamentoDialog';

interface Props {
  lancamento: LancamentoDTO;
  onAlterado: () => void;
}

export function LancamentoItem({ lancamento, onAlterado }: Props) {
  const [excluindo, setExcluindo] = useState(false);
  const [registrandoPagamento, setRegistrandoPagamento] = useState(false);
  const [pagamentoAberto, setPagamentoAberto] = useState(false);
  const receita = lancamento.tipo === 'RECEITA';
  const deRegra = lancamento.origemRegraId !== null;
  const pago = lancamento.pago;
  const valorReal = pago && lancamento.valorPago !== null ? lancamento.valorPago : lancamento.valor;
  const mostraReal = pago && lancamento.valorPago !== null && lancamento.valorPago !== lancamento.valor;

  function aoAlternarPago(marcando: boolean) {
    if (marcando) {
      setPagamentoAberto(true);
    } else {
      desmarcarPagamento();
    }
  }

  async function desmarcarPagamento() {
    setRegistrandoPagamento(true);
    try {
      await lancamentosApi.registrarPagamento(lancamento.id, { pago: false });
      toast.success('Pagamento desmarcado.');
      onAlterado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao desmarcar o pagamento.');
    } finally {
      setRegistrandoPagamento(false);
    }
  }

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
        <p className="flex items-center gap-1.5 font-medium">
          {deRegra && (
            <Repeat
              className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
              aria-label="Gerado por recorrência"
            />
          )}
          <span className="truncate">{lancamento.descricao ?? lancamento.categoria}</span>
        </p>
        {lancamento.descricao && (
          <p className="truncate text-xs text-muted-foreground">{lancamento.categoria}</p>
        )}
      </div>

      {deRegra && (
        <label
          className="flex shrink-0 cursor-pointer items-center gap-1.5 text-xs text-muted-foreground"
          title="Marcar ocorrência como paga"
        >
          <input
            type="checkbox"
            className="h-4 w-4 cursor-pointer accent-primary"
            checked={pago}
            disabled={registrandoPagamento}
            onChange={(e) => aoAlternarPago(e.target.checked)}
          />
          Pago
        </label>
      )}

      <div className="flex shrink-0 flex-col items-end">
        <span
          className={cn(
            'font-semibold tabular-nums',
            receita ? 'text-success' : 'text-destructive',
          )}
        >
          {receita ? '+' : '−'} {formatarReais(valorReal)}
        </span>
        {mostraReal && (
          <span className="text-xs text-muted-foreground tabular-nums">
            Previsto {formatarReais(lancamento.valor)}
          </span>
        )}
      </div>

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
                {deRegra &&
                  ' Por ter origem em uma recorrência, esta ocorrência não será recriada ao reabrir o mês.'}
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

      {deRegra && (
        <PagamentoDialog
          lancamento={lancamento}
          aberto={pagamentoAberto}
          onOpenChange={setPagamentoAberto}
          onRegistrado={onAlterado}
        />
      )}
    </div>
  );
}
