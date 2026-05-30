'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { CategoriaDTO } from '@financas-pessoais/shared';
import { categoriasApi } from '@/lib/api/categorias';
import { ApiError } from '@/lib/api/http';
import { competenciaLabel } from '@/lib/competencia';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  categoria: CategoriaDTO;
  competencia: string;
  /** Meta atual da competência, ou null se ainda não definida. */
  valorAtual: number | null;
  trigger: React.ReactNode;
  onSalvo: () => void;
}

export function MetaFormDialog({ categoria, competencia, valorAtual, trigger, onSalvo }: Props) {
  const [aberto, setAberto] = useState(false);
  const [valor, setValor] = useState(valorAtual !== null ? String(valorAtual) : '');
  const [enviando, setEnviando] = useState(false);

  const valorNumerico = Number(valor);
  const valido = valor !== '' && valorNumerico > 0;

  function aoMudarAbertura(estado: boolean) {
    setAberto(estado);
    if (estado) setValor(valorAtual !== null ? String(valorAtual) : '');
  }

  async function salvar(event: React.FormEvent) {
    event.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    try {
      await categoriasApi.definirMeta(categoria.id, {
        competencia,
        valor: Number(valorNumerico.toFixed(2)),
      });
      toast.success('Meta definida.');
      setAberto(false);
      onSalvo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao definir a meta.');
    } finally {
      setEnviando(false);
    }
  }

  async function remover() {
    if (enviando) return;
    setEnviando(true);
    try {
      await categoriasApi.removerMeta(categoria.id, competencia);
      toast.success('Meta removida.');
      setAberto(false);
      onSalvo();
    } catch (e) {
      if (e instanceof ApiError && e.status === 404) {
        toast.warning('Esta meta já não existe; a lista foi atualizada.');
        setAberto(false);
        onSalvo();
      } else {
        toast.error(e instanceof Error ? e.message : 'Erro ao remover a meta.');
      }
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Meta de {categoria.nome}</DialogTitle>
          <DialogDescription>
            Defina o limite de gasto para <strong>{competenciaLabel(competencia)}</strong>.
          </DialogDescription>
        </DialogHeader>

        <form id="form-meta" onSubmit={salvar} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="valor-meta">Valor da meta (R$)</Label>
            <Input
              id="valor-meta"
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
              autoFocus
            />
          </div>
        </form>

        <DialogFooter className="sm:justify-between">
          {valorAtual !== null ? (
            <Button type="button" variant="ghost" onClick={remover} disabled={enviando}>
              Remover meta
            </Button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" form="form-meta" disabled={!valido || enviando}>
              {enviando ? 'Salvando…' : 'Salvar meta'}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
