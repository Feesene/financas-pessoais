import { Wallet } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { LoginForm } from './LoginForm';

export const metadata = {
  title: 'Entrar — Finanças Pessoais',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { redirectTo?: string };
}) {
  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="space-y-3 text-center">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <Wallet className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="text-xl">Finanças Pessoais</CardTitle>
          <CardDescription>Informe a senha para acessar o painel.</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm redirectTo={searchParams.redirectTo} />
        </CardContent>
      </Card>
    </main>
  );
}
