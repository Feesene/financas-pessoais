'use client';

import type { ProjecaoResultadoDTO } from '@financas-pessoais/shared';
import { formatarReais } from '@/lib/format';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Props {
  resultado: ProjecaoResultadoDTO;
}

export function ProjecaoResultado({ resultado }: Props) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <Cartao rotulo="Total investido" valor={resultado.totalFinalInvestido} destaque="positivo" />
        <Cartao rotulo="Sem investir" valor={resultado.totalFinalNaoInvestido} />
        <Cartao rotulo="Juros ganhos" valor={resultado.jurosGanhos} destaque="positivo" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Evolução ano a ano</CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-2 font-medium">Ano</th>
                  <th className="px-4 py-2 text-right font-medium">Aportado</th>
                  <th className="px-4 py-2 text-right font-medium">Sem investir</th>
                  <th className="px-4 py-2 text-right font-medium">Investido</th>
                  <th className="px-4 py-2 text-right font-medium">Juros</th>
                </tr>
              </thead>
              <tbody>
                {resultado.anos.map((linha) => (
                  <tr key={linha.ano} className="border-b last:border-0">
                    <td className="px-4 py-2 tabular-nums">{linha.ano}</td>
                    <td className="px-4 py-2 text-right tabular-nums">
                      {formatarReais(linha.totalAportado)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">
                      {formatarReais(linha.saldoNaoInvestido)}
                    </td>
                    <td className="px-4 py-2 text-right font-medium tabular-nums">
                      {formatarReais(linha.saldoInvestido)}
                    </td>
                    <td className="px-4 py-2 text-right tabular-nums text-emerald-600">
                      {formatarReais(linha.jurosAcumulados)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Cartao({
  rotulo,
  valor,
  destaque,
}: {
  rotulo: string;
  valor: number;
  destaque?: 'positivo';
}) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{rotulo}</p>
        <p
          className={
            destaque === 'positivo'
              ? 'mt-1 text-lg font-bold tabular-nums text-emerald-600'
              : 'mt-1 text-lg font-bold tabular-nums'
          }
        >
          {formatarReais(valor)}
        </p>
      </CardContent>
    </Card>
  );
}
