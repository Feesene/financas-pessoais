'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import type { ComparacaoMesesDTO } from '@financas-pessoais/shared';
import { relatoriosApi } from '@/lib/api/relatorios';
import { formatarReais } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const MESES = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

type Status = 'loading' | 'ready' | 'error';

interface Props {
  ano: number;
}

function competencia(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}`;
}

export function ComparacaoMeses({ ano }: Props) {
  const [a, setA] = useState(() => competencia(ano, 1));
  const [b, setB] = useState(() => competencia(ano, 2));
  const [dados, setDados] = useState<ComparacaoMesesDTO | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    setA(competencia(ano, 1));
    setB(competencia(ano, 2));
  }, [ano]);

  const carregar = useCallback(async () => {
    setStatus('loading');
    try {
      setDados(await relatoriosApi.comparar(a, b));
      setStatus('ready');
    } catch {
      setStatus('error');
    }
  }, [a, b]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <SeletorMes ano={ano} valor={a} onSelecionar={setA} rotulo="Mês A" />
        <ArrowRight className="h-4 w-4 text-muted-foreground" />
        <SeletorMes ano={ano} valor={b} onSelecionar={setB} rotulo="Mês B" />
      </div>

      {status === 'loading' && <Skeleton className="h-72 w-full" />}

      {status === 'error' && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <p className="font-medium">Não foi possível carregar a comparação.</p>
            <Button variant="outline" onClick={carregar}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {status === 'ready' && dados && (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            {dados.itens.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">
                Sem despesas nos meses selecionados.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="px-4 py-3 text-left font-medium">Categoria</th>
                    <th className="px-4 py-3 text-right font-medium">Mês A</th>
                    <th className="px-4 py-3 text-right font-medium">Mês B</th>
                    <th className="px-4 py-3 text-right font-medium">Variação</th>
                    <th className="px-4 py-3 text-right font-medium">%</th>
                  </tr>
                </thead>
                <tbody>
                  {dados.itens.map((item) => (
                    <tr key={item.categoria.id} className="border-b last:border-0">
                      <td className="px-4 py-2.5 font-medium">{item.categoria.nome}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {formatarReais(item.gastoA)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums">
                        {formatarReais(item.gastoB)}
                      </td>
                      <td
                        className={cn(
                          'px-4 py-2.5 text-right tabular-nums',
                          item.variacao > 0
                            ? 'text-destructive'
                            : item.variacao < 0
                              ? 'text-success'
                              : '',
                        )}
                      >
                        {item.variacao > 0 ? '+' : ''}
                        {formatarReais(item.variacao)}
                      </td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        {item.variacaoPct === null
                          ? '—'
                          : `${item.variacaoPct > 0 ? '+' : ''}${(item.variacaoPct * 100).toFixed(1)}%`}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function SeletorMes({
  ano,
  valor,
  onSelecionar,
  rotulo,
}: {
  ano: number;
  valor: string;
  onSelecionar: (competencia: string) => void;
  rotulo: string;
}) {
  return (
    <Select value={valor} onValueChange={onSelecionar}>
      <SelectTrigger aria-label={rotulo} className="min-w-0 flex-1 sm:w-[10rem] sm:flex-none">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {MESES.map((nome, i) => (
          <SelectItem key={i} value={competencia(ano, i + 1)}>
            {nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
