'use client';

import { useState } from 'react';
import { History, MoreVertical, Pencil, Repeat, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  contaNoModo,
  valorEfetivo,
  type LancamentoDTO,
  type ModoValor,
} from '@financas-pessoais/shared';
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
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { LancamentoFormDialog } from './LancamentoFormDialog';
import { PagamentoDialog } from './PagamentoDialog';
import { HistoricoRecorrenciaDialog } from './HistoricoRecorrenciaDialog';

interface Props {
  lancamento: LancamentoDTO;
  modo: ModoValor;
  onAlterado: () => void;
}

export function LancamentoItem({ lancamento, modo, onAlterado }: Props) {
  const [excluindo, setExcluindo] = useState(false);
  const [registrandoPagamento, setRegistrandoPagamento] = useState(false);
  const [pagamentoAberto, setPagamentoAberto] = useState(false);
  const [edicaoAberta, setEdicaoAberta] = useState(false);
  const [historicoAberto, setHistoricoAberto] = useState(false);
  const [exclusaoAberta, setExclusaoAberta] = useState(false);
  const receita = lancamento.tipo === 'RECEITA';
  const deRegra = lancamento.origemRegraId !== null;
  const pago = lancamento.pago;
  const valorReal = valorEfetivo(lancamento);
  // No modo Realizado a ocorrência ainda não paga continua na lista, mas fora do
  // subtotal — o esmaecido explica por que os números não fecham com a leitura.
  const foraDoTotal = !contaNoModo(lancamento, modo);
  const mostraReal =
    pago && lancamento.valorPago !== null && lancamento.valorPago !== lancamento.valor;

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
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg border bg-card px-3 py-3 transition-colors hover:bg-accent/40 sm:gap-3 sm:px-4',
        foraDoTotal && 'opacity-55',
      )}
      title={foraDoTotal ? 'Ainda não paga — fora do total realizado' : undefined}
    >
      <div className="min-w-0 flex-1">
        <p className="flex items-start gap-1.5 font-medium">
          {deRegra && (
            <Repeat
              className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground"
              aria-label="Gerado por recorrência"
            />
          )}
          <span className="line-clamp-2 min-w-0 break-words">
            {lancamento.descricao ?? lancamento.categoria}
          </span>
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
          <span className="sr-only sm:not-sr-only">Pago</span>
        </label>
      )}

      <div className="flex shrink-0 flex-col items-end">
        <span
          className={cn(
            'whitespace-nowrap font-semibold tabular-nums',
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

      {/* Desktop: ações sempre visíveis. */}
      <div className="hidden shrink-0 gap-1 sm:flex">
        {deRegra && (
          <Button
            variant="ghost"
            size="icon"
            aria-label="Histórico da recorrência"
            title="Histórico da recorrência"
            onClick={() => setHistoricoAberto(true)}
          >
            <History />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          aria-label="Editar"
          title="Editar"
          onClick={() => setEdicaoAberta(true)}
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Excluir"
          title="Excluir"
          disabled={excluindo}
          className="text-muted-foreground hover:text-destructive"
          onClick={() => setExclusaoAberta(true)}
        >
          <Trash2 />
        </Button>
      </div>

      {/* Mobile: ações agrupadas num menu para sobrar espaço para a descrição. */}
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="-mr-2 shrink-0 sm:hidden"
            aria-label="Ações do lançamento"
          >
            <MoreVertical />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem onSelect={() => setEdicaoAberta(true)}>
            <Pencil />
            Editar
          </DropdownMenuItem>
          {deRegra && (
            <DropdownMenuItem onSelect={() => setHistoricoAberto(true)}>
              <History />
              Histórico da recorrência
            </DropdownMenuItem>
          )}
          <DropdownMenuSeparator />
          <DropdownMenuItem
            disabled={excluindo}
            onSelect={() => setExclusaoAberta(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <LancamentoFormDialog
        competencia={lancamento.competencia}
        lancamento={lancamento}
        aberto={edicaoAberta}
        onAbertoChange={setEdicaoAberta}
        onSalvo={onAlterado}
      />

      {deRegra && (
        <HistoricoRecorrenciaDialog
          lancamento={lancamento}
          aberto={historicoAberto}
          onAbertoChange={setHistoricoAberto}
        />
      )}

      <AlertDialog open={exclusaoAberta} onOpenChange={setExclusaoAberta}>
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
