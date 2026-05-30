'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { AtivoDTO, TipoMovimentoCarteira } from '@financas-pessoais/shared';
import { investimentosApi } from '@/lib/api/investimentos';
import { competenciaAtual, isCompetenciaValida } from '@/lib/competencia';
import { TIPO_MOVIMENTO_LABEL } from '@/lib/investimentos';
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

interface Props {
  ativo: AtivoDTO;
  /** Competência inicial sugerida (default = mês atual). */
  competenciaInicial?: string;
  trigger: React.ReactNode;
  onSalvo: () => void;
}

export function MovimentoCarteiraFormDialog({
  ativo,
  competenciaInicial,
  trigger,
  onSalvo,
}: Props) {
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoMovimentoCarteira>('ENTRADA');
  const [valor, setValor] = useState('');
  const [competencia, setCompetencia] = useState(competenciaInicial ?? competenciaAtual());
  const [descricao, setDescricao] = useState('');
  const [enviando, setEnviando] = useState(false);

  const valorNumerico = Number(valor.replace(',', '.'));
  const valido =
    Number.isFinite(valorNumerico) && valorNumerico > 0 && isCompetenciaValida(competencia);

  function resetar() {
    setTipo('ENTRADA');
    setValor('');
    setCompetencia(competenciaInicial ?? competenciaAtual());
    setDescricao('');
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
      await investimentosApi.registrarMovimento(ativo.id, {
        tipo,
        valor: valorNumerico,
        competencia,
        descricao: descricao.trim() ? descricao.trim() : null,
      });
      toast.success('Movimento registrado.');
      setAberto(false);
      onSalvo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao registrar o movimento.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Movimentar “{ativo.descricao}”</DialogTitle>
          <DialogDescription>
            Registre uma entrada, saída ou rendimento neste ativo.
          </DialogDescription>
        </DialogHeader>

        <form id="form-movimento-carteira" onSubmit={submeter} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="tipo-movimento-carteira">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoMovimentoCarteira)}>
              <SelectTrigger id="tipo-movimento-carteira">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ENTRADA">{TIPO_MOVIMENTO_LABEL.ENTRADA}</SelectItem>
                <SelectItem value="SAIDA">{TIPO_MOVIMENTO_LABEL.SAIDA}</SelectItem>
                <SelectItem value="RENDIMENTO">{TIPO_MOVIMENTO_LABEL.RENDIMENTO}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="valor-movimento-carteira">Valor (R$)</Label>
            <Input
              id="valor-movimento-carteira"
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
            <Label htmlFor="competencia-movimento-carteira">Competência</Label>
            <Input
              id="competencia-movimento-carteira"
              type="month"
              value={competencia}
              onChange={(e) => setCompetencia(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descricao-movimento-carteira">Descrição (opcional)</Label>
            <Input
              id="descricao-movimento-carteira"
              value={descricao}
              maxLength={255}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: compra mensal"
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
          <Button type="submit" form="form-movimento-carteira" disabled={!valido || enviando}>
            {enviando ? 'Salvando…' : 'Registrar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
