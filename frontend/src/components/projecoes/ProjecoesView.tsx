'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, LineChart } from 'lucide-react';
import type { ProjecaoParametrosDTO, ProjecaoResultadoDTO } from '@financas-pessoais/shared';
import { projecoesApi } from '@/lib/api/projecoes';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjecaoForm, type ProjecaoFormState } from './ProjecaoForm';
import { ProjecaoResultado } from './ProjecaoResultado';
import { ProjecaoGrafico } from './ProjecaoGrafico';

type Status = 'loading' | 'ready' | 'error' | 'incompleto';

const FORM_INICIAL: ProjecaoFormState = {
  entrada: '1000',
  aporteMensal: '500',
  taxaPercentual: '10',
  anos: '20',
};

/** Converte o formulário (taxa em %) em parâmetros válidos, ou null se incompleto/ inválido. */
function paramsDoForm(form: ProjecaoFormState): ProjecaoParametrosDTO | null {
  const entrada = Number(form.entrada);
  const aporteMensal = Number(form.aporteMensal);
  const taxaPercentual = Number(form.taxaPercentual);
  const anos = Number(form.anos);

  if (form.entrada === '' || form.aporteMensal === '' || form.taxaPercentual === '' || form.anos === '') {
    return null;
  }
  if (![entrada, aporteMensal, taxaPercentual, anos].every(Number.isFinite)) return null;
  if (entrada < 0 || aporteMensal < 0 || taxaPercentual < 0) return null;
  if (!Number.isInteger(anos) || anos < 1 || anos > 60) return null;

  return { entrada, aporteMensal, taxaAnual: taxaPercentual / 100, anos };
}

export function ProjecoesView() {
  const [form, setForm] = useState<ProjecaoFormState>(FORM_INICIAL);
  const [resultado, setResultado] = useState<ProjecaoResultadoDTO | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  const parametros = useMemo(() => paramsDoForm(form), [form]);

  useEffect(() => {
    if (!parametros) {
      setStatus('incompleto');
      return;
    }

    let cancelado = false;
    setStatus('loading');
    const timer = setTimeout(() => {
      projecoesApi
        .calcular(parametros)
        .then((dados) => {
          if (cancelado) return;
          setResultado(dados);
          setStatus('ready');
        })
        .catch(() => {
          if (!cancelado) setStatus('error');
        });
    }, 250);

    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [parametros]);

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Projeções de juros compostos</h1>
        <p className="text-sm text-muted-foreground">
          Compare a evolução de um investimento com aportes mensais versus o dinheiro parado.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <ProjecaoForm value={form} onChange={setForm} />

        <div className="space-y-6">
          {status === 'incompleto' && (
            <Card>
              <CardContent className="flex flex-col items-center gap-2 py-16 text-center text-sm text-muted-foreground">
                <LineChart className="h-7 w-7" />
                Preencha os parâmetros para ver a projeção.
              </CardContent>
            </Card>
          )}

          {status === 'loading' && <Skeleton className="h-80 w-full" />}

          {status === 'error' && (
            <Card className="border-destructive/40">
              <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <p className="font-medium">Não foi possível calcular a projeção.</p>
              </CardContent>
            </Card>
          )}

          {status === 'ready' && resultado && (
            <>
              <ProjecaoResultado resultado={resultado} />
              <ProjecaoGrafico anos={resultado.anos} />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
