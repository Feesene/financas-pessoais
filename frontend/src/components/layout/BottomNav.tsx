'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Wallet,
  PiggyBank,
  TrendingUp,
  BarChart2,
  LineChart,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Rótulos curtos para caber na barra inferior em telas estreitas.
const NAV_ITEMS = [
  { href: '/', label: 'Início', icon: LayoutDashboard, exact: true },
  { href: '/orcamento', label: 'Orçamento', icon: Wallet },
  { href: '/reservas', label: 'Reservas', icon: PiggyBank },
  { href: '/investimentos', label: 'Carteira', icon: TrendingUp },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/projecoes', label: 'Projeções', icon: LineChart },
];

/**
 * Navegação fixa no rodapé, exibida apenas em telas pequenas (`md:hidden`).
 * Substitui a barra de navegação horizontal da Topbar no mobile.
 */
export function BottomNav() {
  const pathname = usePathname();

  if (pathname === '/login') return null;

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur-sm md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="grid grid-cols-6">
        {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => {
          const ativo = isActive(href, exact);
          return (
            <li key={href}>
              <Link
                href={href}
                aria-current={ativo ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-0.5 px-0.5 py-2 transition-colors',
                  ativo ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                <span className="w-full truncate text-center text-[10px] leading-none">
                  {label}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
