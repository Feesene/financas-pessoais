# Feature Spec — Correções e Gráficos da Dashboard + Tema do Toast

| Campo | Valor |
|---|---|
| Slug | `correcoes-dashboard-graficos-tema` |
| Data | 2026-05-30 |
| Autor | Felipe |
| PRD relacionado | — (não há PRD; spec derivada de lista de correções/melhorias) |
| Status | Pronta para execução |

---

## 1. Visão geral e objetivo

Este documento técnico detalha quatro itens independentes no app de finanças pessoais (monorepo `backend` NestJS + `frontend` Next.js + `shared`). Dois são correções (tema do toast e cálculo das agregações da dashboard) e dois são novos gráficos na dashboard (reservas por mês do ano e previsto-vs-pago por mês do ano).

Os itens são:

1. **Toast com tema fixo `dark`** — o `Toaster` (sonner) está com `theme="dark"` hardcoded, então no modo claro o toast continua escuro, destoando do restante da UI.
2. **Cálculo das receitas/despesas inconsistente** — a soma de receitas (e despesas) não bate entre os cards KPI e o gráfico de linha da dashboard. Há **duas causas** (ver 1.1). A correção unifica todas as agregações em `valorEfetivo` e garante que os meses do gráfico estejam materializados.
3. **Novo gráfico: reservas por mês do ano** — curva do **saldo reservado acumulado** (todos os baldes) ao fim de cada mês de Janeiro a Dezembro do ano corrente.
4. **Novo gráfico: previsto vs pago por mês do ano** — para cada mês do ano, comparação entre o total **previsto** e o total efetivamente **pago/conferido** de receitas e de despesas.

### 1.1 Análise do cálculo (resultado do item 2 — diagnóstico)

A soma de receitas diverge entre telas por **dois motivos cumulativos**:

**Causa A — `valor` vs `valorEfetivo`.** O card KPI "Receitas" da dashboard usa `lancamento.valorEfetivo` (`backend/src/modules/lancamentos/application/use-cases/obter-resumo-mensal.use-case.ts:21`), que é o `valorPago` quando a ocorrência está marcada como paga e o `valor` previsto caso contrário (`Lancamento.valorEfetivo`, `lancamento.ts:110`). Já o gráfico de linha (evolução) e o gráfico de gastos por categoria somam `lancamento.valor` **bruto** (`backend/src/modules/relatorios/infrastructure/adapters/lancamento-query.adapter.ts:29` e `:55`), ignorando o `valorPago`. Sempre que uma recorrência é paga com valor diferente do previsto, as duas telas divergem.

**Causa B — meses não materializados.** A dashboard só materializa a **competência atual** antes de carregar (`DashboardView.tsx:94`). O gráfico de linha cobre os **últimos 6 meses** (`subtrairMeses(competencia, 5)` → `competencia`). Meses passados que o usuário nunca abriu **não têm** as recorrências materializadas, então o gráfico subestima receitas/despesas desses meses, enquanto o relatório/consolidado de um mês já materializado mostra outro número. Resultado: "não bate em lugar nenhum".

**Efeito colateral relevante.** O `LancamentoQueryAdapter` (`somarPorTipoECompetencia` e `somarDespesaPorCategoria`) é compartilhado por **três** consumidores: gráfico de evolução (`ObterEvolucaoUseCase`), gastos por categoria (`ObterGastoPorCategoriaUseCase`) e relatório consolidado (`ObterConsolidadoUseCase`). Trocar o adapter para `valorEfetivo` unifica os três numa única convenção — exatamente o que o item pede ("não bate em nenhum lugar" → passar a bater em todos). Isso **altera os números do relatório consolidado** (que hoje usa valor previsto); ver decisão D-02.

### 1.2 Decisões confirmadas com o usuário

- Agregações da dashboard usam **`valorEfetivo`** (pago quando marcado, senão previsto) — alinhando com os cards KPI.
- O gráfico de linha (e demais agregações de intervalo) deve **materializar todos os meses do intervalo** antes de somar.
- O gráfico "previsto vs pago" mostra as **duas séries lado a lado** (previsto e pago), por mês do ano.
- O gráfico de reservas mostra o **saldo reservado acumulado** ao fim de cada mês do ano.

---

## 2. Escopo

**Dentro do escopo:**
- `Toaster` passa a refletir o tema atual (`light`/`dark`/`system` resolvido) em vez de `dark` fixo.
- `LancamentoQueryAdapter` passa a somar `valorEfetivo` (impacta evolução, gastos por categoria e consolidado).
- Materialização de **todos os meses** necessários (ano corrente: Jan–Dez) antes de montar os gráficos da dashboard.
- Novo endpoint e gráfico: saldo reservado acumulado por mês do ano.
- Novo endpoint e gráfico: previsto vs pago (receitas e despesas) por mês do ano.

**Fora do escopo:**
- Estender o conceito de "pago" para lançamentos manuais (hoje só recorrências têm `pago`). O gráfico previsto-vs-pago contabiliza como "pago" apenas o que o domínio já marca; lançamentos manuais entram só no "previsto".
- Alterar a heurística de classificação poupança/viagem do relatório (permanece por nome do balde).
- Mudar o intervalo do gráfico de evolução existente (continua "últimos 6 meses").
- Exportação/PDF dos novos gráficos.

---

## 3. Itens em detalhe

### 3.1 Toast com tema fixo `dark`

**Diagnóstico.** `frontend/src/components/ui/sonner.tsx:10` passa `theme="dark"` literal ao `<Sonner>`. O tema real do app é controlado pelo `ThemeProvider` (`frontend/src/components/theme/ThemeProvider.tsx`), que aplica a classe `dark` no `<html>` e expõe `useTheme()` com `'light' | 'dark' | 'system'`.

**Correção (frontend, só UI):** Em `sonner.tsx`, consumir `useTheme()` e passar o tema **resolvido** ao `<Sonner theme=...>`. Como o sonner aceita `'light' | 'dark' | 'system'`, podemos repassar o valor diretamente — `'system'` faz o sonner seguir o `prefers-color-scheme`. Para garantir coerência com a escolha manual do usuário (que sobrepõe o `system`), repassar `theme={theme}` do `useTheme()`. Remover o `theme="dark"` hardcoded; o `{...props}` ainda permite override pontual.

**Premissa (D-03):** repassar `theme` do `useTheme()` é suficiente. Caso se observe descasamento quando `theme === 'system'` mas o usuário forçou classe `dark` manualmente, resolver para o valor efetivo lendo `document.documentElement.classList.contains('dark')`. A implementação inicial usa `useTheme()` direto.

**Arquivos:** `frontend/src/components/ui/sonner.tsx`.

### 3.2 Cálculo das receitas/despesas inconsistente

**Correção (backend):**
1. Em `LancamentoQueryAdapter.somarPorTipoECompetencia` (`lancamento-query.adapter.ts`), trocar `lancamento.valor` por `lancamento.valorEfetivo` ao acumular receitas/despesas em centavos.
2. Em `LancamentoQueryAdapter.somarDespesaPorCategoria`, trocar `lancamento.valor` por `lancamento.valorEfetivo`.
3. Atualizar/ajustar os testes que fixam o comportamento anterior (`obter-evolucao.use-case.spec.ts`, `obter-gasto-por-categoria.use-case.spec.ts`, `obter-consolidado.use-case.spec.ts`) para refletir `valorEfetivo`, adicionando ao menos um caso com ocorrência paga com `valorPago ≠ valor`.

**Correção (frontend):**
4. Em `DashboardView.tsx`, antes do `Promise.all`, materializar **todas as competências do ano** (Jan–Dez do ano de `competencia`) em paralelo, ignorando erros (idempotente), em vez de só a competência atual. Isso cobre tanto o gráfico de 6 meses quanto os novos gráficos anuais. Reaproveitar `recorrenciasApi.materializar`.
   - Helper local `competenciasDoAno(ano: number): string[]` → `['AAAA-01', ..., 'AAAA-12']`.
   - `await Promise.allSettled(competenciasDoAno(ano).map((c) => recorrenciasApi.materializar(c)))`.

**Resultado.** Após (1)–(4), o card KPI "Receitas" e a série "receitas" do gráfico de linha passam a usar a mesma base (`valorEfetivo`) sobre os mesmos lançamentos materializados, batendo entre si e com o relatório consolidado.

**Arquivos:** `backend/src/modules/relatorios/infrastructure/adapters/lancamento-query.adapter.ts`, specs citadas, `frontend/src/components/dashboard/DashboardView.tsx`.

### 3.3 Novo gráfico: reservas por mês do ano (saldo acumulado)

**Diagnóstico.** Hoje só existe evolução **por balde** (`GET /baldes/:id/evolucao` → `ObterEvolucaoBaldeUseCase`), não um total agregado de todos os baldes por mês. A dashboard mostra apenas o KPI "Total reservado" (saldo atual).

**Correção (backend):** Novo use-case `ObterEvolucaoReservasUseCase` no módulo de reservas que calcula, para cada competência de um ano (Jan–Dez), o **saldo reservado total acumulado** ao fim do mês = `Σ_baldes (saldoInicial_balde) + Σ efeitos de todos os movimentos com competência ≤ mês`. Cálculo em centavos. Reaproveita `MovimentoReserva.efeitoEmCentavos` (já usado em `ObterEvolucaoBaldeUseCase`).
- Algoritmo: somar `saldoInicial` de todos os baldes (em centavos) → base. Agrupar efeito líquido (centavos) por competência sobre **todos** os movimentos. Para cada mês de `AAAA-01` a `AAAA-12`, acumular sequencialmente os efeitos até aquele mês e emitir `{ competencia, total }`. Meses sem movimento repetem o acumulado anterior (série contínua, 12 pontos).
- Novo endpoint `GET /reservas/evolucao-anual?ano=AAAA` no `ReservasController` → `EvolucaoReservaItemDTO[]` (12 itens, Jan–Dez).

**Correção (frontend):**
- Em `reservas.ts`, adicionar `evolucaoAnual(ano: number): Promise<EvolucaoReservaItemDTO[]>`.
- Em `DashboardView.tsx`, carregar `reservasApi.evolucaoAnual(ano)` junto ao `Promise.all` e renderizar um novo card com `LineChart` (área/linha única "Total reservado") usando `competenciaLabel` no eixo X e `formatarReais` no Y. Estado vazio: "Sem reservas no período.".

**Arquivos:** `shared/src/types/index.ts` (novo `EvolucaoReservaItemDTO`), `backend` (use-case, controller, módulo), `frontend` (`reservas.ts`, `DashboardView.tsx`).

### 3.4 Novo gráfico: previsto vs pago por mês do ano

**Diagnóstico.** Não existe agregação que separe, por mês, o total **previsto** (todos os lançamentos pelo `valor`) do total **pago/conferido** (`valorEfetivo` somente das ocorrências com `pago = true`). O conceito "pago" hoje só se aplica a recorrências (`origemRegraId !== null`); lançamentos manuais nunca são "pagos".

**Correção (backend):**
1. Nova porta/método no `LancamentoQueryPort`: `somarPrevistoPagoPorCompetencia(de, ate): Promise<PrevistoPagoCompetencia[]>`, implementado no `LancamentoQueryAdapter`. Para cada competência do intervalo, somar em centavos: `receitasPrevisto` (Σ `valor` de receitas), `receitasPago` (Σ `valorEfetivo` de receitas com `pago === true`), `despesasPrevisto` (Σ `valor` de despesas), `despesasPago` (Σ `valorEfetivo` de despesas com `pago === true`).
2. Novo use-case `ObterPrevistoPagoUseCase` no módulo de relatórios, espelhando `ObterEvolucaoUseCase`: valida intervalo, monta série contínua (meses zerados), retorna `PrevistoPagoItemDTO[]`.
3. Novo endpoint `GET /relatorios/previsto-pago?de=AAAA-MM&ate=AAAA-MM` no `RelatoriosController` (reaproveita `IntervaloQueryRequest`).

**Correção (frontend):**
- Em `relatorios.ts`, adicionar `previstoPago(de, ate): Promise<PrevistoPagoItemDTO[]>`.
- Em `DashboardView.tsx`, carregar `relatoriosApi.previstoPago(`${ano}-01`, `${ano}-12`)` no `Promise.all` e renderizar um `BarChart` agrupado com quatro séries (receitas previsto/pago, despesas previsto/pago) — ou dois mini-gráficos (receitas e despesas) cada um com previsto vs pago. Decisão D-04: um único `BarChart` agrupado por mês com as quatro barras, legenda clara. Estado vazio: "Sem movimentação no ano.".

**Arquivos:** `shared/src/types/index.ts` (novo `PrevistoPagoItemDTO`), `backend` (porta, adapter, use-case, controller, módulo, specs), `frontend` (`relatorios.ts`, `DashboardView.tsx`).

---

## 4. Entidades de domínio afetadas

Nenhuma entidade de domínio é criada ou alterada (sem migração). Os itens 3.2–3.4 são agregações de leitura sobre entidades existentes (`Lancamento`, `Balde`, `MovimentoReserva`). Novos **DTOs de leitura** em `shared/src/types/index.ts`:

### EvolucaoReservaItemDTO (novo)

| Atributo | Tipo | Observação |
|---|---|---|
| competencia | `string` (`AAAA-MM`) | Mês do ano |
| total | `number` (reais) | Saldo reservado acumulado de todos os baldes ao fim do mês; pode ser negativo |

### PrevistoPagoItemDTO (novo)

| Atributo | Tipo | Observação |
|---|---|---|
| competencia | `string` (`AAAA-MM`) | Mês do ano |
| receitasPrevisto | `number` (reais) | Σ `valor` de receitas da competência |
| receitasPago | `number` (reais) | Σ `valorEfetivo` de receitas com `pago = true` |
| despesasPrevisto | `number` (reais) | Σ `valor` de despesas da competência |
| despesasPago | `number` (reais) | Σ `valorEfetivo` de despesas com `pago = true` |

`PrevistoPagoCompetencia` (porta, infraestrutura) tem os mesmos campos; é mapeado 1:1 ao DTO pelo use-case.

---

## 5. Contratos de API

### 5.1 `GET /reservas/evolucao-anual?ano=AAAA`

- **Request:** query `ano` (obrigatória, inteiro de 4 dígitos, ex.: `2026`). Validada em DTO de query (`ano` numérico).
- **Response 200:** `EvolucaoReservaItemDTO[]` com **12 itens** (Jan–Dez), série contínua.
```json
[
  { "competencia": "2026-01", "total": 1500.0 },
  { "competencia": "2026-02", "total": 1800.5 }
]
```
- **Erros:** `400` se `ano` ausente ou não numérico. Sem baldes/movimentos → 12 itens com `total` igual à soma dos `saldoInicial` (ou `0`).

### 5.2 `GET /relatorios/previsto-pago?de=AAAA-MM&ate=AAAA-MM`

- **Request:** query `de` e `ate` (`AAAA-MM`), reaproveitando `IntervaloQueryRequest`.
- **Response 200:** `PrevistoPagoItemDTO[]`, série contínua (meses zerados aparecem).
```json
[
  { "competencia": "2026-05", "receitasPrevisto": 5000.0, "receitasPago": 5000.0,
    "despesasPrevisto": 3200.0, "despesasPago": 2800.0 }
]
```
- **Erros:** `400 Bad Request` (`IntervaloInvalidoError`) se intervalo inválido (de > ate, formato incorreto), tratado pelo `executar(...)` do controller.

### 5.3 Endpoints inalterados (comportamento de cálculo alterado)

`GET /relatorios/evolucao`, `GET /relatorios/por-categoria`, `GET /relatorios/consolidado` mantêm **contrato** idêntico, mas passam a refletir `valorEfetivo` em vez de `valor` (efeito da mudança no adapter — ver D-02). Nenhuma mudança de request/response shape.

---

## 6. Edge cases técnicos

| # | Cenário | Comportamento esperado |
|---|---|---|
| EC-1 | Recorrência paga com `valorPago ≠ valor` na competência | Card KPI e série do gráfico de linha agora usam `valorEfetivo` e **batem**; o consolidado também reflete o pago. |
| EC-2 | Mês passado nunca materializado ao abrir a dashboard | A materialização do ano (Jan–Dez) roda antes do fetch; recorrências aparecem em todos os meses do gráfico. |
| EC-3 | Falha (rede/API) na materialização de um ou mais meses | `Promise.allSettled` ignora falhas (idempotente); a dashboard ainda carrega com os dados disponíveis, sem cair para o estado de erro só por causa da materialização. |
| EC-4 | `previsto-pago` num mês sem nenhuma ocorrência paga (só manuais) | `receitasPago`/`despesasPago` = `0`; séries "previsto" preenchidas. Gráfico renderiza barras de pago zeradas. |
| EC-5 | Reservas sem nenhum balde/movimento | `evolucao-anual` retorna 12 itens com `total` = Σ `saldoInicial` (ou 0). Gráfico mostra linha plana ou estado vazio. |
| EC-6 | Reserva com retirada que zera/torna negativo o acumulado | Saldo acumulado pode cair entre meses e ficar negativo; o gráfico exibe a queda sem erro (negativo permitido). |
| EC-7 | Tema = `system` com SO em claro | `Toaster` resolve para visual claro; ao alternar tema manualmente, o toast acompanha em re-render. |
| EC-8 | Troca de competência para outro ano | Os gráficos anuais recarregam para o novo ano; a materialização cobre Jan–Dez do novo ano. |
| EC-9 | Valores com centavos em recorrências parceladas | Toda soma é feita em centavos (`Math.round(x*100)`) antes de dividir por 100, evitando erro de ponto flutuante. |

---

## 7. Requisitos funcionais

- **RF-001 — O sistema DEVE** exibir os toasts no tema atual do app (claro/escuro/sistema), sem fixar `dark`, acompanhando trocas de tema em tempo de execução.
- **RF-002 — O sistema DEVE** somar receitas e despesas das agregações de relatório (evolução, gastos por categoria e consolidado) usando `valorEfetivo` (pago quando marcado, senão previsto), de modo que o gráfico de linha bata com os cards KPI da dashboard.
- **RF-003 — O sistema DEVE**, ao carregar a dashboard, materializar todas as competências do ano corrente (Jan–Dez) antes de montar os gráficos, tratando falhas de materialização como não-fatais.
- **RF-004 — O sistema DEVE** expor `GET /reservas/evolucao-anual?ano=AAAA` retornando o saldo reservado total acumulado ao fim de cada mês (12 pontos), e a dashboard **DEVE** exibir esse gráfico.
- **RF-005 — O sistema DEVE** expor `GET /relatorios/previsto-pago?de=&ate=` retornando, por competência, os totais previsto e pago de receitas e de despesas, e a dashboard **DEVE** exibir esse gráfico com as séries previsto e pago lado a lado.
- **RF-006 — O sistema DEVE** tratar como "pago" apenas ocorrências com `pago = true` (recorrências); lançamentos manuais entram somente no "previsto".
- **RF-007 — O sistema DEVERIA** manter série temporal contínua (meses sem dados zerados/repetindo acumulado) em todos os gráficos anuais.
- **RF-008 — O sistema DEVERIA** exibir estado vazio amigável em cada novo gráfico quando não houver dados no período.

---

## 8. Requisitos não-funcionais

- **Performance:** a materialização do ano são até 12 chamadas idempotentes em paralelo por carga de dashboard; aceitável para uso pessoal (retorna `criados: 0` quando já materializado). As agregações novas reusam `findAll`/`findByCompetencia` existentes; volume pequeno. Se a latência incomodar, considerar materialização sob demanda apenas dos meses faltantes (otimização futura, fora do escopo).
- **Segurança / validação:** `ano` e `de`/`ate` validados por DTO de query antes do use-case; sem entrada livre que chegue ao domínio malformada.
- **Consistência de dados:** todas as somas em centavos (`Math.round(x*100)`), dividindo por 100 só na borda. `valorEfetivo` passa a ser a convenção única de agregação financeira.
- **Observabilidade:** mantém o padrão atual de mapeamento de erros (`IntervaloInvalidoError → 400`); sem novo logging.
- **Compatibilidade:** novos DTOs são aditivos; mudança de `valor → valorEfetivo` no adapter é transparente ao contrato HTTP, mas **altera valores** do consolidado (ver D-02) — revisar antes de publicar.

---

## 9. Decisões e premissas

- **D-01:** As agregações da dashboard usam `valorEfetivo`. (Confirmado pelo usuário.)
- **D-02:** Como o `LancamentoQueryAdapter` é compartilhado, mudar para `valorEfetivo` **também altera o relatório consolidado** (hoje em valor previsto). Adotamos a unificação por consistência ("bater em todos os lugares"). **Item para revisão** antes de publicar, caso se queira manter o consolidado em previsto (exigiria um método/porta separado). A spec assume a unificação.
- **D-03:** O `Toaster` repassa `theme` do `useTheme()` diretamente ao sonner. Se surgir descasamento em `system`, evoluir para ler a classe `dark` resolvida do `<html>`. (Premissa.)
- **D-04:** O gráfico previsto-vs-pago é um único `BarChart` agrupado por mês com quatro séries (receitas previsto/pago, despesas previsto/pago). (Premissa de UI; pode virar dois mini-gráficos se ficar poluído.)
- **D-05:** "Dar check" = ocorrência com `pago = true`. Não estendemos `pago` a lançamentos manuais nesta entrega; eles contam só no previsto. (Confirmado pelo usuário ao escolher "previsto vs pago".)
- **D-06:** O gráfico de reservas mostra **saldo acumulado** (não movimentos por mês). (Confirmado pelo usuário.)
- **D-07:** A materialização cobre o **ano inteiro** (Jan–Dez) na carga da dashboard, cobrindo tanto o gráfico de 6 meses quanto os anuais, com `Promise.allSettled` para tolerar falhas. (Premissa derivada de "materializar os 6 meses".)

---

## 10. Breakdown de tarefas

> Cada tarefa cabe em 1 PR. Dependências indicadas inline.

**Bloco A — Correções rápidas (independentes)**

- [x] **A1.** Toast segue o tema: em `sonner.tsx`, consumir `useTheme()` e passar `theme={theme}` ao `<Sonner>`, removendo `theme="dark"`. *(sem dependências)*
- [x] **A2.** Unificar agregações em `valorEfetivo`: trocar `lancamento.valor` por `lancamento.valorEfetivo` em `somarPorTipoECompetencia` e `somarDespesaPorCategoria` (`lancamento-query.adapter.ts`); ajustar specs (`obter-evolucao`, `obter-gasto-por-categoria`, `obter-consolidado`) com caso de ocorrência paga com `valorPago ≠ valor`. *(sem dependências)*
- [x] **A3.** Materializar o ano na dashboard: helper `competenciasDoAno(ano)` + `Promise.allSettled(...materializar)` antes do `Promise.all` em `DashboardView.tsx`, substituindo a materialização só da competência atual. *(sem dependências)*

**Bloco B — Gráfico de reservas por mês do ano**

- [x] **B1.** `EvolucaoReservaItemDTO` em `shared/src/types/index.ts` + rebuild do `shared`. *(sem dependências)*
- [x] **B2.** `ObterEvolucaoReservasUseCase` (saldo acumulado de todos os baldes por mês Jan–Dez, em centavos) + spec; registrar no módulo de reservas. *(depende de B1)*
- [x] **B3.** Endpoint `GET /reservas/evolucao-anual?ano=` no `ReservasController` com DTO de query validando `ano`. *(depende de B2)*
- [ ] **B4.** Frontend: `reservasApi.evolucaoAnual(ano)` em `reservas.ts` + card com `LineChart` "Total reservado" em `DashboardView.tsx` (carregado no `Promise.all`, com estado vazio). *(depende de B3)*

**Bloco C — Gráfico previsto vs pago por mês do ano**

- [x] **C1.** `PrevistoPagoItemDTO` em `shared/src/types/index.ts` + `PrevistoPagoCompetencia` na porta `LancamentoQueryPort` (assinatura `somarPrevistoPagoPorCompetencia`); rebuild do `shared`. *(sem dependências)*
- [x] **C2.** Implementar `somarPrevistoPagoPorCompetencia` no `LancamentoQueryAdapter` (previsto = Σ `valor`; pago = Σ `valorEfetivo` com `pago === true`, por tipo, em centavos). *(depende de C1, A2)*
- [x] **C3.** `ObterPrevistoPagoUseCase` (série contínua) + spec + endpoint `GET /relatorios/previsto-pago?de=&ate=` no `RelatoriosController`; registrar no módulo. *(depende de C2)*
- [ ] **C4.** Frontend: `relatoriosApi.previstoPago(de, ate)` em `relatorios.ts` + `BarChart` agrupado (receitas/despesas × previsto/pago) em `DashboardView.tsx`, carregado para o ano corrente (`${ano}-01`..`${ano}-12`), com estado vazio. *(depende de C3, A3)*
