import { ArrowDownCircle, ArrowUpCircle, Wallet } from 'lucide-react';
import type { ResumoMensalDTO } from '@financas-pessoais/shared';
import { formatarReais } from '@/lib/format';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';

export function CartoesTotais({ resumo }: { resumo: ResumoMensalDTO }) {
  const saldoNegativo = resumo.saldo < 0;

  const cartoes = [
    {
      rotulo: 'Receitas',
      valor: resumo.totalReceitas,
      icone: ArrowUpCircle,
      cor: 'text-success',
      fundo: 'bg-success/10',
    },
    {
      rotulo: 'Despesas',
      valor: resumo.totalDespesas,
      icone: ArrowDownCircle,
      cor: 'text-destructive',
      fundo: 'bg-destructive/10',
    },
    {
      rotulo: 'Saldo',
      valor: resumo.saldo,
      icone: Wallet,
      cor: saldoNegativo ? 'text-destructive' : 'text-primary',
      fundo: saldoNegativo ? 'bg-destructive/10' : 'bg-primary/10',
    },
  ];

  return (
    <section className="grid gap-4 sm:grid-cols-3">
      {cartoes.map(({ rotulo, valor, icone: Icone, cor, fundo }) => (
        <Card key={rotulo}>
          <CardContent className="flex items-center gap-4 p-5">
            <span className={cn('flex h-11 w-11 items-center justify-center rounded-full', fundo)}>
              <Icone className={cn('h-6 w-6', cor)} />
            </span>
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">{rotulo}</p>
              <p className={cn('text-2xl font-bold tabular-nums', cor)}>{formatarReais(valor)}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  );
}
