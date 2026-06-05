'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { HistoricoTabela } from './HistoricoTabela';
import { GraficosRelatorio } from './GraficosRelatorio';
import { ComparacaoMeses } from './ComparacaoMeses';
import { ExportarButton } from './ExportarButton';
import { LegendaRelatorio } from './LegendaRelatorio';
import { SeletorAno } from './SeletorAno';

type Aba = 'historico' | 'graficos' | 'comparacao';

const ABAS: { id: Aba; rotulo: string }[] = [
  { id: 'historico', rotulo: 'Histórico' },
  { id: 'graficos', rotulo: 'Gráficos' },
  { id: 'comparacao', rotulo: 'Comparação' },
];

export function RelatoriosView() {
  const [ano, setAno] = useState(() => new Date().getFullYear());
  const [aba, setAba] = useState<Aba>('historico');

  const de = `${ano}-01`;
  const ate = `${ano}-12`;

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Consolidado e análises do período.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorAno ano={ano} onSelecionar={setAno} />
          <ExportarButton de={de} ate={ate} />
        </div>
      </header>

      <nav className="mb-6 flex gap-1 border-b" aria-label="Seções de relatórios">
        {ABAS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setAba(item.id)}
            className={cn(
              '-mb-px border-b-2 px-4 py-2 text-sm font-medium transition-colors',
              aba === item.id
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {item.rotulo}
          </button>
        ))}
      </nav>

      <LegendaRelatorio />

      {aba === 'historico' && <HistoricoTabela ano={ano} />}
      {aba === 'graficos' && <GraficosRelatorio de={de} ate={ate} />}
      {aba === 'comparacao' && <ComparacaoMeses ano={ano} />}
    </main>
  );
}
