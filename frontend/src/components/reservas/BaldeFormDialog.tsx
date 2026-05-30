'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Check, X } from 'lucide-react';
import type { BaldeDTO } from '@financas-pessoais/shared';
import { reservasApi } from '@/lib/api/reservas';
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

const PALETA = [
  '#ef4444',
  '#f97316',
  '#f59e0b',
  '#84cc16',
  '#22c55e',
  '#14b8a6',
  '#3b82f6',
  '#6366f1',
  '#a855f7',
  '#ec4899',
];

interface Props {
  /** Quando presente, o diálogo opera em modo edição. */
  balde?: BaldeDTO;
  trigger: React.ReactNode;
  onSalvo: () => void;
}

export function BaldeFormDialog({ balde, trigger, onSalvo }: Props) {
  const edicao = Boolean(balde);
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState(balde?.nome ?? '');
  const [saldoInicial, setSaldoInicial] = useState(
    balde ? String(balde.saldoInicial) : '0',
  );
  const [cor, setCor] = useState<string | null>(balde?.cor ?? null);
  const [enviando, setEnviando] = useState(false);

  const valorInicial = Number(saldoInicial.replace(',', '.'));
  const valido = nome.trim().length > 0 && Number.isFinite(valorInicial) && valorInicial >= 0;

  function resetar() {
    setNome(balde?.nome ?? '');
    setSaldoInicial(balde ? String(balde.saldoInicial) : '0');
    setCor(balde?.cor ?? null);
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
      if (balde) {
        await reservasApi.atualizarBalde(balde.id, {
          nome: nome.trim(),
          saldoInicial: valorInicial,
          cor,
        });
        toast.success('Balde atualizado.');
      } else {
        await reservasApi.criarBalde({ nome: nome.trim(), saldoInicial: valorInicial, cor });
        toast.success('Balde criado.');
      }
      setAberto(false);
      onSalvo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar o balde.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edicao ? 'Editar balde' : 'Novo balde'}</DialogTitle>
          <DialogDescription>
            {edicao
              ? 'Atualize o nome, o saldo inicial e a cor do objetivo.'
              : 'Defina um objetivo de reserva com saldo inicial e cor opcional.'}
          </DialogDescription>
        </DialogHeader>

        <form id="form-balde" onSubmit={submeter} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="nome-balde">Nome</Label>
            <Input
              id="nome-balde"
              value={nome}
              maxLength={80}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex.: Reserva de emergência"
              autoComplete="off"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="saldo-inicial">Saldo inicial (R$)</Label>
            <Input
              id="saldo-inicial"
              type="number"
              min={0}
              step="0.01"
              value={saldoInicial}
              onChange={(e) => setSaldoInicial(e.target.value)}
              placeholder="0,00"
            />
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
                    cor?.toLowerCase() === c ? 'ring-2 ring-ring ring-offset-2 ring-offset-background' : '',
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
          <Button type="submit" form="form-balde" disabled={!valido || enviando}>
            {enviando ? 'Salvando…' : edicao ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
