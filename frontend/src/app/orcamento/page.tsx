import { Suspense } from 'react';
import { OrcamentoView } from '@/components/orcamento/OrcamentoView';

export const metadata = {
  title: 'Orçamento Mensal — Finanças Pessoais',
};

export default function OrcamentoPage() {
  return (
    <Suspense
      fallback={<main className="container max-w-4xl py-8 text-muted-foreground">Carregando…</main>}
    >
      <OrcamentoView />
    </Suspense>
  );
}
