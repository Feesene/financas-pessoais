# Feature Spec — Competência global persistente entre páginas

- **Projeto:** financas-pessoais
- **PRD:** _(não há; spec derivada de pedido de melhoria)_
- **Slug:** competencia-global-persistente
- **Status:** Proposto
- **Depende de:** orcamento-mensal (P1) — e impacta todas as telas com navegação por mês

## 1. Descrição técnica da solução

Hoje cada tela deriva a competência isoladamente. O `OrcamentoView` lê de `searchParams` (`?competencia=AAAA-MM`)
e cai em `competenciaAtual()` quando ausente; outras telas (ex.: `CarteiraView`) usam `competenciaAtual()` fixo. Ao
trocar de página, a query string se perde e a competência **reseta para o mês atual** — o usuário perde o mês que
estava analisando.

A solução cria um **estado global de competência** compartilhado por toda a aplicação, persistido em `localStorage`,
exposto por um React Context (`CompetenciaProvider`) montado no `RootLayout` e consumido por um hook
`useCompetencia()`. O provider:

- inicializa lendo `localStorage['competencia']` (validando com `isCompetenciaValida`); fallback `competenciaAtual()`;
- grava no `localStorage` a cada mudança;
- expõe `{ competencia, setCompetencia, irMesAnterior, irMesSeguinte }`.

Para preservar deep-link/compartilhamento de URL, o `OrcamentoView` continua aceitando `?competencia=` como
**override de leitura na primeira carga** e, ao detectar o parâmetro, sincroniza o estado global (a URL "alimenta" o
estado, não o contrário). As telas passam a ler/escrever pelo hook em vez de cada uma gerenciar o seu mês, de modo que
trocar de página mantém a competência escolhida.

Hidratação: como o valor inicial vem de `localStorage` (indisponível no SSR), o provider usa um estado inicial
determinístico (`competenciaAtual()`) e ajusta no `useEffect` de montagem, evitando mismatch de hidratação (mesma
estratégia já usada pelo `ThemeProvider`/`themeScript`).

## 2. Fluxo técnico

```
RootLayout
  └─ CompetenciaProvider (Context)
       estado inicial: competenciaAtual()  (SSR-safe)
       onMount: lê localStorage['competencia'] (se válida) → setCompetencia
       setCompetencia(x): valida → estado + localStorage['competencia']=x

Tela (Orçamento / Carteira / Reservas / Relatórios / ...)
  const { competencia, setCompetencia, irMesAnterior, irMesSeguinte } = useCompetencia()
  NavegacaoMeses usa setCompetencia/ir*  → muda estado global
  troca de página → provider persiste → nova tela lê o mesmo mês

Deep-link (Orçamento): searchParams.competencia válido na 1ª carga
  → useEffect: se difere do estado, setCompetencia(param) (URL alimenta estado)
```

## 3. Entidades de domínio

Sem entidades de domínio (estado puramente de UI/cliente).

Modelo do contexto:
| Campo | Tipo | Descrição |
|-------|------|-----------|
| `competencia` | string `AAAA-MM` | mês ativo global |
| `setCompetencia` | `(c: string) => void` | valida, atualiza estado e persiste |
| `irMesAnterior` | `() => void` | aplica `mesAnterior(competencia)` |
| `irMesSeguinte` | `() => void` | aplica `mesSeguinte(competencia)` |

Chave de persistência: `localStorage['competencia']` (string `AAAA-MM`).

## 4. Tipos compartilhados

Nenhum tipo em `@financas-pessoais/shared` (cliente apenas). Tipo local:

```ts
interface CompetenciaContextValue {
  competencia: string;            // AAAA-MM
  setCompetencia: (c: string) => void;
  irMesAnterior: () => void;
  irMesSeguinte: () => void;
}
```

## 5. Contratos de API

Não se aplica (mudança puramente client-side). As chamadas existentes (`/lancamentos?competencia=`,
`/categorias/consumo?competencia=`, etc.) continuam recebendo a competência — agora vinda do estado global.

## 6. Requisitos funcionais

- **RF-001** — O app **DEVE** manter um único estado global de competência consumível por qualquer tela via `useCompetencia()`.
- **RF-002** — A competência selecionada **DEVE** persistir em `localStorage` e ser restaurada ao recarregar/reabrir o app.
- **RF-003** — Trocar de página **DEVE** preservar a competência atual (não resetar para o mês corrente).
- **RF-004** — `setCompetencia` **DEVE** validar o formato `AAAA-MM` (`isCompetenciaValida`) e ignorar valores inválidos.
- **RF-005** — Na ausência de valor salvo/válido, o estado inicial **DEVE** ser `competenciaAtual()`.
- **RF-006** — O `OrcamentoView` **DEVE** aceitar `?competencia=AAAA-MM` como override na primeira carga, sincronizando
  o estado global (deep-link preservado).
- **RF-007** — A inicialização **NÃO DEVE** causar mismatch de hidratação SSR (valor de `localStorage` aplicado só após montar).
- **RF-008** — `NavegacaoMeses` **DEVERIA** operar sobre o estado global (anterior/seguinte/seleção direta).

## 7. Requisitos não-funcionais

- **Compatibilidade**: deep-links existentes (`/orcamento?competencia=`) seguem funcionando.
- **Resiliência**: `localStorage` indisponível/corrompido → fallback silencioso para `competenciaAtual()`.
- **Performance**: leitura/escrita O(1); sem chamadas de rede adicionais.
- **Acessibilidade/UX**: a navegação de mês fica consistente entre telas (mesmo controle, mesmo valor).

## 8. Edge cases técnicos

1. **`localStorage` vazio** (primeiro acesso) → usa `competenciaAtual()`.
2. **Valor salvo inválido/corrompido** (ex.: `"2026-13"`, lixo) → descarta e usa `competenciaAtual()`.
3. **`?competencia=` inválido na URL** → ignorado; mantém o estado global atual.
4. **`?competencia=` válido divergente do salvo** → URL vence na 1ª carga e atualiza o estado global.
5. **SSR/primeira renderização** → render inicial com `competenciaAtual()`; ajuste pós-montagem sem flicker de hidratação.
6. **Duas abas abertas** → cada aba mantém seu estado em memória; `localStorage` reflete a última escrita (sem sincronização
   cross-tab no MVP; aceitável).
7. **`localStorage` desabilitado** (modo privado restrito) → persistência falha silenciosamente; app funciona só em memória.

## 9. Estratégia de testes

- Unit (provider/hook): inicialização (vazio, válido, inválido), `setCompetencia` valida e persiste, `ir*` calcula mês.
- Componente: trocar de página mantém competência (render de duas telas sob o mesmo provider).
- Integração: deep-link `?competencia=` sincroniza o estado; valor inválido na URL é ignorado.
- Regressão de hidratação: sem warning de mismatch no console em SSR.

## 10. Breakdown de tarefas

**Frontend — infraestrutura de estado**
- [x] T1 — `CompetenciaProvider` + `useCompetencia()` (estado, persistência localStorage, validação, `ir*`). *(—)*
- [x] T2 — Montar o provider no `RootLayout` (envolvendo as páginas, junto ao `ThemeProvider`). *(T1)*

**Frontend — adoção nas telas**
- [x] T3 — `OrcamentoView`: consumir `useCompetencia()`; manter `?competencia=` como override de 1ª carga e sincronizar estado. *(T2)*
- [x] T4 — `NavegacaoMeses`: operar sobre o estado global (anterior/seguinte/seleção). *(T1)*
- [x] T5 — `CarteiraView` e demais telas com mês (reservas, relatórios) passam a ler do hook em vez de `competenciaAtual()` fixo. *(T2)*

**Testes**
- [ ] T6 — Unit do provider/hook (inicialização, validação, persistência, navegação de mês). *(T1)*
- [ ] T7 — Componente: persistência entre troca de páginas + deep-link de override. *(T3,T5)*

## 11. Decisões e premissas

- **D1** — Estado global via **Context + localStorage**, sem dependência nova (sem Zustand/Redux), coerente com o
  padrão do `ThemeProvider`.
- **D2** — A **URL alimenta o estado** (não o inverso): deep-link continua funcionando, mas a fonte de verdade entre
  telas é o estado global persistido.
- **D3** — Sem sincronização cross-tab no MVP (cada aba em memória; `localStorage` guarda a última escrita) — simplicidade.
- **D4** — Inicialização SSR-safe com `competenciaAtual()` e ajuste no `useEffect`, espelhando a mitigação de flash já
  usada no tema.
