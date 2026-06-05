'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import { competenciaAtual, parseCompetencia } from '@/lib/competencia';
import { useCompetencia } from '@/components/competencia/CompetenciaProvider';
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

function formatar(ano: number, mes: number): string {
  return `${ano}-${String(mes).padStart(2, '0')}`;
}

export function NavegacaoMeses() {
  const { competencia, setCompetencia, irMesAnterior, irMesSeguinte } = useCompetencia();
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
    <div className="flex w-full items-center gap-2 sm:w-auto">
      <Button
        variant="outline"
        size="icon"
        aria-label="Mês anterior"
        onClick={irMesAnterior}
        className="shrink-0"
      >
        <ChevronLeft />
      </Button>

      <Select value={String(mes)} onValueChange={(v) => setCompetencia(formatar(ano, Number(v)))}>
        <SelectTrigger aria-label="Mês" className="min-w-0 flex-1 sm:w-[8.5rem] sm:flex-none">
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

      <Select value={String(ano)} onValueChange={(v) => setCompetencia(formatar(Number(v), mes))}>
        <SelectTrigger aria-label="Ano" className="w-[4.75rem] shrink-0 sm:w-[5.5rem]">
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
        onClick={irMesSeguinte}
        className="shrink-0"
      >
        <ChevronRight />
      </Button>
    </div>
  );
}
