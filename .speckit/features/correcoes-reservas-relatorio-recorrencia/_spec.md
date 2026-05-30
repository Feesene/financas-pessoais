# Feature Spec — Correções: Reservas, Relatório, Recorrências e Pagamento

| Campo | Valor |
|---|---|
| Slug | `correcoes-reservas-relatorio-recorrencia` |
| Data | 2026-05-30 |
| Autor | Felipe |
| PRD relacionado | — (não há PRD; spec derivada de lista de correções) |
| Status | Pronta para execução |

---

## 1. Visão geral e objetivo

Este documento técnico detalha cinco correções/melhorias independentes no app de finanças pessoais (monorepo `backend` NestJS + `frontend` Next.js + `shared`). São itens de UX e de dados que não compartilham um tema único, mas foram agrupados por serem de baixo a médio esforço e tocarem nas mesmas três áreas: Reservas (P4), Relatórios (P5) e Recorrências (P3).

As correções são:

1. **Modal de recorrência sem scroll** — o formulário de recorrência/parcelamento ultrapassa a altura da viewport em telas baixas e fica com conteúdo inacessível.
2. **Visualizar e excluir movimentos de cada reserva** — não existe tela para ver os aportes/retiradas de um balde com a data real em que foram lançados, nem excluir um movimento errado a partir dessa visão.
3. **Listar movimentos do mês na página de Reservas** — a página de Reservas mostra apenas saldos por balde; falta uma lista dos movimentos (aportes e retiradas) da competência ativa.
4. **Entender e explicar o relatório** — documentar a função e o objetivo do relatório consolidado e os critérios que definem líquido, gastos, poupança, viagem e sobras; e surfacear essa explicação na própria tela via legenda/ajuda.
5. **Pagamento rola a tela para o topo** — ao registrar um pagamento no Orçamento, a página recarrega exibindo o skeleton e a rolagem volta ao topo; o esperado é permanecer na posição atual.

### Objetivo do relatório (resultado do item 4 — entendimento)

O relatório consolidado (aba "Histórico" em `Relatórios`) responde, mês a mês dentro de um ano, **para onde foi o dinheiro**. Cada linha é uma competência (`AAAA-MM`) com cinco grandezas, calculadas em centavos para evitar erro de ponto flutuante (`backend/src/modules/relatorios/application/use-cases/obter-consolidado.use-case.ts`):

- **Líquido recebido** = soma do `valor` de todos os lançamentos do tipo `RECEITA` na competência. Usa o valor previsto do lançamento (não o `valorPago`). Fonte: `LancamentoQueryAdapter.somarPorTipoECompetencia`.
- **Gastos** = soma do `valor` de todos os lançamentos do tipo `DESPESA` na competência (também valor previsto).
- **Poupança** = soma dos **aportes** (`tipo === 'APORTE'`) em baldes classificados como `POUPANCA`. A classificação é **por nome do balde**: nome normalizado (sem acento, minúsculo) contendo `"poupanc"`. Fonte: `classificarBalde` em `backend/src/modules/relatorios/domain/classificacao-balde.ts` + `ReservaQueryAdapter.somarAportesPorBaldeCategoria`.
- **Viagem** = soma dos aportes em baldes cujo nome normalizado contém `"viagem"`.
- **Sobras** = `líquido recebido − gastos − poupança − viagem` (o que não foi gasto nem reservado).

Pontos relevantes do comportamento atual, a documentar na legenda:
- Apenas **aportes** contam para poupança/viagem; **retiradas** são ignoradas no relatório.
- Baldes cujo nome não contém `"poupanc"` nem `"viagem"` **não entram** em nenhuma coluna (nem poupança, nem viagem), mas o aporte também **não** aparece como "sobra revertida" — simplesmente fica fora do consolidado de reservas.
- O relatório usa **valor previsto** dos lançamentos, independentemente de o lançamento estar marcado como pago.
- Meses sem dados aparecem zerados (série contínua de Jan a Dez).

Esta spec **mantém** a regra de classificação por nome (decisão D-02) e adiciona uma legenda explicativa na UI, sem alterar o cálculo.

---

## 2. Escopo

**Dentro do escopo:**
- Ajuste de CSS do `DialogContent` para permitir rolagem interna.
- Novo endpoint de listagem de movimentos por balde e por competência.
- Campo `criadoEm` (timestamp) no movimento de reserva, com migração.
- Diálogo de histórico de movimentos por balde com exclusão.
- Seção de movimentos do mês na página de Reservas.
- Legenda/ajuda explicativa no relatório.
- Refresh "silencioso" no Orçamento para preservar a rolagem ao registrar pagamento.

**Fora do escopo:**
- Tornar a classificação poupança/viagem explícita por balde (decisão D-02: mantém heurística por nome).
- Edição de movimentos a partir da nova tela (apenas visualização e exclusão; edição continua só via API/PUT existente).
- Alteração da fórmula do consolidado (líquido/gastos/sobras).

---

## 3. Correções em detalhe

### 3.1 Modal de recorrência sem scroll

**Diagnóstico.** `frontend/src/components/ui/dialog.tsx` (linha 34-41) define o `DialogContent` com posição fixa centralizada (`top-[50%] translate-y-[-50%]`) e **sem** `max-height` nem `overflow`. O formulário de recorrência (`RecorrenciaFormDialog.tsx`) tem muitos campos (modo, tipo, categoria, descrição, valor, parcelas, competências), e em telas de altura reduzida o conteúdo transborda a viewport, ficando inacessível porque o diálogo não rola.

**Correção.** Adicionar ao `cn(...)` do `DialogContent` as classes `max-h-[calc(100vh-2rem)] overflow-y-auto`. Como é o componente base compartilhado, a correção beneficia **todos** os diálogos do app (movimento, balde, lançamento, pagamento, etc.). Manter o botão de fechar (`X`) como está; com `overflow-y-auto` ele rola junto, o que é aceitável.

**Arquivos:** `frontend/src/components/ui/dialog.tsx`.

### 3.2 Visualizar e excluir movimentos de cada reserva

**Diagnóstico.** Hoje só existe `GET /baldes/:id/evolucao`, que retorna saldo acumulado por competência (`EvolucaoBaldeDTO`), não a lista de movimentos individuais. O `MovimentoReservaDTO` não tem data real de registro — só `competencia` (mês). A exclusão de movimento já existe (`DELETE /movimentos/:id` + `reservasApi.excluirMovimento`), mas não há UI que a exponha.

**Correção (backend):**
1. Adicionar coluna `criadoEm` (timestamp) ao `MovimentoReservaSchema` + `MovimentoReservaProps`/entidade + mapper. Decisão D-01: registrar a data/hora real de criação.
2. Migração TypeORM para criar a coluna; linhas existentes recebem backfill com `CURRENT_TIMESTAMP` no momento da migração (D-03).
3. Novo endpoint `GET /baldes/:id/movimentos` → retorna `MovimentoReservaDTO[]` ordenados por `criadoEm DESC` (mais recentes primeiro). Use-case `ListarMovimentosBaldeUseCase` apoiado em `MovimentoReservaRepository.findByBaldeId` (já existe; ajustar ordenação ou ordenar no use-case).

**Correção (frontend):**
4. Novo `MovimentosBaldeDialog.tsx`: ao abrir, busca `reservasApi.listarMovimentosBalde(baldeId)`, lista cada movimento (tipo, valor, competência, **data real `criadoEm` formatada**, descrição) com botão de excluir protegido por `AlertDialog`. Após exclusão chama `onAlterado` para recarregar saldos.
5. Adicionar gatilho no `BaldeCard.tsx` (ícone de lista/histórico) ao lado do botão de evolução.

**Arquivos:** `shared/src/types/index.ts` (campo `criadoEm` em `MovimentoReservaDTO`), `backend` (schema, entidade, mapper, repo, use-case, controller, migração), `frontend` (`reservas.ts` API, `MovimentosBaldeDialog.tsx`, `BaldeCard.tsx`).

### 3.3 Listar movimentos do mês na página de Reservas

**Diagnóstico.** `ReservasView.tsx` exibe o total reservado e os cards de balde, mas nada sobre os movimentos da competência ativa. O item pede "listar os aportes do mês"; decisão D-04: listar **aportes e retiradas** da competência.

**Correção (backend):** Novo endpoint `GET /reservas/movimentos?competencia=AAAA-MM` → `MovimentoReservaDTO[]` (com nome do balde para exibição) da competência informada, ordenado por `criadoEm DESC`. Implementar via novo método de repositório `findByCompetencia(competencia)` (filtra `movimentos_reserva.competencia`) + use-case `ListarMovimentosCompetenciaUseCase`. Para exibir o nome do balde, o DTO de retorno desta lista é um `MovimentoReservaComBaldeDTO` (estende `MovimentoReservaDTO` com `baldeNome: string`).

**Correção (frontend):** Em `ReservasView.tsx`, após os cards, renderizar uma seção "Movimentos de {mês}" que carrega `reservasApi.movimentosDoMes(competencia)` junto com os saldos (mesmo `useCallback carregar`). Estado vazio: "Nenhum movimento neste mês.". Cada linha mostra tipo (aporte +/retirada −), balde, valor, data e descrição.

**Arquivos:** `shared` (novo DTO), `backend` (repo, use-case, controller `reservas`), `frontend` (`reservas.ts`, `ReservasView.tsx`, possivelmente um `MovimentosMesLista.tsx`).

### 3.4 Legenda/ajuda no relatório

**Diagnóstico.** O significado das colunas (líquido, gastos, poupança, viagem, sobras) e o critério de classificação por nome não estão visíveis na UI; só no código. Decisão D-02: manter a regra atual e explicá-la na tela.

**Correção (frontend, só UI):** Em `RelatoriosView.tsx` (ou na `HistoricoTabela.tsx`), adicionar um bloco de legenda/ajuda (ex.: ícone de informação com `title`/tooltip ou um `<details>` recolhível) com o texto definido na seção 1 ("Objetivo do relatório"), incluindo a observação de que poupança/viagem são definidas pelo **nome** do balde conter `"poupança"`/`"viagem"` e que retiradas não entram. Nenhuma mudança de backend ou de cálculo.

**Arquivos:** `frontend/src/components/relatorios/RelatoriosView.tsx` e/ou `HistoricoTabela.tsx`.

### 3.5 Pagamento rola a tela para o topo

**Diagnóstico.** Em `OrcamentoView.tsx`, `carregar()` faz `setStatus('loading')` no início. Ao registrar/desmarcar pagamento (`PagamentoDialog`/`LancamentoItem` → `onAlterado` → `carregar`), a árvore `status === 'ready'` é desmontada e o `OrcamentoSkeleton` (mais curto) é renderizado; a página encolhe e o scroll do navegador volta ao topo. Quando os dados retornam, a lista remonta mas a posição de rolagem foi perdida.

**Correção (frontend):** Separar a **carga inicial** (com skeleton) de um **refresh silencioso** (sem trocar para `loading`). Introduzir `recarregarSilencioso()` que atualiza `lancamentos`/`resumo`/`consumo` sem `setStatus('loading')`, e usar essa função no `onSalvo`/`onAlterado` dos itens já carregados. Como a lista permanece montada com a mesma altura durante o refetch, a rolagem é preservada. A carga inicial (mudança de competência, primeiro load, retry de erro) continua usando `carregar()` com skeleton.

**Arquivos:** `frontend/src/components/orcamento/OrcamentoView.tsx` (e o callback passado a `ListaLancamentos`).

---

## 4. Entidades de domínio afetadas

### MovimentoReserva (alteração)

| Atributo | Tipo | Observação |
|---|---|---|
| id | `string` | PK, inalterado |
| baldeId | `string` | inalterado |
| tipo | `'APORTE' \| 'RETIRADA'` | inalterado |
| valor | `number` (reais, > 0) | inalterado |
| competencia | `string` (`AAAA-MM`) | inalterado |
| descricao | `string \| null` | inalterado |
| **criadoEm** | **`string` (ISO 8601, novo)** | **timestamp de criação; gerado no `criar()`/persistência; imutável** |

`criadoEm` é definido no momento da criação (não fornecido pelo cliente) e **não** muda em `atualizar()`. O `atualizar()` preserva `criadoEm` junto com `id` e `baldeId`.

### DTOs compartilhados (`shared/src/types/index.ts`)

- `MovimentoReservaDTO`: adicionar `criadoEm: string` (ISO 8601).
- Novo `MovimentoReservaComBaldeDTO extends MovimentoReservaDTO { baldeNome: string }` para a lista do mês.

---

## 5. Contratos de API

### 5.1 `GET /baldes/:id/movimentos`

- **Request:** path param `id` (UUID do balde). Sem query.
- **Response 200:** `MovimentoReservaDTO[]` ordenado por `criadoEm DESC`.
```json
[
  { "id": "uuid", "baldeId": "uuid", "tipo": "APORTE", "valor": 500.0,
    "competencia": "2026-05", "descricao": "aporte mensal", "criadoEm": "2026-05-12T14:03:00.000Z" }
]
```
- **Erros:** `404` se o balde não existir (`BaldeNaoEncontradoError`). `400` para id inválido conforme tratamento existente.

### 5.2 `GET /reservas/movimentos?competencia=AAAA-MM`

- **Request:** query `competencia` (obrigatória, formato `AAAA-MM`).
- **Response 200:** `MovimentoReservaComBaldeDTO[]` (aportes e retiradas) da competência, ordenado por `criadoEm DESC`.
```json
[
  { "id": "uuid", "baldeId": "uuid", "baldeNome": "Viagem Europa", "tipo": "RETIRADA",
    "valor": 200.0, "competencia": "2026-05", "descricao": null, "criadoEm": "2026-05-20T09:10:00.000Z" }
]
```
- **Erros:** `400` se `competencia` ausente ou fora do formato `AAAA-MM` (validação no `*.request.ts` à la `SaldosQueryRequest`). Lista vazia (`[]`) com `200` quando não há movimentos.

### 5.3 `DELETE /movimentos/:id` (já existente — reutilizado)

- **Response 204** sem corpo. **404** se o movimento não existir. Usado pelo novo diálogo de histórico (3.2).

### 5.4 Endpoints inalterados

`GET /reservas/saldos`, `GET /baldes/:id/evolucao`, `GET /relatorios/...`, `POST /baldes/:id/movimentos`, `PUT /movimentos/:id` permanecem como estão. O `POST` de movimento passa a gravar `criadoEm` internamente (sem mudança de contrato de request).

---

## 6. Edge cases técnicos

| # | Cenário | Comportamento esperado |
|---|---|---|
| EC-1 | Listar movimentos de um balde **sem nenhum movimento** | `200` com `[]`; UI mostra estado vazio "Sem movimentos registrados." |
| EC-2 | Excluir um movimento que **outro fluxo já removeu** (concorrência) | `DELETE` retorna `404`; UI trata como aviso ("Este movimento já não existe."), recarrega lista e saldos, sem erro fatal. |
| EC-3 | `GET /reservas/movimentos` **sem** `competencia` ou com formato inválido (`2026/5`) | `400 Bad Request` (validação no DTO de query), sem atingir o use-case. |
| EC-4 | Linhas de movimento **anteriores à migração** (sem `criadoEm`) | Backfill na migração define `criadoEm = CURRENT_TIMESTAMP`; nenhuma linha fica com `criadoEm` nulo. UI sempre tem data para exibir. |
| EC-5 | Registrar pagamento e, **enquanto o refetch silencioso roda**, o usuário rola/age | A lista permanece montada (sem skeleton); a rolagem é preservada e a UI não "pula". Se o refetch falhar, manter os dados atuais e exibir `toast` de erro, sem derrubar a tela para o estado de erro. |
| EC-6 | Diálogo de recorrência em viewport muito baixa (ex.: 500px de altura) | `DialogContent` rola internamente (`overflow-y-auto`, `max-h-[calc(100vh-2rem)]`); todos os campos e o rodapé ficam acessíveis. |
| EC-7 | Excluir o **último** movimento de um balde a partir do histórico | Exclusão `204`; saldo recarregado reflete o balde "zerado"; balde volta a poder ser excluído (não há mais `existsByBaldeId`). |

---

## 7. Requisitos funcionais

- **RF-001 — O sistema DEVE** permitir que o conteúdo de qualquer diálogo (`DialogContent`) role internamente quando exceder a altura da viewport, mantendo cabeçalho, campos e rodapé acessíveis.
- **RF-002 — O sistema DEVE** persistir, para cada movimento de reserva, a data/hora real de criação (`criadoEm`), gerada no servidor e imutável em edições.
- **RF-003 — O sistema DEVE** expor `GET /baldes/:id/movimentos` retornando todos os movimentos do balde ordenados do mais recente para o mais antigo, incluindo `criadoEm`.
- **RF-004 — O sistema DEVE** oferecer, na página de Reservas, um diálogo por balde que liste seus movimentos (tipo, valor, competência, data real e descrição) e **DEVE** permitir excluir um movimento individual a partir desse diálogo, com confirmação.
- **RF-005 — O sistema DEVE** expor `GET /reservas/movimentos?competencia=AAAA-MM` retornando os movimentos (aportes e retiradas) da competência com o nome do balde, e a página de Reservas **DEVE** exibir essa lista para a competência ativa.
- **RF-006 — O sistema DEVE** exibir na tela de Relatórios uma legenda explicando o objetivo do relatório e os critérios de líquido, gastos, poupança, viagem e sobras, incluindo que poupança/viagem são definidas pelo nome do balde e que retiradas não entram no consolidado.
- **RF-007 — O sistema DEVE**, ao registrar ou desmarcar um pagamento no Orçamento, atualizar os dados sem reexibir o skeleton de carga, preservando a posição de rolagem.
- **RF-008 — O sistema DEVERIA** tratar a exclusão concorrente de movimento (`404`) como aviso não-fatal, recarregando a lista.

---

## 8. Requisitos não-funcionais

- **Performance:** as novas listagens reutilizam consultas indexadas. `findByCompetencia` deve usar índice existente `idx_movimentos_balde_competencia` (ou adicionar índice em `competencia` se o plano de consulta não o aproveitar). Volume esperado é pequeno (uso pessoal).
- **Segurança / validação:** a competência da query é validada por DTO (regex `AAAA-MM`) antes de chegar ao domínio, evitando consultas malformadas. IDs continuam validados pelos use-cases existentes.
- **Consistência de dados:** cálculo de saldos/relatório permanece em centavos; `criadoEm` não participa de nenhum cálculo financeiro, só de exibição/ordenação.
- **Observabilidade:** manter o padrão atual de erros mapeados (`mapErroReservas`); nenhuma exigência nova de logging.
- **Compatibilidade:** a adição de `criadoEm` ao `MovimentoReservaDTO` é aditiva; consumidores existentes do DTO não quebram.

---

## 9. Decisões e premissas

- **D-01:** "Data que foi lançado" = **data real de registro**. Adicionamos `criadoEm` (timestamp) em vez de usar só a competência. (Confirmado pelo usuário.)
- **D-02:** A classificação poupança/viagem **permanece por nome do balde** (heurística `classificarBalde`); não criamos campo explícito. A spec apenas adiciona legenda na UI. (Confirmado pelo usuário.)
- **D-03:** Linhas de movimento pré-existentes recebem `criadoEm = CURRENT_TIMESTAMP` no momento da migração (não temos data histórica real; é o melhor proxy). Coluna criada como `NOT NULL` após o backfill.
- **D-04:** A lista de movimentos do mês na página de Reservas inclui **aportes e retiradas**. (Confirmado pelo usuário.)
- **D-05 (premissa):** O ajuste de scroll é feito no componente base `DialogContent`, beneficiando todos os diálogos; assume-se que esse comportamento global é desejável (nenhum diálogo depende de não rolar).
- **D-06 (premissa):** O refresh silencioso do Orçamento mantém os dados antigos visíveis durante o refetch; em caso de falha do refetch, mostra `toast` e mantém o estado anterior em vez de cair para a tela de erro.
- **D-07 (premissa):** A edição de movimento a partir da nova tela fica fora do escopo; o `PUT /movimentos/:id` existente não é exposto na UI nesta entrega.

---

## 10. Breakdown de tarefas

> Cada tarefa cabe em 1 PR. Dependências indicadas inline.

**Bloco A — Dados e backend de movimentos (base para 3.2 e 3.3)**

- [x] **A1.** Adicionar `criadoEm` ao domínio: `MovimentoReservaProps`/entidade (`movimento-reserva.ts`) gerando o timestamp no `criar()` e preservando-o em `atualizar()`. Atualizar testes da entidade. *(sem dependências)*
- [x] **A2.** Adicionar coluna `criadoEm` ao `MovimentoReservaSchema` e ao `MovimentoReservaMapper` (toDomain/toPersistence). *(depende de A1)*
- [x] **A3.** Criar migração TypeORM: adicionar coluna `criadoEm` com backfill `CURRENT_TIMESTAMP` e tornar `NOT NULL`. *(depende de A2)*
- [x] **A4.** Adicionar `criadoEm: string` a `MovimentoReservaDTO` e criar `MovimentoReservaComBaldeDTO` em `shared/src/types/index.ts`; rebuild do `shared`. *(depende de A1)*

**Bloco B — Endpoints de listagem**

- [x] **B1.** `GET /baldes/:id/movimentos`: use-case `ListarMovimentosBaldeUseCase` (ordena `findByBaldeId` por `criadoEm DESC`) + método no `BaldesController` + registro no módulo. *(depende de A2, A4)*
- [x] **B2.** `GET /reservas/movimentos?competencia=`: método `findByCompetencia` no repositório (+ porta), DTO de query com validação `AAAA-MM`, use-case `ListarMovimentosCompetenciaUseCase` (faz join com nome do balde → `MovimentoReservaComBaldeDTO`), método no `ReservasController`. *(depende de A2, A4)*

**Bloco C — Frontend Reservas**

- [x] **C1.** Estender `reservas.ts`: `listarMovimentosBalde(id)` e `movimentosDoMes(competencia)`. *(depende de B1, B2, A4)*
- [x] **C2.** `MovimentosBaldeDialog.tsx`: lista movimentos do balde com data real e exclusão (`AlertDialog` + `reservasApi.excluirMovimento`), tratando `404` como aviso; gatilho adicionado em `BaldeCard.tsx`. *(depende de C1)*
- [x] **C3.** Seção "Movimentos do mês" em `ReservasView.tsx` (carrega junto com saldos; estado vazio; aportes e retiradas com nome do balde). *(depende de C1)*

**Bloco D — Ajustes de UI independentes (sem dependências entre si nem dos blocos acima)**

- [x] **D1.** Scroll do diálogo: adicionar `max-h-[calc(100vh-2rem)] overflow-y-auto` ao `DialogContent` em `dialog.tsx`. *(sem dependências)*
- [x] **D2.** Legenda do relatório: bloco explicativo (info/`<details>`) em `RelatoriosView.tsx`/`HistoricoTabela.tsx` com os critérios da seção 1. *(sem dependências)*
- [x] **D3.** Refresh silencioso no Orçamento: `recarregarSilencioso()` em `OrcamentoView.tsx` usado nos callbacks `onAlterado`/`onSalvo` dos itens já carregados, preservando a rolagem ao registrar pagamento. *(sem dependências)*
