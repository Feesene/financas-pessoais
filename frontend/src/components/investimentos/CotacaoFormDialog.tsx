'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { AtivoDTO } from '@financas-pessoais/shared';
import { investimentosApi } from '@/lib/api/investimentos';
import { competenciaAtual, isCompetenciaValida } from '@/lib/competencia';
import { ehAtivoCotado } from '@/lib/investimentos';
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
  ativo: AtivoDTO;
  /** Competência inicial sugerida (default = mês atual). */
  competenciaInicial?: string;
  trigger: React.ReactNode;
  onSalvo: () => void;
}

export function CotacaoFormDialog({ ativo, competenciaInicial, trigger, onSalvo }: Props) {
  const cotado = ehAtivoCotado(ativo.tipo);
  const [aberto, setAberto] = useState(false);
  const [competencia, setCompetencia] = useState(competenciaInicial ?? competenciaAtual());
  const [valor, setValor] = useState('');
  const [enviando, setEnviando] = useState(false);

  const valorNumerico = Number(valor.replace(',', '.'));
  const valido =
    Number.isFinite(valorNumerico) && valorNumerico >= 0 && isCompetenciaValida(competencia);

  function resetar() {
    setCompetencia(competenciaInicial ?? competenciaAtual());
    setValor('');
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
      await investimentosApi.registrarCotacao(
        ativo.id,
        competencia,
        cotado ? { valorUnitario: valorNumerico } : { valorBruto: valorNumerico },
      );
      toast.success('Cotação registrada.');
      setAberto(false);
      onSalvo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar a cotação.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cotação de “{ativo.descricao}”</DialogTitle>
          <DialogDescription>
            {cotado
              ? 'Registre o preço unitário do ativo no mês selecionado.'
              : 'Registre o valor do fundo no mês selecionado.'}
          </DialogDescription>
        </DialogHeader>

        <form id="form-cotacao" onSubmit={submeter} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="competencia-cotacao">Competência</Label>
            <Input
              id="competencia-cotacao"
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="valor-cotacao">
              {cotado ? 'Valor unitário (R$)' : 'Valor bruto (R$)'}
            </Label>
            <Input
              id="valor-cotacao"
              type="number"
              min={0}
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
              placeholder="0,00"
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
          <Button type="submit" form="form-cotacao" disabled={!valido || enviando}>
            {enviando ? 'Salvando…' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
