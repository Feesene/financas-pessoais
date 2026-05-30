'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { LancamentoDTO } from '@financas-pessoais/shared';
import { lancamentosApi } from '@/lib/api/lancamentos';
import { formatarReais } from '@/lib/format';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Props {
  lancamento: LancamentoDTO;
  aberto: boolean;
  onOpenChange: (aberto: boolean) => void;
  onRegistrado: () => void;
}

/** Diálogo para marcar uma ocorrência como paga informando o valor real (default = previsto). */
export function PagamentoDialog({ lancamento, aberto, onOpenChange, onRegistrado }: Props) {
  const [valor, setValor] = useState(String(lancamento.valor));
  const [enviando, setEnviando] = useState(false);

  const valorNumerico = Number(valor);
  const valido = valor !== '' && valorNumerico > 0;

  function aoMudarAbertura(estado: boolean) {
    if (estado) setValor(String(lancamento.valor));
    onOpenChange(estado);
  }

  async function confirmar(event: React.FormEvent) {
    event.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    try {
      await lancamentosApi.registrarPagamento(lancamento.id, {
        pago: true,
        valorPago: Number(valorNumerico.toFixed(2)),
      });
      toast.success('Pagamento registrado.');
      onOpenChange(false);
      onRegistrado();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar o pagamento.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Registrar pagamento</DialogTitle>
          <DialogDescription>
            Previsto {formatarReais(lancamento.valor)}. Informe o valor realmente pago.
          </DialogDescription>
        </DialogHeader>

        <form id="form-pagamento" onSubmit={confirmar} className="grid gap-2 py-2">
          <Label htmlFor="valorPago">Valor pago (R$)</Label>
          <Input
            id="valorPago"
            type="number"
            min="0.01"
            step="0.01"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
            placeholder="0,00"
            autoFocus
          />
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" form="form-pagamento" disabled={!valido || enviando}>
            {enviando ? 'Salvando…' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
