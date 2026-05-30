'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  ano: number;
  onSelecionar: (ano: number) => void;
}

export function SeletorAno({ ano, onSelecionar }: Props) {
  const anoAtual = new Date().getFullYear();
  const anos: number[] = [];
  for (let a = anoAtual - 5; a <= anoAtual + 1; a += 1) {
    anos.push(a);
  }
  if (!anos.includes(ano)) {
    anos.push(ano);
    anos.sort((a, b) => a - b);
  }

  return (
    <Select value={String(ano)} onValueChange={(v) => onSelecionar(Number(v))}>
      <SelectTrigger aria-label="Ano" className="w-[6rem]">
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
  );
}
