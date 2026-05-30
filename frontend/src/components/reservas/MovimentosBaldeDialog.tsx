'use client';

import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { BaldeDTO, MovimentoReservaDTO } from '@financas-pessoais/shared';
import { reservasApi } from '@/lib/api/reservas';
import { ApiError } from '@/lib/api/http';
import { competenciaLabel } from '@/lib/competencia';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

type Status = 'loading' | 'ready' | 'error';

interface Props {
  balde: BaldeDTO;
  trigger: React.ReactNode;
  /** Chamado após excluir um movimento, para recarregar os saldos da página. */
  onAlterado: () => void;
}

const dataHora = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function MovimentosBaldeDialog({ balde, trigger, onAlterado }: Props) {
  const [aberto, setAberto] = useState(false);
  const [movimentos, setMovimentos] = useState<MovimentoReservaDTO[]>([]);
  const [status, setStatus] = useState<Status>('loading');
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  async function carregar() {
    setStatus('loading');
    try {
      const dados = await reservasApi.listarMovimentosBalde(balde.id);
      setMovimentos(dados);
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }

  async function aoMudarAbertura(estado: boolean) {
    setAberto(estado);
    if (estado) await carregar();
  }

  async function excluir(id: string) {
    setExcluindoId(id);
    try {
      await reservasApi.excluirMovimento(id);
      toast.success('Movimento excluído.');
      await carregar();
      onAlterado();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        toast.warning('Este movimento já não existe; a lista foi atualizada.');
        await carregar();
        onAlterado();
      } else {
        toast.error(e instanceof Error ? e.message : 'Erro ao excluir o movimento.');
      }
    } finally {
      setExcluindoId(null);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Movimentos de “{balde.nome}”</DialogTitle>
          <DialogDescription>
            Aportes e retiradas registrados neste balde, do mais recente ao mais antigo.
          </DialogDescription>
        </DialogHeader>

        {status === 'loading' && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        )}

        {status === 'error' && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Não foi possível carregar os movimentos. Tente novamente.
          </p>
        )}

        {status === 'ready' &&
          (movimentos.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">
              Sem movimentos registrados.
            </p>
          ) : (
            <ul className="max-h-[60vh] space-y-2 overflow-y-auto">
              {movimentos.map((movimento) => {
                const aporte = movimento.tipo === 'APORTE';
                return (
                  <li
                    key={movimento.id}
                    className="flex items-center gap-3 rounded-lg border bg-card px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {movimento.descricao ?? (aporte ? 'Aporte' : 'Retirada')}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {competenciaLabel(movimento.competencia)} ·{' '}
                        {dataHora.format(new Date(movimento.criadoEm))}
                      </p>
                    </div>
                    <span
                      className={cn(
                        'shrink-0 text-sm font-semibold tabular-nums',
                        aporte ? 'text-success' : 'text-destructive',
                      )}
                    >
                      {aporte ? '+' : '−'} {formatarReais(movimento.valor)}
                    </span>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Excluir movimento"
                          title="Excluir movimento"
                          disabled={excluindoId === movimento.id}
                          className="shrink-0 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir movimento?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita. O movimento de{' '}
                            {formatarReais(movimento.valor)} será removido e o saldo do balde será
                            recalculado.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => excluir(movimento.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </li>
                );
              })}
            </ul>
          ))}
      </DialogContent>
    </Dialog>
  );
}
