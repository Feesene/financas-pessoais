'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { competenciaAtual, isCompetenciaValida, mesAnterior, mesSeguinte } from '@/lib/competencia';

const STORAGE_KEY = 'competencia';

/**
 * Validade da competência guardada. A memória serve para atravessar um F5 ou a
 * troca de aba dentro da mesma sessão de trabalho; passado esse tempo, abrir o
 * app em julho e cair em março (onde se navegou da última vez) é sempre erro.
 */
const VALIDADE_MS = 12 * 60 * 60 * 1000;

interface CompetenciaSalva {
  competencia: string;
  salvoEm: number;
}

interface CompetenciaContextValue {
  competencia: string;
  setCompetencia: (c: string) => void;
  irMesAnterior: () => void;
  irMesSeguinte: () => void;
  /** Volta para o mês corrente. */
  irParaHoje: () => void;
  /** true quando a competência selecionada é o mês corrente. */
  noMesAtual: boolean;
}

/** Lê a competência guardada, descartando formato inválido ou registro vencido. */
function lerSalva(): string | null {
  try {
    const bruto = localStorage.getItem(STORAGE_KEY);
    if (!bruto) return null;
    // Formato antigo (só a competência, sem timestamp) é descartado: sem saber
    // quando foi salvo, o mês corrente é o palpite mais seguro.
    if (!bruto.startsWith('{')) return null;
    const salva = JSON.parse(bruto) as Partial<CompetenciaSalva>;
    if (typeof salva.competencia !== 'string' || !isCompetenciaValida(salva.competencia)) {
      return null;
    }
    if (typeof salva.salvoEm !== 'number' || Date.now() - salva.salvoEm > VALIDADE_MS) {
      return null;
    }
    return salva.competencia;
  } catch {
    // localStorage indisponível ou JSON corrompido → mantém o estado em memória.
    return null;
  }
}

const CompetenciaContext = createContext<CompetenciaContextValue | null>(null);

export function CompetenciaProvider({ children }: { children: React.ReactNode }) {
  // Valor inicial determinístico para evitar mismatch de hidratação SSR;
  // o valor de localStorage é aplicado no useEffect de montagem.
  const [competencia, setCompetenciaState] = useState<string>(competenciaAtual);

  useEffect(() => {
    const salva = lerSalva();
    if (salva) setCompetenciaState(salva);
  }, []);

  const setCompetencia = useCallback((c: string) => {
    if (!isCompetenciaValida(c)) return;
    setCompetenciaState(c);
    try {
      const salva: CompetenciaSalva = { competencia: c, salvoEm: Date.now() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(salva));
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

  const irParaHoje = useCallback(() => {
    setCompetencia(competenciaAtual());
  }, [setCompetencia]);

  return (
    <CompetenciaContext.Provider
      value={{
        competencia,
        setCompetencia,
        irMesAnterior,
        irMesSeguinte,
        irParaHoje,
        noMesAtual: competencia === competenciaAtual(),
      }}
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
