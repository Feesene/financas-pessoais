'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface ProjecaoFormState {
  entrada: string;
  aporteMensal: string;
  /** Taxa anual em porcentagem (UI), convertida para fração no envio. */
  taxaPercentual: string;
  anos: string;
}

interface Props {
  value: ProjecaoFormState;
  onChange: (value: ProjecaoFormState) => void;
}

export function ProjecaoForm({ value, onChange }: Props) {
  function set<K extends keyof ProjecaoFormState>(campo: K, novo: string) {
    onChange({ ...value, [campo]: novo });
  }

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="text-base">Parâmetros</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Campo
          id="entrada"
          rotulo="Entrada (R$)"
          value={value.entrada}
          onChange={(v) => set('entrada', v)}
          min={0}
          step="0.01"
        />
        <Campo
          id="aporteMensal"
          rotulo="Aporte mensal (R$)"
          value={value.aporteMensal}
          onChange={(v) => set('aporteMensal', v)}
          min={0}
          step="0.01"
        />
        <Campo
          id="taxaPercentual"
          rotulo="Taxa anual (%)"
          value={value.taxaPercentual}
          onChange={(v) => set('taxaPercentual', v)}
          min={0}
          step="0.1"
        />
        <Campo
          id="anos"
          rotulo="Período (anos)"
          value={value.anos}
          onChange={(v) => set('anos', v)}
          min={1}
          max={60}
          step="1"
        />
      </CardContent>
    </Card>
  );
}

interface CampoProps {
  id: string;
  rotulo: string;
  value: string;
  onChange: (value: string) => void;
  min?: number;
  max?: number;
  step?: string;
}

function Campo({ id, rotulo, value, onChange, min, max, step }: CampoProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{rotulo}</Label>
      <Input
        id={id}
        type="number"
        inputMode="decimal"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
