'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { AtivoDTO, TipoAtivo } from '@financas-pessoais/shared';
import { investimentosApi } from '@/lib/api/investimentos';
import { ehAtivoCotado, TIPO_ATIVO_SINGULAR } from '@/lib/investimentos';
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
  /** Quando presente, o diálogo opera em modo edição (tipo fixo). */
  ativo?: AtivoDTO;
  trigger: React.ReactNode;
  onSalvo: () => void;
}

function paraTexto(valor: number | null): string {
  return valor === null ? '' : String(valor);
}

export function AtivoFormDialog({ ativo, trigger, onSalvo }: Props) {
  const edicao = Boolean(ativo);
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoAtivo>(ativo?.tipo ?? 'ACAO');
  const [descricao, setDescricao] = useState(ativo?.descricao ?? '');
  const [quantidade, setQuantidade] = useState(paraTexto(ativo?.quantidade ?? null));
  const [valorUnitario, setValorUnitario] = useState(paraTexto(ativo?.valorUnitario ?? null));
  const [valorBruto, setValorBruto] = useState(ativo ? String(ativo.valorBruto) : '');
  const [rendimento, setRendimento] = useState(ativo ? String(ativo.rendimento) : '0');
  const [enviando, setEnviando] = useState(false);

  const cotado = ehAtivoCotado(tipo);
  const qtdNum = Number(quantidade.replace(',', '.'));
  const unitNum = Number(valorUnitario.replace(',', '.'));
  const brutoNum = Number(valorBruto.replace(',', '.'));
  const rendNum = Number(rendimento.replace(',', '.'));

  const brutoDerivado =
    cotado && Number.isFinite(qtdNum) && Number.isFinite(unitNum) && qtdNum > 0 && unitNum >= 0
      ? Math.round(qtdNum * unitNum * 100) / 100
      : null;

  const camposValidos = cotado
    ? Number.isFinite(qtdNum) && qtdNum > 0 && Number.isFinite(unitNum) && unitNum >= 0
    : Number.isFinite(brutoNum) && brutoNum >= 0;
  const valido =
    descricao.trim().length > 0 &&
    camposValidos &&
    Number.isFinite(rendNum) &&
    rendNum >= 0;

  function resetar() {
    setTipo(ativo?.tipo ?? 'ACAO');
    setDescricao(ativo?.descricao ?? '');
    setQuantidade(paraTexto(ativo?.quantidade ?? null));
    setValorUnitario(paraTexto(ativo?.valorUnitario ?? null));
    setValorBruto(ativo ? String(ativo.valorBruto) : '');
    setRendimento(ativo ? String(ativo.rendimento) : '0');
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
      const dadosCotado = {
        quantidade: qtdNum,
        valorUnitario: unitNum,
        rendimento: rendNum,
      };
      const dadosFundo = { valorBruto: brutoNum, rendimento: rendNum };

      if (ativo) {
        await investimentosApi.atualizarAtivo(ativo.id, {
          descricao: descricao.trim(),
          ...(ehAtivoCotado(ativo.tipo) ? dadosCotado : dadosFundo),
        });
        toast.success('Ativo atualizado.');
      } else {
        await investimentosApi.criarAtivo({
          tipo,
          descricao: descricao.trim(),
          ...(cotado ? dadosCotado : dadosFundo),
        });
        toast.success('Ativo criado.');
      }
      setAberto(false);
      onSalvo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar o ativo.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edicao ? 'Editar ativo' : 'Novo ativo'}</DialogTitle>
          <DialogDescription>
            {cotado
              ? 'Informe quantidade e valor unitário; o valor bruto é calculado automaticamente.'
              : 'Informe o valor bruto investido no fundo.'}
          </DialogDescription>
        </DialogHeader>

        <form id="form-ativo" onSubmit={submeter} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="tipo-ativo">Tipo</Label>
            <Select
              value={tipo}
              onValueChange={(v) => setTipo(v as TipoAtivo)}
              disabled={edicao}
            >
              <SelectTrigger id="tipo-ativo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACAO">{TIPO_ATIVO_SINGULAR.ACAO}</SelectItem>
                <SelectItem value="FII">{TIPO_ATIVO_SINGULAR.FII}</SelectItem>
                <SelectItem value="FUNDO">{TIPO_ATIVO_SINGULAR.FUNDO}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descricao-ativo">Descrição</Label>
            <Input
              id="descricao-ativo"
              value={descricao}
              maxLength={80}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder={cotado ? 'Ex.: PETR4' : 'Ex.: Tesouro Selic 2029'}
              autoComplete="off"
            />
          </div>

          {cotado ? (
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label htmlFor="quantidade-ativo">Quantidade</Label>
                <Input
                  id="quantidade-ativo"
                  type="number"
                  min={0}
                  step="any"
                  value={quantidade}
                  onChange={(e) => setQuantidade(e.target.value)}
                  placeholder="0"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="unitario-ativo">Valor unitário (R$)</Label>
                <Input
                  id="unitario-ativo"
                  type="number"
                  min={0}
                  step="0.01"
                  value={valorUnitario}
                  onChange={(e) => setValorUnitario(e.target.value)}
                  placeholder="0,00"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <Label htmlFor="bruto-ativo">Valor bruto (R$)</Label>
              <Input
                id="bruto-ativo"
                type="number"
                min={0}
                step="0.01"
                value={valorBruto}
                onChange={(e) => setValorBruto(e.target.value)}
                placeholder="0,00"
              />
            </div>
          )}

          {cotado && brutoDerivado !== null && (
            <p className="text-sm text-muted-foreground">
              Valor bruto:{' '}
              <span className="font-medium text-foreground tabular-nums">
                {formatarReais(brutoDerivado)}
              </span>
            </p>
          )}

          <div className="grid gap-2">
            <Label htmlFor="rendimento-ativo">Rendimento acumulado (R$)</Label>
            <Input
              id="rendimento-ativo"
              type="number"
              min={0}
              step="0.01"
              value={rendimento}
              onChange={(e) => setRendimento(e.target.value)}
              placeholder="0,00"
            />
          </div>
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" form="form-ativo" disabled={!valido || enviando}>
            {enviando ? 'Salvando…' : edicao ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
