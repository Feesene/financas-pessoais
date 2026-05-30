# Feature Spec — Histórico de preços por investimento (cotação mensal)

- **Projeto:** financas-pessoais
- **PRD:** _(não há; spec derivada de pedido de melhoria)_
- **Slug:** historico-precos-investimentos
- **Status:** Proposto
- **Depende de:** carteira-de-investimentos (P6)

## 1. Descrição técnica da solução

Hoje cada `Ativo` guarda apenas um **valor corrente** (`valorUnitario` para ação/FII; `valorBruto` para fundo) e os
`MovimentoCarteira` registram fluxo (entrada/saída/rendimento), mas **não há registro de como o preço/valor do ativo
evoluiu mês a mês**. O usuário quer, para cada ativo, selecionar uma competência e registrar o preço/valor daquele mês,
formando um histórico de cotações.

Introduzimos a entidade **`CotacaoAtivo`**: um *snapshot* por `(ativoId, competencia)` do preço/valor do ativo naquele
mês. Para ativos cotados (`ACAO`/`FII`) o snapshot guarda `valorUnitario`; para `FUNDO` guarda `valorBruto`. A posição
atual da carteira passa a refletir o **snapshot mais recente** de cada ativo (por competência), em vez do valor fixo no
próprio ativo — sem snapshots, mantém o comportamento atual (valores do `Ativo`). Cada ativo ganha um gráfico/tabela de
evolução do seu valor ao longo das competências.

O `valorUnitario`/`valorBruto` no próprio `Ativo` passam a representar o **valor mais recente conhecido** e são
atualizados (denormalização de leitura) sempre que se registra a cotação da competência mais recente, mantendo
retrocompatibilidade com a posição atual e o cálculo derivado de ação/FII (`quantidade × valorUnitario`).

## 2. Fluxo técnico

```
[Registrar cotação] → PUT /ativos/:id/cotacoes/:competencia
   ACAO/FII: { valorUnitario }   FUNDO: { valorBruto }
     → RegistrarCotacaoUseCase (upsert por (ativoId, competencia))
        valida tipo×campos (igual ao Ativo); 404 ativo
        persiste CotacaoAtivo
        se competencia >= maxCompetencia(ativo): atualiza Ativo (valorUnitario/valorBruto) — valor "atual"
[Listar cotações]   → GET /ativos/:id/cotacoes → CotacaoAtivoDTO[] ordenado por competência asc
[Evolução]          → GET /ativos/:id/evolucao → [{ competencia, valorUnitario|valorBruto, valorBrutoEfetivo }]
                       valorBrutoEfetivo: ACAO/FII = quantidade×valorUnitario do snapshot; FUNDO = valorBruto do snapshot
[Posição]           → ObterPosicaoCarteiraUseCase usa o snapshot mais recente de cada ativo (fallback: valor do Ativo)
[Excluir cotação]   → DELETE /ativos/:id/cotacoes/:competencia → 204; recalcula valor "atual" do Ativo
```

Cálculo do `valorBrutoEfetivo` de um snapshot (ação/FII): `quantidade` é a do ativo (quantidade não é versionada no
MVP — ver D4) × `valorUnitario` do snapshot.

## 3. Entidades de domínio

### CotacaoAtivo (nova)
| Atributo | Tipo | Regras |
|----------|------|--------|
| `id` | uuid | |
| `ativoId` | uuid | FK `Ativo` (cascade on delete) |
| `competencia` | `AAAA-MM` | obrigatório; único por ativo (`uq (ativoId, competencia)`) |
| `valorUnitario` | number\|null | obrigatório se ativo `ACAO`/`FII` (≥ 0), `numeric(12,2)`; `null` se `FUNDO` |
| `valorBruto` | number\|null | obrigatório se ativo `FUNDO` (≥ 0), `numeric(12,2)`; `null` se `ACAO`/`FII` |

Invariantes (espelham o `Ativo`): tipo do ativo determina qual campo é exigido; o outro deve ser `null`. Upsert por
`(ativoId, competencia)` (registrar a mesma competência sobrescreve o snapshot).

### Ativo (sem novos campos)
`valorUnitario`/`valorBruto` passam a ser **derivados de leitura** do snapshot mais recente quando houver cotações;
permanecem como estão quando não houver nenhuma (compatibilidade).

## 4. Tipos compartilhados

```ts
export interface CotacaoAtivoDTO {
  id: string;
  ativoId: string;
  competencia: string;          // AAAA-MM
  valorUnitario: number | null; // ACAO/FII
  valorBruto: number | null;    // FUNDO
}

export interface RegistrarCotacaoDTO {
  valorUnitario?: number | null; // ACAO/FII
  valorBruto?: number | null;    // FUNDO
}

/** Ponto da evolução do valor de um ativo por competência. */
export interface EvolucaoAtivoItemDTO {
  competencia: string;          // AAAA-MM
  valorUnitario: number | null; // ACAO/FII (preço do mês)
  valorBruto: number | null;    // FUNDO (valor do mês)
  /** Valor bruto efetivo do ativo no mês: ACAO/FII = quantidade×valorUnitario; FUNDO = valorBruto. */
  valorBrutoEfetivo: number;
}
```

## 5. Contratos de API

- **PUT /ativos/:id/cotacoes/:competencia**
  - Request (ACAO/FII): `{ "valorUnitario": 12.34 }`; (FUNDO): `{ "valorBruto": 1500.00 }`.
  - Response 200: `CotacaoAtivoDTO` (upsert — cria ou atualiza).
  - 400: campo incompatível com o tipo do ativo / valor negativo / mais de 2 casas / competência inválida.
  - 404: ativo inexistente.
- **GET /ativos/:id/cotacoes** → 200 `CotacaoAtivoDTO[]` (asc por competência); 404 ativo.
- **GET /ativos/:id/evolucao** → 200 `EvolucaoAtivoItemDTO[]` (asc por competência); 404 ativo.
- **DELETE /ativos/:id/cotacoes/:competencia** → 204; 404 (ativo ou cotação).
- **GET /carteira/posicao** — rota inalterada; `valorBruto` de cada ativo passa a refletir o snapshot mais recente
  (fallback: valor do `Ativo` quando sem cotações).

## 6. Requisitos funcionais

- **RF-001** — O backend **DEVE** registrar (upsert) a cotação de um ativo por competência, com snapshot
  `valorUnitario` (ação/FII) ou `valorBruto` (fundo).
- **RF-002** — O backend **DEVE** validar a coerência tipo×campo (ação/FII exigem `valorUnitario`; fundo exige `valorBruto`).
- **RF-003** — O backend **DEVE** expor o histórico de cotações de um ativo ordenado por competência.
- **RF-004** — O backend **DEVE** expor a evolução do valor do ativo (`valorBrutoEfetivo` por competência).
- **RF-005** — `ObterPosicaoCarteiraUseCase` **DEVE** usar o snapshot mais recente de cada ativo; sem snapshots, usa o
  valor atual do `Ativo`.
- **RF-006** — Registrar a cotação da competência mais recente **DEVE** atualizar o valor "atual" do `Ativo`
  (`valorUnitario`/`valorBruto`); excluir cotações **DEVE** recalcular esse valor.
- **RF-007** — O frontend **DEVE** permitir, em cada ativo, selecionar a competência e registrar o preço/valor do mês.
- **RF-008** — O frontend **DEVERIA** exibir um gráfico/tabela de evolução do valor de cada ativo por mês.
- **RF-009** — Excluir um ativo **DEVE** remover suas cotações em cascata.

## 7. Requisitos não-funcionais

- **Performance**: índice único `(ativoId, competencia)` e índice por `ativoId`; posição em < 300 ms mesmo lendo o
  snapshot mais recente por ativo (consulta de `MAX(competencia)` por ativo).
- **Integridade**: FK `cotacao_ativo.ativoId` com `ON DELETE CASCADE`; coerência tipo×campo garantida no domínio.
- **Precisão**: somas e valores em centavos inteiros (2 casas), padrão do módulo.
- **Compatibilidade**: ativos sem cotações funcionam como hoje (fonte de valor = `Ativo`).

## 8. Edge cases técnicos

1. **Registrar cotação com campo do tipo errado** (ex.: `valorUnitario` para FUNDO) → 400.
2. **Re-registrar a mesma competência** → upsert (sobrescreve o snapshot, sem duplicar).
3. **Registrar competência mais antiga que a atual** → grava snapshot, mas **não** altera o valor "atual" do `Ativo`.
4. **Excluir o snapshot mais recente** → o valor "atual" do `Ativo` recai no próximo snapshot mais recente (ou no valor
   pré-existente se não houver mais nenhum).
5. **Ativo sem nenhuma cotação** → posição e gráfico usam o valor atual do `Ativo` (estado vazio no histórico).
6. **`valorUnitario`/`valorBruto` negativo** → 400; `valorUnitario = 0` é permitido (ativo zerado), `quantidade` continua > 0.
7. **Competência fora do formato `AAAA-MM`** (path param) → 400.
8. **Concorrência**: dois upserts simultâneos na mesma `(ativoId, competencia)` → a constraint única + upsert evitam
   duplicidade (a última escrita vence).

## 9. Estratégia de testes

- Unit (domínio): invariantes de `CotacaoAtivo` por tipo; cálculo de `valorBrutoEfetivo`; seleção do snapshot mais recente.
- Unit (use cases): upsert idempotente; atualização/recalculo do valor "atual" do `Ativo`; posição usando snapshot.
- Integração (e2e): registrar/listar/excluir cotações; 400 por tipo×campo; 404; cascade ao excluir ativo; posição
  refletindo o último snapshot.
- Frontend: registrar cotação por competência; render do gráfico/tabela de evolução; estado vazio.

## 10. Breakdown de tarefas

**Shared**
- [x] T1 — Tipos `CotacaoAtivoDTO`, `RegistrarCotacaoDTO`, `EvolucaoAtivoItemDTO`. *(—)*

**Backend — domínio**
- [x] T2 — Entidade `CotacaoAtivo` (invariantes por tipo) + interface de repositório. *(T1)*

**Backend — infraestrutura**
- [x] T3 — Migration: tabela `cotacao_ativo` (`uq(ativoId,competencia)`, índice `ativoId`, FK cascade). *(T2)*
- [x] T4 — Schema/mapper/repo TypeORM de `CotacaoAtivo` (incl. `findByAtivo`, `findMaisRecentePorAtivo`, upsert). *(T3)*

**Backend — aplicação/apresentação**
- [x] T5 — `RegistrarCotacaoUseCase` (upsert + atualização do valor "atual" do `Ativo`). *(T4)*
- [x] T6 — `ListarCotacoesUseCase` e `ObterEvolucaoAtivoUseCase` (`valorBrutoEfetivo`). *(T4)*
- [x] T7 — `ExcluirCotacaoUseCase` (204 + recálculo do valor "atual"). *(T4)*
- [x] T8 — `ObterPosicaoCarteiraUseCase` passa a usar o snapshot mais recente por ativo (fallback `Ativo`). *(T4)*
- [x] T9 — Rotas no controller de ativos: `PUT/GET/DELETE .../cotacoes`, `GET .../evolucao` (seção 5). *(T5,T6,T7)*

**Frontend**
- [x] T10 — Cliente de API: `registrarCotacao`, `listarCotacoes`, `obterEvolucao`, `excluirCotacao`. *(T9)*
- [x] T11 — `AtivoCard`/diálogo: seletor de competência + form de cotação (campo conforme tipo). *(T10)*
- [x] T12 — Gráfico/tabela de evolução do valor por ativo + estado vazio. *(T10)*

**Testes**
- [ ] T13 — Unit de domínio/use cases (invariantes, upsert, snapshot recente, posição). *(T5,T8)*
- [ ] T14 — e2e (registrar/listar/excluir, 400/404, cascade, posição com snapshot). *(T9)*

## 11. Decisões e premissas

- **D1** — *(confirmado pelo usuário)* O histórico vale para **todos os tipos**: ação/FII guardam `valorUnitario` por mês;
  fundo guarda `valorBruto` por mês. A posição usa o **snapshot mais recente**.
- **D2** — Cotação é um **upsert por `(ativoId, competencia)`** (um snapshot por mês), idempotente.
- **D3** — O valor no `Ativo` vira **valor "mais recente conhecido"** (denormalização de leitura), atualizado ao
  registrar/excluir a cotação mais recente — mantém retrocompatibilidade da posição.
- **D4** — `quantidade` (ação/FII) **não é versionada** no MVP: a evolução varia só pelo preço unitário. Versionar
  quantidade (compras/vendas parciais) fica no backlog.
- **D5** — Sem cotação automática/integração de mercado: valores são **manuais** (coerente com a D2 do spec da carteira).
- **D6** — Cotações são removidas em **cascata** com o ativo (não bloqueiam a exclusão, diferente dos movimentos).
