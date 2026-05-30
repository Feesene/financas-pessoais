'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import type { CategoriaDTO, RegraRecorrenteDTO, TipoLancamento } from '@financas-pessoais/shared';
import { recorrenciasApi, type CriarRegraBody } from '@/lib/api/recorrencias';
import { competenciaAtual } from '@/lib/competencia';
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

type Modo = 'RECORRENCIA' | 'PARCELAMENTO';

interface Props {
  categorias: CategoriaDTO[];
  /** Quando presente, o diálogo opera em modo edição prospectiva. */
  regra?: RegraRecorrenteDTO;
  trigger: React.ReactNode;
  onSalvo: () => void;
}

export function RecorrenciaFormDialog({ categorias, regra, trigger, onSalvo }: Props) {
  const edicao = Boolean(regra);
  const [aberto, setAberto] = useState(false);
  const [tipo, setTipo] = useState<TipoLancamento>(regra?.tipo ?? 'DESPESA');
  const [categoriaId, setCategoriaId] = useState(regra?.categoriaId ?? '');
  const [descricao, setDescricao] = useState(regra?.descricao ?? '');
  const [modo, setModo] = useState<Modo>(
    regra?.numeroParcelas != null ? 'PARCELAMENTO' : 'RECORRENCIA',
  );
  const [valor, setValor] = useState(regra ? String(regra.valorBase) : '');
  const [numeroParcelas, setNumeroParcelas] = useState(
    regra?.numeroParcelas != null ? String(regra.numeroParcelas) : '',
  );
  const [competenciaInicio, setCompetenciaInicio] = useState(
    regra?.competenciaInicio ?? competenciaAtual(),
  );
  const [competenciaFim, setCompetenciaFim] = useState(regra?.competenciaFim ?? '');
  const [aPartirDe, setAPartirDe] = useState(regra?.competenciaInicio ?? competenciaAtual());
  const [enviando, setEnviando] = useState(false);

  const categoriasDoTipo = categorias.filter((c) => c.tipo === tipo);
  const valorNumerico = Number(valor);
  const parcelasNumero = Number(numeroParcelas);
  const parcelamento = modo === 'PARCELAMENTO';
  const valido =
    categoriaId.trim().length > 0 &&
    valor !== '' &&
    valorNumerico > 0 &&
    (!parcelamento || (numeroParcelas !== '' && Number.isInteger(parcelasNumero) && parcelasNumero >= 1));

  function resetar() {
    setTipo(regra?.tipo ?? 'DESPESA');
    setCategoriaId(regra?.categoriaId ?? '');
    setDescricao(regra?.descricao ?? '');
    setModo(regra?.numeroParcelas != null ? 'PARCELAMENTO' : 'RECORRENCIA');
    setValor(regra ? String(regra.valorBase) : '');
    setNumeroParcelas(regra?.numeroParcelas != null ? String(regra.numeroParcelas) : '');
    setCompetenciaInicio(regra?.competenciaInicio ?? competenciaAtual());
    setCompetenciaFim(regra?.competenciaFim ?? '');
    setAPartirDe(regra?.competenciaInicio ?? competenciaAtual());
  }

  function aoMudarTipo(novo: TipoLancamento) {
    setTipo(novo);
    setCategoriaId('');
  }

  function aoMudarAbertura(estado: boolean) {
    setAberto(estado);
    if (estado) resetar();
  }

  async function submeter(event: React.FormEvent) {
    event.preventDefault();
    if (!valido || enviando) return;
    setEnviando(true);
    const corpo: CriarRegraBody = {
      tipo,
      categoriaId,
      descricao: descricao.trim() || null,
      competenciaInicio,
      numeroParcelas: parcelamento ? parcelasNumero : null,
    };
    if (parcelamento) {
      corpo.valorTotal = Number(valorNumerico.toFixed(2));
    } else {
      corpo.valorBase = Number(valorNumerico.toFixed(2));
      corpo.competenciaFim = competenciaFim.trim() || null;
    }

    try {
      if (regra) {
        await recorrenciasApi.editar(regra.id, { ...corpo, aPartirDe });
        toast.success('Regra atualizada a partir da competência informada.');
      } else {
        await recorrenciasApi.criar(corpo);
        toast.success(parcelamento ? 'Parcelamento criado.' : 'Recorrência criada.');
      }
      setAberto(false);
      onSalvo();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Erro ao salvar a regra.');
    } finally {
      setEnviando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={aoMudarAbertura}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{edicao ? 'Editar regra' : 'Nova recorrência'}</DialogTitle>
          <DialogDescription>
            {edicao
              ? 'A alteração vale a partir da competência informada; o passado permanece inalterado.'
              : 'Configure uma recorrência mensal ou um parcelamento.'}
          </DialogDescription>
        </DialogHeader>

        <form id="form-recorrencia" onSubmit={submeter} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label htmlFor="modo">Modo</Label>
            <Select value={modo} onValueChange={(v) => setModo(v as Modo)} disabled={edicao}>
              <SelectTrigger id="modo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RECORRENCIA">Recorrência mensal</SelectItem>
                <SelectItem value="PARCELAMENTO">Parcelamento</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo</Label>
            <Select value={tipo} onValueChange={(v) => aoMudarTipo(v as TipoLancamento)} disabled={edicao}>
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
            <Select value={categoriaId} onValueChange={setCategoriaId} disabled={edicao}>
              <SelectTrigger id="categoria">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {categoriasDoTipo.length === 0 ? (
                  <SelectItem value="__sem__" disabled>
                    Nenhuma categoria deste tipo
                  </SelectItem>
                ) : (
                  categoriasDoTipo.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.nome}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
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
            <Label htmlFor="valor">{parcelamento ? 'Valor total (R$)' : 'Valor mensal (R$)'}</Label>
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

          {parcelamento && (
            <div className="grid gap-2">
              <Label htmlFor="parcelas">Número de parcelas</Label>
              <Input
                id="parcelas"
                type="number"
                min="1"
                step="1"
                value={numeroParcelas}
                onChange={(e) => setNumeroParcelas(e.target.value)}
                placeholder="Ex.: 12"
                disabled={edicao}
              />
            </div>
          )}

          {edicao ? (
            <div className="grid gap-2">
              <Label htmlFor="apartirde">Aplicar a partir de</Label>
              <Input
                id="apartirde"
                type="month"
                value={aPartirDe}
                onChange={(e) => setAPartirDe(e.target.value)}
              />
            </div>
          ) : (
            <>
              <div className="grid gap-2">
                <Label htmlFor="inicio">Competência de início</Label>
                <Input
                  id="inicio"
                  type="month"
                  value={competenciaInicio}
                  onChange={(e) => setCompetenciaInicio(e.target.value)}
                />
              </div>

              {!parcelamento && (
                <div className="grid gap-2">
                  <Label htmlFor="fim">Competência de fim (opcional)</Label>
                  <Input
                    id="fim"
                    type="month"
                    value={competenciaFim}
                    onChange={(e) => setCompetenciaFim(e.target.value)}
                  />
                </div>
              )}
            </>
          )}
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" form="form-recorrencia" disabled={!valido || enviando}>
            {enviando ? 'Salvando…' : edicao ? 'Salvar' : 'Criar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
