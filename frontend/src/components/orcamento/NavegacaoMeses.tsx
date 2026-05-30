'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { competenciaAtual, mesAnterior, mesSeguinte, parseCompetencia } from '@/lib/competencia';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

interface Props {
  competencia: string;
  onSelecionar: (competencia: string) => void;
}

function formatar(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}`;
}

export function NavegacaoMeses({ competencia, onSelecionar }: Props) {
  const { ano, mes } = parseCompetencia(competencia);
  const anoBase = parseCompetencia(competenciaAtual()).ano;
  const anos: number[] = [];
  for (let a = anoBase - 5; a <= anoBase + 5; a += 1) {
    anos.push(a);
  }
  if (!anos.includes(ano)) {
    anos.push(ano);
    anos.sort((a, b) => a - b);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        aria-label="Mês anterior"
        onClick={() => onSelecionar(mesAnterior(competencia))}
      >
        <ChevronLeft />
      </Button>

      <Select value={String(mes)} onValueChange={(v) => onSelecionar(formatar(ano, Number(v)))}>
        <SelectTrigger aria-label="Mês" className="w-[8.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {MESES.map((nome, indice) => (
            <SelectItem key={nome} value={String(indice + 1)}>
              {nome}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={String(ano)} onValueChange={(v) => onSelecionar(formatar(Number(v), mes))}>
        <SelectTrigger aria-label="Ano" className="w-[5.5rem]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {anos.map((a) => (
            <SelectItem key={a} value={String(a)}>
              {a}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="outline"
        size="icon"
        aria-label="Mês seguinte"
        onClick={() => onSelecionar(mesSeguinte(competencia))}
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
