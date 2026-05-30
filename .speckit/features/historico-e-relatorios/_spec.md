# Feature Spec — Histórico e Relatórios/Dashboards (P5)

- **Projeto:** financas-pessoais
- **PRD:** [`_prd.md`](./_prd.md)
- **Slug:** historico-e-relatorios
- **Status:** Proposto
- **Depende de:** orcamento-mensal (P1), categorias-e-metas (P2), reservas-por-objetivo (P4)

## 1. Descrição técnica da solução

Novo módulo de domínio **`relatorios`** que é **somente leitura/agregação** — não possui entidades próprias
persistidas. Ele orquestra os repositórios de `lancamentos` (P1), `categorias` (P2) e `reservas` (P4) por meio
de **ports** (interfaces consultadas), produzindo DTOs consolidados. A consolidação por competência é uma
agregação derivada; nada é materializado. A exportação (PDF/Excel) é gerada sob demanda a partir do mesmo DTO
consolidado.

## 2. Fluxo técnico

```
[Consolidado anual] → GET /relatorios/consolidado?ano=2026 (ou ?de=AAAA-MM&ate=AAAA-MM)
   → ObterConsolidadoUseCase
       para cada competência no intervalo:
         liquidoRecebido = Σ RECEITA               (LancamentoQueryPort)
         gastos          = Σ DESPESA               (LancamentoQueryPort)
         poupanca        = Σ aportes baldes-poupança (ReservaQueryPort)
         viagem          = Σ aportes baldes-viagem    (ReservaQueryPort)
         sobras          = liquidoRecebido − gastos − poupanca − viagem
   → ConsolidadoMensalDTO[] + TotaisAnoDTO

[Gasto por categoria] → GET /relatorios/por-categoria?de=&ate=
   → ObterGastoPorCategoriaUseCase: Σ DESPESA agrupado por categoriaId (CategoriaQueryPort p/ nome+cor)

[Evolução]   → GET /relatorios/evolucao?de=&ate= → { competencia, receitas, despesas, saldo }[]
[Comparação] → GET /relatorios/comparar?a=AAAA-MM&b=AAAA-MM → por categoria: gastoA, gastoB, variacao, variacaoPct
[Exportação] → GET /relatorios/exportar?formato=pdf|xlsx&de=&ate= → arquivo (stream)
```

## 3. Entidades de domínio

Este módulo **não introduz entidades persistidas**. Define apenas **value objects de leitura** (DTOs de
agregação) e **ports** para consultar os módulos existentes:

### Ports (interfaces consumidas)
| Port | Método | Origem |
|------|--------|--------|
| `LancamentoQueryPort` | `somarPorTipoECompetencia(de, ate)`, `somarDespesaPorCategoria(de, ate)` | módulo `lancamentos` (P1) |
| `CategoriaQueryPort` | `listar()` (id, nome, cor, tipo) | módulo `categorias` (P2) |
| `ReservaQueryPort` | `somarAportesPorBaldeCategoria(de, ate)` (poupança/viagem) | módulo `reservas` (P4) |

> Os ports são **interfaces no domínio de `relatorios`**; a infraestrutura as implementa adaptando os
> repositórios reais dos outros módulos (padrão Anti-Corruption Layer / adapter). Assim `relatorios` não
> importa entidades de persistência de outros módulos.

### Classificação poupança/viagem
- A coluna **poupança** soma aportes de baldes marcados como categoria de reserva `POUPANCA`; **viagem** soma
  baldes de categoria `VIAGEM`. Como P4 não modela categoria de balde explicitamente, a infraestrutura mapeia
  por **nome do balde** (configurável; default: contém "poupanç"/"viagem", case-insensitive). Ver D2.

## 4. Tipos compartilhados

```ts
export interface ConsolidadoMensalDTO {
  competencia: string;        // AAAA-MM
  liquidoRecebido: number;
  gastos: number;
  poupanca: number;
  viagem: number;
  sobras: number;             // liquidoRecebido - gastos - poupanca - viagem
}
export interface TotaisAnoDTO {
  liquidoRecebido: number; gastos: number; poupanca: number; viagem: number; sobras: number;
}
export interface ConsolidadoDTO { de: string; ate: string; meses: ConsolidadoMensalDTO[]; totais: TotaisAnoDTO; }

export interface GastoPorCategoriaItemDTO { categoria: CategoriaDTO; total: number; percentual: number; }
export interface EvolucaoMensalItemDTO { competencia: string; receitas: number; despesas: number; saldo: number; }
export interface ComparacaoCategoriaItemDTO {
  categoria: CategoriaDTO; gastoA: number; gastoB: number; variacao: number; variacaoPct: number | null;
}
export interface ComparacaoMesesDTO { a: string; b: string; itens: ComparacaoCategoriaItemDTO[]; }
export type FormatoExportacao = 'pdf' | 'xlsx';
```

## 5. Contratos de API

- **GET /relatorios/consolidado?ano=AAAA** *(ou `?de=AAAA-MM&ate=AAAA-MM`)* → 200 `ConsolidadoDTO`; 400
  (intervalo inválido / `de > ate`).
- **GET /relatorios/por-categoria?de=AAAA-MM&ate=AAAA-MM** → 200 `GastoPorCategoriaItemDTO[]` (ordenado desc por
  total); 400.
- **GET /relatorios/evolucao?de=AAAA-MM&ate=AAAA-MM** → 200 `EvolucaoMensalItemDTO[]`; 400.
- **GET /relatorios/comparar?a=AAAA-MM&b=AAAA-MM** → 200 `ComparacaoMesesDTO`; 400 (a/b ausente ou inválido).
- **GET /relatorios/exportar?formato=pdf|xlsx&de=AAAA-MM&ate=AAAA-MM** → 200 arquivo binário
  (`Content-Type` adequado, `Content-Disposition: attachment`); 400 (formato/intervalo inválido).

## 6. Requisitos funcionais

- **RF-001** — `ObterConsolidadoUseCase` **DEVE** produzir uma linha por competência no intervalo, com
  líquido/gastos/poupança/viagem/sobras e totais do período.
- **RF-002** — `sobras` **DEVE** ser `liquidoRecebido − gastos − poupanca − viagem`, com 2 casas decimais.
- **RF-003** — `ObterGastoPorCategoriaUseCase` **DEVE** agregar despesas por categoria no período e calcular o
  percentual sobre o total.
- **RF-004** — `ObterEvolucaoUseCase` **DEVE** retornar receitas, despesas e saldo por competência.
- **RF-005** — `CompararMesesUseCase` **DEVE** retornar, por categoria, gasto de A, gasto de B, variação
  absoluta e percentual (`null` quando A=0).
- **RF-006** — Backend **DEVERIA** expor exportação em PDF e XLSX do consolidado/relatório do período.
- **RF-007** — Meses sem dados **DEVEM** aparecer com valores zerados (série temporal contínua).
- **RF-008** — Frontend **DEVE** ter tela de histórico (tabela), tela de relatórios (gráficos) e ação de
  exportar.

## 7. Requisitos não-funcionais

- **Performance**: consolidado de 12 meses em < 500 ms; agregações via `GROUP BY` no banco, não em memória
  linha-a-linha quando evitável.
- **Consistência**: valores sempre derivados de P1/P2/P4 (fonte única); nenhuma duplicação de regra de saldo.
- **Desacoplamento**: `relatorios` acessa outros módulos só via ports (sem importar entidades de persistência
  alheias).
- **Exportação**: geração local (sem serviço externo); arquivos com 2 casas decimais e cabeçalhos legíveis.

## 8. Edge cases técnicos

1. Período sem nenhum lançamento → todas as linhas zeradas; totais = 0 (não erro).
2. `de > ate` (ou ano inexistente) → 400.
3. Categoria sem despesas no período → não aparece no gráfico de categoria (ou aparece com 0, ver D4).
4. Comparação onde o mês A tem gasto 0 numa categoria → `variacaoPct = null` (evita divisão por zero).
5. Balde de poupança/viagem inexistente (P4 vazio) → colunas poupança/viagem = 0; sobras = líquido − gastos.
6. Exportação de período muito grande → permitida, mas paginada/streamada; sem estourar memória.

## 9. Estratégia de testes

- Unitário: fórmula de sobras; percentual por categoria; variação e variacaoPct (incl. divisão por zero);
  preenchimento de meses vazios.
- Integração: consolidado cruzando P1+P2+P4 com dados semeados; `GROUP BY` correto; intervalo inválido → 400.
- Frontend: render da tabela consolidada com linha de totais; gráficos (pizza categoria, linha evolução);
  comparação; disparo de download na exportação.

## 10. Breakdown de tarefas

**Shared**
- [x] T1 — Tipos `ConsolidadoMensalDTO`, `TotaisAnoDTO`, `ConsolidadoDTO`, `GastoPorCategoriaItemDTO`,
  `EvolucaoMensalItemDTO`, `ComparacaoCategoriaItemDTO`, `ComparacaoMesesDTO`, `FormatoExportacao`.

**Backend — módulo relatorios (somente leitura)**
- [x] T2 — Definir ports `LancamentoQueryPort`, `CategoriaQueryPort`, `ReservaQueryPort` no domínio. *(T1)*
- [x] T3 — Adapters de infra implementando os ports sobre os repositórios reais de P1/P2/P4 (ACL). *(T2)*
- [x] T4 — `ObterConsolidadoUseCase` (linhas por competência + totais + sobras). *(T2)*
- [x] T5 — `ObterGastoPorCategoriaUseCase` (agregação + percentual). *(T2)*
- [x] T6 — `ObterEvolucaoUseCase` (receitas/despesas/saldo por mês). *(T2)*
- [x] T7 — `CompararMesesUseCase` (gastoA/gastoB/variação/variacaoPct por categoria). *(T2)*
- [x] T8 — Serviço de exportação PDF/XLSX a partir do `ConsolidadoDTO`. *(T4)*
- [x] T9 — `RelatoriosModule` + controller (rotas seção 5), injetando adapters. *(T3,T4,T5,T6,T7,T8)*

**Frontend**
- [x] T10 — Cliente de API de relatórios. *(T9)*
- [x] T11 — Tela de histórico: tabela consolidada por mês + linha de totais + seletor de ano/intervalo. *(T10)*
- [x] T12 — Tela de relatórios: gráfico de gasto por categoria + evolução mensal. *(T10)*
- [x] T13 — Comparação entre dois meses (seleção A/B + tabela de variação). *(T10)*
- [x] T14 — Botão de exportar (PDF/XLSX) acionando o endpoint e baixando o arquivo. *(T11,T12)*

**Testes**
- [x] T15 — Unitários de agregação (sobras, percentual, variação, meses vazios). *(T4,T5,T6,T7)*
- [x] T16 — e2e do consolidado cruzando P1+P2+P4 e da exportação. *(T9)*

## 11. Decisões e premissas

- **D1** — `relatorios` é um módulo **read-model**: sem entidades persistidas, consome P1/P2/P4 via ports
  (Anti-Corruption Layer) para não acoplar a esquemas alheios.
- **D2** — Poupança/viagem na fórmula de sobras são identificadas por **nome do balde** (P4 não modela
  categoria de balde); regra configurável, default por substring case-insensitive.
- **D3** — Consolidação é **derivada** a cada consulta (sem materialização) — coerência com P1 (saldo derivado).
- **D4** — Gráfico por categoria mostra apenas categorias com gasto > 0 no período (evita ruído visual).
- **D5** — Exportação gerada **localmente** (biblioteca de PDF/planilha no backend), sem serviço externo —
  coerente com app local.
