'use client';

import type { ModoValor } from '@financas-pessoais/shared';
import { cn } from '@/lib/utils';
import { useModoValor } from './ModoValorProvider';

const OPCOES: { modo: ModoValor; rotulo: string; ajuda: string }[] = [
  {
    modo: 'PREVISTO',
    rotulo: 'Previsto',
    ajuda: 'Todo lançamento do mês, pago ou não — o compromisso assumido.',
  },
  {
    modo: 'REALIZADO',
    rotulo: 'Realizado',
    ajuda: 'Só o dinheiro que já se moveu: lançamentos avulsos e ocorrências marcadas como pagas.',
  },
];

/** Alterna entre as duas leituras do mês. Vale para os totais, as metas e os gráficos. */
export function SeletorModo() {
  const { modo, setModo } = useModoValor();

  return (
    <div
      role="group"
      aria-label="Leitura dos totais"
      className="flex shrink-0 rounded-md border p-0.5"
    >
      {OPCOES.map((opcao) => (
        <button
          key={opcao.modo}
          type="button"
          title={opcao.ajuda}
          aria-pressed={modo === opcao.modo}
          onClick={() => setModo(opcao.modo)}
          className={cn(
            'rounded px-2.5 py-1 text-xs font-medium transition-colors',
            modo === opcao.modo
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:text-foreground',
          )}
        >
          {opcao.rotulo}
        </button>
      ))}
    </div>
  );
}
