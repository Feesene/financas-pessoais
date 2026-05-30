'use client';

import { useState } from 'react';
import { CreditCard, Pencil, Repeat, Square } from 'lucide-react';
import { toast } from 'sonner';
import type { CategoriaDTO, RegraRecorrenteDTO } from '@financas-pessoais/shared';
import { recorrenciasApi } from '@/lib/api/recorrencias';
import { ApiError } from '@/lib/api/http';
import { competenciaLabel } from '@/lib/competencia';
import { formatarReais } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
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
import { RecorrenciaFormDialog } from './RecorrenciaFormDialog';

interface Props {
  regra: RegraRecorrenteDTO;
  categoria?: CategoriaDTO;
  categorias: CategoriaDTO[];
  onAlterado: () => void;
}

export function RecorrenciaItem({ regra, categoria, categorias, onAlterado }: Props) {
  const [encerrando, setEncerrando] = useState(false);
  const receita = regra.tipo === 'RECEITA';
  const parcelamento = regra.numeroParcelas != null;
  const Icone = parcelamento ? CreditCard : Repeat;

  const vigencia = parcelamento
    ? `${competenciaLabel(regra.competenciaInicio)} · ${regra.numeroParcelas}x`
    : `Desde ${competenciaLabel(regra.competenciaInicio)}${
        regra.competenciaFim ? ` até ${competenciaLabel(regra.competenciaFim)}` : ''
      }`;

  async function encerrar() {
    setEncerrando(true);
    try {
      await recorrenciasApi.encerrar(regra.id);
      toast.success('Regra encerrada. Ocorrências passadas permanecem.');
      onAlterado();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        toast.warning('Esta regra já não existe; a lista foi atualizada.');
        onAlterado();
      } else {
        toast.error(e instanceof Error ? e.message : 'Erro ao encerrar a regra.');
      }
    } finally {
      setEncerrando(false);
    }
  }

  return (
    <div className="flex items-center gap-3 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-accent/40">
      <Icone className="h-5 w-5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">
          {regra.descricao ?? categoria?.nome ?? 'Regra'}
          {!regra.ativa && (
            <Badge variant="outline" className="ml-2 align-middle text-muted-foreground">
              Encerrada
            </Badge>
          )}
        </p>
        <p className="truncate text-xs text-muted-foreground">
          {categoria?.nome ? `${categoria.nome} · ` : ''}
          {vigencia}
        </p>
      </div>

      <span
        className={cn(
          'shrink-0 text-right font-semibold tabular-nums',
          receita ? 'text-success' : 'text-destructive',
        )}
      >
        {receita ? '+' : '−'} {formatarReais(regra.valorBase)}
        <span className="block text-xs font-normal text-muted-foreground">
          {parcelamento ? 'total' : 'por mês'}
        </span>
      </span>

      {regra.ativa && (
        <div className="flex shrink-0 gap-1">
          <RecorrenciaFormDialog
            categorias={categorias}
            regra={regra}
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
                aria-label="Encerrar"
                title="Encerrar"
                disabled={encerrando}
                className="text-muted-foreground hover:text-destructive"
              >
                <Square />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Encerrar regra?</AlertDialogTitle>
                <AlertDialogDescription>
                  A regra deixará de gerar novos lançamentos a partir dos próximos meses. As
                  ocorrências já materializadas permanecem inalteradas.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={encerrar}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Encerrar
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      )}
    </div>
  );
}
