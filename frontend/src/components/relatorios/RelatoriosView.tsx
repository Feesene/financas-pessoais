'use client';

import { useState } from 'react';
import { formatarCompetencia, parseCompetencia } from '@/lib/competencia';
import { useCompetencia } from '@/components/competencia/CompetenciaProvider';
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
  // O ano dos relatórios é uma leitura da competência global, não um estado
  // próprio: com dois estados, sair daqui em 2025 e voltar ao Orçamento levava
  // a 2026 sem que nada na tela explicasse a mudança.
  const { competencia, setCompetencia } = useCompetencia();
  const { ano, mes } = parseCompetencia(competencia);
  const [aba, setAba] = useState<Aba>('historico');

  const de = `${ano}-01`;
  const ate = `${ano}-12`;

  /** Trocar o ano aqui move a competência global, preservando o mês. */
  function selecionarAno(novoAno: number) {
    setCompetencia(formatarCompetencia(novoAno, mes));
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-4 py-8 sm:px-6">
      <header className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-sm text-muted-foreground">Consolidado e análises do período.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SeletorAno ano={ano} onSelecionar={selecionarAno} />
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
