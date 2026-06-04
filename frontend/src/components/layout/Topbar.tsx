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
  Tag,
  Repeat,
  Settings,
  Sun,
  Moon,
  Monitor,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { useTheme, type Theme } from '@/components/theme/ThemeProvider';
import { logoutAction } from '@/lib/auth/actions';

const NAV_ITEMS = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/orcamento', label: 'Orçamento', icon: Wallet },
  { href: '/reservas', label: 'Reservas', icon: PiggyBank },
  { href: '/investimentos', label: 'Investimentos', icon: TrendingUp },
  { href: '/relatorios', label: 'Relatórios', icon: BarChart2 },
  { href: '/projecoes', label: 'Projeções', icon: LineChart },
];

const THEME_OPTIONS: { value: Theme; label: string; icon: React.ElementType }[] = [
  { value: 'system', label: 'Sistema', icon: Monitor },
  { value: 'light', label: 'Claro', icon: Sun },
  { value: 'dark', label: 'Escuro', icon: Moon },
];

export function Topbar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-2 px-4 sm:px-6">
        {/* Logo */}
        <Link
          href="/"
          className="mr-4 flex items-center gap-2 text-sm font-bold tracking-tight text-foreground hover:text-primary transition-colors"
        >
          <Wallet className="h-5 w-5 text-primary" />
          <span className="hidden sm:inline">Finanças</span>
        </Link>

        {/* Nav links */}
        <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
          {NAV_ITEMS.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex h-9 items-center gap-1.5 rounded-md px-3 text-sm font-medium whitespace-nowrap transition-colors',
                isActive(href, exact)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground',
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden md:inline">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Settings */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="Configurações">
              <Settings className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Tema</DropdownMenuLabel>
            <DropdownMenuRadioGroup value={theme} onValueChange={(v) => setTheme(v as Theme)}>
              {THEME_OPTIONS.map(({ value, label, icon: Icon }) => (
                <DropdownMenuRadioItem key={value} value={value}>
                  <Icon className="mr-1.5 h-3.5 w-3.5" />
                  {label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Configurações</DropdownMenuLabel>
            <DropdownMenuItem asChild>
              <Link href="/categorias">
                <Tag className="mr-1.5 h-3.5 w-3.5" />
                Categorias
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/recorrencias">
                <Repeat className="mr-1.5 h-3.5 w-3.5" />
                Recorrências
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <form action={logoutAction}>
                <button type="submit" className="flex w-full items-center">
                  <LogOut className="mr-1.5 h-3.5 w-3.5" />
                  Sair
                </button>
              </form>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
