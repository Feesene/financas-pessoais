# Feature Spec — Orçamento Mensal (P1)

- **Projeto:** financas-pessoais
- **PRD:** [`_prd.md`](./_prd.md)
- **Slug:** orcamento-mensal
- **Status:** Proposto

## 1. Descrição técnica da solução

A feature estende o módulo de domínio **`lancamentos`** (já existente no backend, em DDD/Clean Architecture) e
adiciona a **UI de orçamento mensal** no frontend Next.js. O contrato de dados é compartilhado via
`@financas-pessoais/shared`.

No backend já existem: entidade `Lancamento` (com invariantes), interface `LancamentoRepository`
(token `LANCAMENTO_REPOSITORY`) com `TypeOrmLancamentoRepository`, casos de uso `CriarLancamentoUseCase` e
`ListarLancamentosUseCase`, e o `LancamentosController` com `POST /lancamentos` e
`GET /lancamentos?competencia=AAAA-MM`.

**Esta spec completa P1** adicionando:
1. Casos de uso **EditarLancamentoUseCase** e **ExcluirLancamentoUseCase** (+ métodos no repositório).
2. **Resumo mensal** (`ResumoMensalDTO`): totais de receita, despesa e saldo por competência — via novo caso
   de uso `ObterResumoMensalUseCase` e endpoint `GET /lancamentos/resumo`.
3. **Frontend**: página de orçamento mensal (desktop) com formulário de lançamento, listas agrupadas por
   tipo/categoria, cartões de totais e navegação entre meses.

A regra de dependência da Clean Architecture é mantida: domínio puro, aplicação orquestra, infraestrutura
implementa ports, presentation só faz borda HTTP.

## 2. Fluxo técnico

```
[Frontend /orcamento?competencia=2026-05]
   │
   ├─ GET /lancamentos?competencia=2026-05      → lista de LancamentoDTO
   ├─ GET /lancamentos/resumo?competencia=...   → ResumoMensalDTO {totalReceitas,totalDespesas,saldo}
   │
   ├─ POST /lancamentos        (criar)   → controller → CriarLancamentoUseCase → repo.save
   ├─ PUT  /lancamentos/:id    (editar)  → controller → EditarLancamentoUseCase → repo.findById/save
   └─ DELETE /lancamentos/:id  (excluir) → controller → ExcluirLancamentoUseCase → repo.delete

Recalculo do resumo: o frontend reconsulta GET /lancamentos/resumo após cada mutação
(ou recomputa localmente a partir da lista já carregada — ver Decisão D3).
```

## 3. Entidades de domínio

### Lancamento (já existente — sem mudança estrutural)

| Atributo | Tipo | Regras |
|----------|------|--------|
| `id` | `string` (uuid) | gerado na criação |
| `tipo` | `'RECEITA' \| 'DESPESA'` | obrigatório |
| `categoria` | `string` | não vazio, trim, ≤ 80 chars |
| `descricao` | `string \| null` | opcional, ≤ 255 chars |
| `valor` | `number` | > 0; persistido `numeric(12,2)` |
| `competencia` | `string` | formato `AAAA-MM` (regex) |

Método de domínio: `valorComSinal` (positivo p/ receita, negativo p/ despesa). **Novo**: método
`atualizar(props)` na entidade para edição, reaplicando as invariantes via factory.

### ResumoMensal (DTO de leitura, não persistido)

| Atributo | Tipo | Cálculo |
|----------|------|---------|
| `competencia` | `string` | eco do parâmetro |
| `totalReceitas` | `number` | Σ valor onde tipo=RECEITA |
| `totalDespesas` | `number` | Σ valor onde tipo=DESPESA |
| `saldo` | `number` | `totalReceitas - totalDespesas` |

**Persistência:** tabela `lancamentos` (TypeORM `LancamentoSchema`). Índice recomendado em `competencia` para
acelerar listagem e agregação.

## 4. Tipos compartilhados (`@financas-pessoais/shared`)

```ts
export interface ResumoMensalDTO {
  competencia: string;
  totalReceitas: number;
  totalDespesas: number;
  saldo: number;
}

export interface AtualizarLancamentoDTO {
  tipo: TipoLancamento;
  categoria: string;
  descricao?: string | null;
  valor: number;
  competencia: string;
}
```

`LancamentoDTO` e `TipoLancamento` já existem.

## 5. Contratos de API

### POST /lancamentos *(existente)*
- **Request**: `{ tipo, categoria, descricao?, valor, competencia }`
- **201**: `LancamentoDTO`
- **400**: validação (`valor<=0`, `categoria` vazia, `competencia` fora do formato)

### GET /lancamentos?competencia=AAAA-MM *(existente)*
- **200**: `LancamentoDTO[]`
- **400**: `competencia` ausente/ inválida

### GET /lancamentos/resumo?competencia=AAAA-MM *(novo)*
- **200**: `ResumoMensalDTO`
- **400**: `competencia` ausente/ inválida
- Para mês sem lançamentos: retorna zeros (`totalReceitas:0, totalDespesas:0, saldo:0`).

### PUT /lancamentos/:id *(novo)*
- **Request**: `AtualizarLancamentoDTO`
- **200**: `LancamentoDTO` atualizado
- **400**: corpo inválido
- **404**: `id` inexistente

### DELETE /lancamentos/:id *(novo)*
- **204**: sem corpo
- **404**: `id` inexistente

## 6. Requisitos funcionais

- **RF-001** — O backend **DEVE** expor `PUT /lancamentos/:id` que atualiza um lançamento existente,
  revalidando as invariantes de domínio.
- **RF-002** — O backend **DEVE** expor `DELETE /lancamentos/:id` que remove um lançamento e responde 404 se
  não existir.
- **RF-003** — O backend **DEVE** expor `GET /lancamentos/resumo?competencia=` retornando totais de receita,
  despesa e saldo da competência.
- **RF-004** — O repositório **DEVE** ganhar `findById(id)`, `delete(id)` e o suporte à agregação por
  competência (via query ou redução da lista).
- **RF-005** — O frontend **DEVE** renderizar a página de orçamento de uma competência com: formulário de
  novo lançamento, listas agrupadas por tipo e categoria, e três cartões (receitas, despesas, saldo).
- **RF-006** — O frontend **DEVE** permitir navegar para mês anterior/seguinte e selecionar mês/ano,
  atualizando dados e URL (`?competencia=`).
- **RF-007** — O frontend **DEVERIA** formatar valores em R$ (pt-BR) e destacar saldo negativo.
- **RF-008** — O frontend **DEVERIA** exibir estado vazio quando a competência não tem lançamentos.
- **RF-009** — O sistema **PODE** sugerir categorias a partir de uma lista padrão (seed estático no frontend).

## 7. Requisitos não-funcionais

- **Performance**: listagem e resumo de um mês em < 300 ms localmente; índice em `competencia`.
- **Segurança**: validação estrita de entrada (`class-validator`, `whitelist:true`); sem auth no MVP (uso
  local). Não expor stack trace em erros 4xx.
- **Observabilidade**: log de erro no backend para 5xx; mensagens de erro 4xx legíveis no frontend.
- **Consistência**: valores sempre 2 casas decimais; somatórios feitos em `number` com arredondamento a 2
  casas na borda.

## 8. Edge cases técnicos

1. **Mês vazio** — `GET /resumo` retorna zeros; a UI mostra estado vazio em vez de erro.
2. **Editar para valor inválido** (≤0) — `PUT` retorna 400 e o lançamento permanece inalterado (sem
   atualização parcial).
3. **Excluir id inexistente** — `DELETE` retorna 404; UI exibe aviso e recarrega a lista.
4. **Competência malformada** (`2026-13`, `2026/05`) — 400 em todos os endpoints; regex barra antes do banco.
5. **Concorrência de mutação** — duas edições simultâneas: o último `save` vence (last-write-wins). Após
   qualquer mutação, a UI **reconsulta** lista+resumo para refletir o estado real do servidor.
6. **Arredondamento** — soma de muitos lançamentos não pode acumular erro de ponto flutuante além de 0,005;
   normalizar com `toFixed(2)`/inteiros de centavos na agregação. **(ver Decisão D2)**

## 9. Estratégia de testes

- **Domínio (unitário)**: `Lancamento.criar`/`atualizar` — valor ≤ 0, categoria vazia, competência inválida,
  `valorComSinal`.
- **Aplicação (unitário com repo fake)**: editar inexistente → erro; excluir → chama `delete`; resumo soma
  corretamente.
- **Integração (e2e backend)**: ciclo criar→listar→editar→resumo→excluir numa competência; 404 e 400.
- **Frontend**: render dos totais a partir de uma lista mock; navegação de mês altera a query; estado vazio.

## 10. Breakdown de tarefas

> Cada item cabe em um PR. Dependências indicadas em *(depende de …)*.

**Shared**
- [x] T1 — Adicionar `ResumoMensalDTO` e `AtualizarLancamentoDTO` em `shared/src/types/index.ts`.

**Backend — domínio/repositório**
- [x] T2 — Adicionar método `atualizar(props)` à entidade `Lancamento` reaplicando invariantes. *(depende de T1)*
- [x] T3 — Estender `LancamentoRepository` com `findById(id)` e `delete(id)`; implementar em
  `TypeOrmLancamentoRepository`. Adicionar índice em `competencia` no `LancamentoSchema`.

**Backend — casos de uso**
- [x] T4 — `EditarLancamentoUseCase` (find → atualizar → save; erro se não encontrado). *(depende de T2, T3)*
- [x] T5 — `ExcluirLancamentoUseCase` (delete; erro 404 se não encontrado). *(depende de T3)*
- [x] T6 — `ObterResumoMensalUseCase` retornando `ResumoMensalDTO` a partir dos lançamentos da competência.
  *(depende de T1, T3)*

**Backend — presentation**
- [x] T7 — Adicionar `PUT /lancamentos/:id` (+ `AtualizarLancamentoRequest`) e `DELETE /lancamentos/:id` ao
  controller; registrar use cases no `LancamentosModule`. *(depende de T4, T5)*
- [x] T8 — Adicionar `GET /lancamentos/resumo` ao controller. *(depende de T6)*

**Frontend**
- [x] T9 — Cliente de API (`lib/api/lancamentos.ts`): create/list/update/delete/resumo, lendo
  `NEXT_PUBLIC_API_URL`. *(depende de T7, T8)*
- [x] T10 — Util de formatação R$ (pt-BR) e helpers de competência (mês anterior/seguinte, label). 
- [x] T11 — Página `app/orcamento/page.tsx` com leitura de `?competencia=` e fetch de lista + resumo.
  *(depende de T9, T10)*
- [x] T12 — Componentes: cartões de totais, formulário de novo lançamento, lista agrupada por tipo/categoria.
  *(depende de T11)*
- [x] T13 — Edição e exclusão inline de lançamento na lista, com reconsulta de lista+resumo após mutação.
  *(depende de T12)*
- [x] T14 — Navegação entre meses (botões e seletor mês/ano) sincronizada com a URL. *(depende de T11)*
- [x] T15 — Estado vazio e destaque de saldo negativo. *(depende de T12)*

**Testes**
- [x] T16 — Testes unitários de domínio e dos casos de uso (editar/excluir/resumo). *(depende de T4, T5, T6)*
- [x] T17 — Teste e2e do ciclo de vida do lançamento + resumo numa competência. *(depende de T7, T8)*

## 11. Decisões e premissas

- **D1** — `categoria` permanece atributo de texto em P1; cadastro/gestão de categorias e metas é P2.
- **D2** — Agregação de totais feita na aplicação a partir da lista da competência (volume baixo, single-user).
  Se o volume crescer, migrar para `SUM` no banco. Arredondamento normalizado a 2 casas.
- **D3** — Após cada mutação, o frontend **reconsulta** lista+resumo (fonte de verdade no servidor) em vez de
  recomputar só localmente — evita divergência. Recompute local é apenas otimização opcional.
- **D4** — Edição usa `PUT` (substituição completa do recurso) com `AtualizarLancamentoDTO`; sem PATCH parcial
  no MVP.
- **D5** — Sem soft-delete: `DELETE` remove a linha. Histórico/auditoria não é requisito do MVP.
- **D6** — `competencia` é o mês de referência; sem data exata do lançamento em P1 (premissa do PRD).
