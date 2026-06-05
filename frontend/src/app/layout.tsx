import type { ReactNode } from 'react';
import type { Viewport } from 'next';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme/ThemeProvider';
import { CompetenciaProvider } from '@/components/competencia/CompetenciaProvider';
import { Topbar } from '@/components/layout/Topbar';
import { BottomNav } from '@/components/layout/BottomNav';
import './globals.css';

export const metadata = {
  title: 'Finanças Pessoais',
  description: 'Painel financeiro pessoal — orçamento, reservas, investimentos e projeções',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
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
          <CompetenciaProvider>
            <Topbar />
            <div className="flex min-h-[calc(100vh-3.5rem)] flex-col pb-[calc(4rem+env(safe-area-inset-bottom))] md:pb-0">
              {children}
            </div>
            <BottomNav />
            <Toaster />
          </CompetenciaProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
