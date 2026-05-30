import type { ReactNode } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { Topbar } from '@/components/layout/Topbar';
import './globals.css';

export const metadata = {
  title: 'Finanças Pessoais',
  description: 'Painel financeiro pessoal — orçamento, reservas, investimentos e projeções',
};

const themeScript = `(function(){var t=localStorage.getItem('theme');document.documentElement.classList.toggle('dark',t==='dark'||(t!=='light'&&window.matchMedia('(prefers-color-scheme: dark)').matches))})();`;

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {/* Prevents flash of wrong theme before React hydration */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen antialiased">
        <ThemeProvider>
          <Topbar />
          <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">{children}</div>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
