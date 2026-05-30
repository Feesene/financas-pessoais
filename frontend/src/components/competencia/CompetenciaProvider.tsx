'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  competenciaAtual,
  isCompetenciaValida,
  mesAnterior,
  mesSeguinte,
} from '@/lib/competencia';

const STORAGE_KEY = 'competencia';

interface CompetenciaContextValue {
  competencia: string;
  setCompetencia: (c: string) => void;
  irMesAnterior: () => void;
  irMesSeguinte: () => void;
}

const CompetenciaContext = createContext<CompetenciaContextValue | null>(null);

export function CompetenciaProvider({ children }: { children: React.ReactNode }) {
  // Valor inicial determinístico para evitar mismatch de hidratação SSR;
  // o valor de localStorage é aplicado no useEffect de montagem.
  const [competencia, setCompetenciaState] = useState<string>(competenciaAtual);

  useEffect(() => {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo && isCompetenciaValida(salvo)) {
        setCompetenciaState(salvo);
      }
    } catch {
      // localStorage indisponível (modo privado restrito) → mantém o estado em memória.
    }
  }, []);

  const setCompetencia = useCallback((c: string) => {
    if (!isCompetenciaValida(c)) return;
    setCompetenciaState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // Persistência falha silenciosamente; app segue funcionando só em memória.
    }
  }, []);

  const irMesAnterior = useCallback(() => {
    setCompetencia(mesAnterior(competencia));
  }, [competencia, setCompetencia]);

  const irMesSeguinte = useCallback(() => {
    setCompetencia(mesSeguinte(competencia));
  }, [competencia, setCompetencia]);

  return (
    <CompetenciaContext.Provider
      value={{ competencia, setCompetencia, irMesAnterior, irMesSeguinte }}
    >
      {children}
    </CompetenciaContext.Provider>
  );
}

export function useCompetencia(): CompetenciaContextValue {
  const ctx = useContext(CompetenciaContext);
  if (!ctx) {
    throw new Error('useCompetencia deve ser usado dentro de CompetenciaProvider');
  }
  return ctx;
}
