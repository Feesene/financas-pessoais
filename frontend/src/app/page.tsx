import Link from 'next/link';
import { ArrowRight, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <main className="container flex min-h-screen max-w-2xl items-center justify-center py-12">
      <Card className="w-full">
        <CardHeader className="items-center text-center">
          <span className="mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Wallet className="h-6 w-6 text-primary" />
          </span>
          <CardTitle className="text-2xl">Finanças Pessoais</CardTitle>
          <CardDescription>
            Acompanhe orçamento, reservas, investimentos e projeções em um só lugar.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center">
          <Button asChild size="lg">
            <Link href="/orcamento">
              Abrir orçamento mensal
              <ArrowRight />
            </Link>
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
