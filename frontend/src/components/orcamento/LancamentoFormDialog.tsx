'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import type { CategoriaDTO, LancamentoDTO, TipoLancamento } from '@financas-pessoais/shared';
import { lancamentosApi } from '@/lib/api/lancamentos';
import { categoriasApi } from '@/lib/api/categorias';
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

/** Valor sentinela do seletor para o modo de texto livre ("Outra"). */
const OUTRA = '__outra__';

export function LancamentoFormDialog({ competencia, lancamento, trigger, onSalvo }: Props) {
  const edicao = Boolean(lancamento);
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoLancamento>(lancamento?.tipo ?? 'DESPESA');
  /** Valor atual do seletor: id de uma categoria cadastrada, OUTRA, ou '' (nada escolhido). */
  const [selecao, setSelecao] = useState('');
  /** Nome digitado no modo texto livre. */
  const [categoriaTexto, setCategoriaTexto] = useState(lancamento?.categoria ?? '');
  const [descricao, setDescricao] = useState(lancamento?.descricao ?? '');
  const [valor, setValor] = useState(lancamento ? String(lancamento.valor) : '');
  const [enviando, setEnviando] = useState(false);
  const [categorias, setCategorias] = useState<CategoriaDTO[]>([]);

  const categoriasDoTipo = useMemo(
    () => categorias.filter((c) => c.tipo === tipo),
    [categorias, tipo],
  );
  const semCategorias = categoriasDoTipo.length === 0;
  /** Texto livre quando não há categorias do tipo (T5) ou quando "Outra" foi escolhida (T3). */
  const modoTextoLivre = semCategorias || selecao === OUTRA;

  const categoriaSelecionada = categoriasDoTipo.find((c) => c.id === selecao) ?? null;
  const categoriaNome = modoTextoLivre ? categoriaTexto.trim() : (categoriaSelecionada?.nome ?? '');
  const categoriaId = categoriaSelecionada?.id ?? null;

  const valorNumerico = Number(valor);
  const valido = categoriaNome.length > 0 && valor !== '' && valorNumerico > 0;

  function resetar() {
    setTipo(lancamento?.tipo ?? 'DESPESA');
    setSelecao('');
    setCategoriaTexto(lancamento?.categoria ?? '');
    setDescricao(lancamento?.descricao ?? '');
    setValor(lancamento ? String(lancamento.valor) : '');
  }

  function aoMudarAbertura(estado: boolean) {
    setAberto(estado);
    if (estado) {
      resetar();
      categoriasApi
        .listar()
        .then(setCategorias)
        .catch(() => setCategorias([]));
    }
  }

  // Pré-seleção em modo edição assim que as categorias chegam (T4): casa pelo id;
  // se o id não existir mais (categoria excluída) cai em "Outra" preservando o nome.
  useEffect(() => {
    if (!aberto || !lancamento) return;
    if (lancamento.categoriaId && categorias.some((c) => c.id === lancamento.categoriaId)) {
      setSelecao(lancamento.categoriaId);
    } else {
      setSelecao(OUTRA);
      setCategoriaTexto(lancamento.categoria ?? '');
    }
  }, [aberto, lancamento, categorias]);

  function aoMudarTipo(novoTipo: TipoLancamento) {
    setTipo(novoTipo);
    // Invalida a seleção incompatível com o novo tipo (T3/RF-004).
    setSelecao((atual) => {
      if (atual === OUTRA) return atual;
      const aindaValida = categorias.some((c) => c.id === atual && c.tipo === novoTipo);
      return aindaValida ? atual : '';
    });
  }

  function aoMudarSelecao(valorSel: string) {
    setSelecao(valorSel);
    if (valorSel === OUTRA) setCategoriaTexto('');
  }

  async function submeter(event: React.FormEvent) {
    event.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    const corpo = {
      tipo,
      categoria: categoriaNome,
      categoriaId,
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
            <Select value={tipo} onValueChange={(v) => aoMudarTipo(v as TipoLancamento)}>
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
            {semCategorias ? (
              <>
                <Input
                  id="categoria"
                  value={categoriaTexto}
                  maxLength={80}
                  onChange={(e) => setCategoriaTexto(e.target.value)}
                  placeholder="Ex.: Alimentação"
                  autoComplete="off"
                />
                <p className="text-xs text-muted-foreground">
                  Nenhuma categoria de {tipo === 'DESPESA' ? 'despesa' : 'receita'} cadastrada.
                  Cadastre categorias para vincular e acompanhar metas.
                </p>
              </>
            ) : (
              <>
                <Select value={selecao} onValueChange={aoMudarSelecao}>
                  <SelectTrigger id="categoria">
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categoriasDoTipo.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.nome}
                      </SelectItem>
                    ))}
                    <SelectItem value={OUTRA}>Outra (digitar)</SelectItem>
                  </SelectContent>
                </Select>
                {selecao === OUTRA && (
                  <Input
                    id="categoria-texto"
                    value={categoriaTexto}
                    maxLength={80}
                    onChange={(e) => setCategoriaTexto(e.target.value)}
                    placeholder="Ex.: Alimentação"
                    autoComplete="off"
                  />
                )}
              </>
            )}
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
