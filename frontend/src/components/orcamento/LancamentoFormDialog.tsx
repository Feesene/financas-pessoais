'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { LancamentoDTO, TipoLancamento } from '@financas-pessoais/shared';
import { lancamentosApi } from '@/lib/api/lancamentos';
import { CATEGORIAS_SUGERIDAS } from '@/lib/categorias';
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
  competencia: string;
  /** Quando presente, o diálogo opera em modo edição. */
  lancamento?: LancamentoDTO;
  trigger: React.ReactNode;
  onSalvo: () => void;
}

export function LancamentoFormDialog({ competencia, lancamento, trigger, onSalvo }: Props) {
  const edicao = Boolean(lancamento);
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoLancamento>(lancamento?.tipo ?? 'DESPESA');
  const [categoria, setCategoria] = useState(lancamento?.categoria ?? '');
  const [descricao, setDescricao] = useState(lancamento?.descricao ?? '');
  const [valor, setValor] = useState(lancamento ? String(lancamento.valor) : '');
  const [enviando, setEnviando] = useState(false);

  const valorNumerico = Number(valor);
  const valido = categoria.trim().length > 0 && valor !== '' && valorNumerico > 0;

  function resetar() {
    setTipo(lancamento?.tipo ?? 'DESPESA');
    setCategoria(lancamento?.categoria ?? '');
    setDescricao(lancamento?.descricao ?? '');
    setValor(lancamento ? String(lancamento.valor) : '');
  }

  function aoMudarAbertura(estado: boolean) {
    setAberto(estado);
    if (estado) resetar();
  }

  async function submeter(event: React.FormEvent) {
    event.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    const corpo = {
      tipo,
      categoria: categoria.trim(),
      descricao: descricao.trim() || null,
      valor: Number(valorNumerico.toFixed(2)),
      competencia: lancamento?.competencia ?? competencia,
    };
    try {
      if (lancamento) {
        await lancamentosApi.atualizar(lancamento.id, corpo);
        toast.success('Lançamento atualizado.');
      } else {
        await lancamentosApi.criar(corpo);
        toast.success('Lançamento adicionado.');
      }
      setAberto(false);
      onSalvo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar o lançamento.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edicao ? 'Editar lançamento' : 'Novo lançamento'}</DialogTitle>
          <DialogDescription>
            {edicao
              ? 'Atualize os dados do lançamento e salve.'
              : 'Preencha os dados da nova receita ou despesa.'}
          </DialogDescription>
        </DialogHeader>

        <form id="form-lancamento" onSubmit={submeter} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => setTipo(v as TipoLancamento)}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DESPESA">Despesa</SelectItem>
                <SelectItem value="RECEITA">Receita</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="categoria">Categoria</Label>
            <Input
              id="categoria"
              list="categorias-sugeridas"
              value={categoria}
              maxLength={80}
              onChange={(e) => setCategoria(e.target.value)}
              placeholder="Ex.: Alimentação"
              autoComplete="off"
            />
            <datalist id="categorias-sugeridas">
              {CATEGORIAS_SUGERIDAS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="descricao">Descrição</Label>
            <Input
              id="descricao"
              value={descricao}
              maxLength={255}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Opcional"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="valor">Valor (R$)</Label>
            <Input
              id="valor"
              type="number"
              min="0.01"
              step="0.01"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
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
          <Button type="submit" form="form-lancamento" disabled={!valido || enviando}>
            {enviando ? 'Salvando…' : edicao ? 'Salvar' : 'Adicionar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
