'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { isModoValor, type ModoValor } from '@financas-pessoais/shared';

const STORAGE_KEY = 'modo-valor';

interface ModoValorContextValue {
  modo: ModoValor;
  setModo: (modo: ModoValor) => void;
}

const ModoValorContext = createContext<ModoValorContextValue | null>(null);

/**
 * Guarda como o usuário quer ler os totais do mês: PREVISTO (tudo que foi
 * lançado) ou REALIZADO (só o que já se moveu). Diferente da competência, isto
 * é uma preferência e não uma posição de navegação, então não expira.
 */
export function ModoValorProvider({ children }: { children: React.ReactNode }) {
  // Valor inicial determinístico para evitar mismatch de hidratação SSR;
  // o valor de localStorage é aplicado no useEffect de montagem.
  const [modo, setModoState] = useState<ModoValor>('PREVISTO');

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (isModoValor(salvo)) setModoState(salvo);
    } catch {
      // localStorage indisponível (modo privado restrito) → segue em memória.
    }
  }, []);

  const setModo = useCallback((novo: ModoValor) => {
    setModoState(novo);
    try {
      localStorage.setItem(STORAGE_KEY, novo);
    } catch {
      // Persistência falha silenciosamente; app segue funcionando só em memória.
    }
  }, []);

  return (
    <ModoValorContext.Provider value={{ modo, setModo }}>{children}</ModoValorContext.Provider>
  );
}

export function useModoValor(): ModoValorContextValue {
  const ctx = useContext(ModoValorContext);
  if (!ctx) {
    throw new Error('useModoValor deve ser usado dentro de ModoValorProvider');
  }
  return ctx;
}
