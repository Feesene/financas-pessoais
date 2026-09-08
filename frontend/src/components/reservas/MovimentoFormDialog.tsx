'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { BaldeDTO, TipoMovimentoReserva } from '@financas-pessoais/shared';
import { reservasApi } from '@/lib/api/reservas';
import { ApiError } from '@/lib/api/http';
import { competenciaAtual, isCompetenciaValida } from '@/lib/competencia';
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

interface Props {
  balde: BaldeDTO;
  /** Competência inicial sugerida (default = mês atual). */
  competenciaInicial?: string;
  trigger: React.ReactNode;
  onSalvo: () => void;
}

export function MovimentoFormDialog({ balde, competenciaInicial, trigger, onSalvo }: Props) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoMovimentoReserva>('APORTE');
  const [valor, setValor] = useState('');
  const [competencia, setCompetencia] = useState(competenciaInicial ?? competenciaAtual());
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);
  // Mensagem do 409 de saldo insuficiente, exibida enquanto a retirada aguarda confirmação.
  const [avisoSaldo, setAvisoSaldo] = useState<string | null>(null);

  const valorNumerico = Number(valor.replace(',', '.'));
  const valido =
    Number.isFinite(valorNumerico) && valorNumerico > 0 && isCompetenciaValida(competencia);

  function resetar() {
    setTipo('APORTE');
    setValor('');
    setCompetencia(competenciaInicial ?? competenciaAtual());
    setDescricao('');
  }

  function aoMudarAbertura(estado: boolean) {
    setAberto(estado);
    setAvisoSaldo(null);
    if (estado) resetar();
  }

  /**
   * Envia o movimento. Uma retirada maior que o saldo volta em 409: a primeira
   * tentativa nunca força, mostra o aviso e espera a confirmação — saldo
   * negativo continua sendo um estado permitido, só deixa de ser silencioso.
   */
  async function registrar(permitirNegativo: boolean) {
    setEnviando(true);
    try {
      await reservasApi.registrarMovimento(balde.id, {
        tipo,
        valor: valorNumerico,
        competencia,
        descricao: descricao.trim() ? descricao.trim() : null,
        permitirNegativo,
      });
      toast.success(tipo === 'APORTE' ? 'Aporte registrado.' : 'Retirada registrada.');
      setAvisoSaldo(null);
      setAberto(false);
      onSalvo();
    } catch (e) {
      if (!permitirNegativo && e instanceof ApiError && e.status === 409) {
        setAvisoSaldo(e.message);
        return;
      }
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar o movimento.');
    } finally {
      setEnviando(false);
    }
  }

  function submeter(event: React.FormEvent) {
    event.preventDefault();
    if (!valido || enviando) return;
    void registrar(false);
  }

  return (
    <>
      <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
        <DialogTrigger asChild>{trigger}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Movimentar “{balde.nome}”</DialogTitle>
            <DialogDescription>Registre um aporte ou uma retirada neste balde.</DialogDescription>
          </DialogHeader>

          <form id="form-movimento" onSubmit={submeter} className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label htmlFor="tipo-movimento">Tipo</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMovimentoReserva)}>
                <SelectTrigger id="tipo-movimento">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="APORTE">Aporte (entrada)</SelectItem>
                  <SelectItem value="RETIRADA">Retirada (saída)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="valor-movimento">Valor (R$)</Label>
              <Input
                id="valor-movimento"
                type="number"
                min={0.01}
                step="0.01"
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                placeholder="0,00"
                autoComplete="off"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="competencia-movimento">Competência</Label>
              <Input
                id="competencia-movimento"
                type="month"
                value={competencia}
                onChange={(e) => setCompetencia(e.target.value)}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="descricao-movimento">Descrição (opcional)</Label>
              <Input
                id="descricao-movimento"
                value={descricao}
                maxLength={255}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Ex.: aporte mensal"
                autoComplete="off"
              />
            </div>
          </form>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" form="form-movimento" disabled={!valido || enviando}>
              {enviando ? 'Salvando…' : 'Registrar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={avisoSaldo !== null} onOpenChange={() => setAvisoSaldo(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirada maior que o saldo</AlertDialogTitle>
            <AlertDialogDescription>
              {avisoSaldo} Confirme apenas se o balde realmente deve ficar negativo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar valor</AlertDialogCancel>
            <AlertDialogAction onClick={() => void registrar(true)} disabled={enviando}>
              Registrar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
