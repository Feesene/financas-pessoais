'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import type { CategoriaDTO, TipoLancamento } from '@financas-pessoais/shared';
import { categoriasApi } from '@/lib/api/categorias';
import { cn } from '@/lib/utils';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const PALETA = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#f5ff2b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
  '#202020',
  '#d4d4d4',
];

interface Props {
  /** Quando presente, o diálogo opera em modo edição. */
  categoria?: CategoriaDTO;
  trigger: React.ReactNode;
  onSalvo: () => void;
}

export function CategoriaFormDialog({ categoria, trigger, onSalvo }: Props) {
  const edicao = Boolean(categoria);
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(categoria?.nome ?? '');
  const [tipo, setTipo] = useState<TipoLancamento>(categoria?.tipo ?? 'DESPESA');
  const [cor, setCor] = useState<string | null>(categoria?.cor ?? null);
  const [enviando, setEnviando] = useState(false);

  const valido = nome.trim().length > 0;

  function resetar() {
    setNome(categoria?.nome ?? '');
    setTipo(categoria?.tipo ?? 'DESPESA');
    setCor(categoria?.cor ?? null);
  }

  function aoMudarAbertura(estado: boolean) {
    setAberto(estado);
    if (estado) resetar();
  }

  async function submeter(event: React.FormEvent) {
    event.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    try {
      if (categoria) {
        await categoriasApi.atualizar(categoria.id, { nome: nome.trim(), cor });
        toast.success('Categoria atualizada.');
      } else {
        await categoriasApi.criar({ nome: nome.trim(), tipo, cor });
        toast.success('Categoria criada.');
      }
      setAberto(false);
      onSalvo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar a categoria.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edicao ? 'Editar categoria' : 'Nova categoria'}</DialogTitle>
          <DialogDescription>
            {edicao
              ? 'Atualize o nome e a cor da categoria.'
              : 'Defina o nome, o tipo e uma cor opcional.'}
          </DialogDescription>
        </DialogHeader>

        <form id="form-categoria" onSubmit={submeter} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              value={nome}
              maxLength={80}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Alimentação"
              autoComplete="off"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as TipoLancamento)}
              disabled={edicao}
            >
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESPESA">Despesa</SelectItem>
                <SelectItem value="RECEITA">Receita</SelectItem>
              </SelectContent>
            </Select>
            {edicao && (
              <p className="text-xs text-muted-foreground">O tipo não pode ser alterado.</p>
            )}
          </div>

          <div className="grid gap-2">
            <Label>Cor</Label>
            <div className="flex flex-wrap items-center gap-2">
              {PALETA.map((c) => (
                <button
                  key={c}
                  type="button"
                  aria-label={`Selecionar cor ${c}`}
                  onClick={() => setCor(c)}
                  className={cn(
                    'flex h-7 w-7 items-center justify-center rounded-full border transition-transform hover:scale-110',
                    cor?.toLowerCase() === c
                      ? 'ring-2 ring-ring ring-offset-2 ring-offset-background'
                      : '',
                  )}
                  style={{ backgroundColor: c }}
                >
                  {cor?.toLowerCase() === c && <Check className="h-4 w-4 text-white" />}
                </button>
              ))}
              <button
                type="button"
                aria-label="Sem cor"
                title="Sem cor"
                onClick={() => setCor(null)}
                className={cn(
                  'flex h-7 w-7 items-center justify-center rounded-full border text-muted-foreground transition-transform hover:scale-110',
                  cor === null ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : '',
                )}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" form="form-categoria" disabled={!valido || enviando}>
            {enviando ? 'Salvando…' : edicao ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
