'use client';

import { Info } from 'lucide-react';

/** Explica o objetivo do relatório e os critérios de cada coluna do consolidado. */
export function LegendaRelatorio() {
  return (
    <details className="mb-6 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
      <summary className="flex cursor-pointer items-center gap-2 font-medium">
        <Info className="h-4 w-4 text-muted-foreground" aria-hidden />
        Como ler este relatório
      </summary>
      <div className="mt-3 space-y-2 text-muted-foreground">
        <p>
          O relatório mostra, mês a mês, para onde foi o seu dinheiro no ano selecionado. Cada coluna
          é calculada assim:
        </p>
        <ul className="list-disc space-y-1 pl-5">
          <li>
            <strong className="text-foreground">Líquido:</strong> soma de todas as receitas
            lançadas no mês (valor previsto do lançamento).
          </li>
          <li>
            <strong className="text-foreground">Gastos:</strong> soma de todas as despesas lançadas
            no mês.
          </li>
          <li>
            <strong className="text-foreground">Poupança:</strong> soma dos aportes feitos em baldes
            cujo nome contém “poupança”.
          </li>
          <li>
            <strong className="text-foreground">Viagem:</strong> soma dos aportes feitos em baldes
            cujo nome contém “viagem”.
          </li>
          <li>
            <strong className="text-foreground">Sobras:</strong> líquido − gastos − poupança −
            viagem, ou seja, o que não foi gasto nem reservado.
          </li>
        </ul>
        <p>
          Observações: apenas <strong className="text-foreground">aportes</strong> entram em poupança
          e viagem — retiradas de reserva não são contabilizadas. Baldes cujo nome não menciona
          “poupança” nem “viagem” ficam de fora dessas colunas.
        </p>
      </div>
    </details>
  );
}
