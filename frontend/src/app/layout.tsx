import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

export const metadata = {
  title: 'Finanças Pessoais',
  description: 'Painel financeiro pessoal — orçamento, reservas, investimentos e projeções',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
