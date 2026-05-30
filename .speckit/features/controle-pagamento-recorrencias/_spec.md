# Feature Spec — Controle de pagamento de recorrências

- **Projeto:** financas-pessoais
- **PRD:** _(não há; spec derivada de pedido de melhoria)_
- **Slug:** controle-pagamento-recorrencias
- **Status:** Proposto
- **Depende de:** recorrencias-e-parcelas (P3), orcamento-mensal (P1), categorias-e-metas (P2)

## 1. Descrição técnica da solução

Hoje a materialização de uma regra recorrente cria um `Lancamento` com o **valor previsto** (`regra.valorDaOcorrencia`),
mas não há como registrar se a ocorrência **já foi paga** nem **quanto foi efetivamente pago** (uma conta de luz
prevista em R$ 200 que veio R$ 237, por exemplo). A melhoria adiciona ao `Lancamento` dois campos opcionais —
`pago` (boolean) e `valorPago` (number|null) — **válidos apenas para lançamentos originados de regra recorrente**
(`origemRegraId !== null`). Lançamentos manuais permanecem sem esse controle.

O conceito de **valor efetivo** passa a reger as agregações financeiras: `valorEfetivo = pago && valorPago !== null
? valorPago : valor`. Enquanto a ocorrência não é marcada como paga, os totais usam o valor previsto; ao marcar como
paga com o valor real, o resumo mensal (`ObterResumoMensalUseCase`) e o consumo de metas
(`ObterConsumoCategoriasUseCase`) passam a refletir o valor realmente pago. Isso mantém o orçamento fiel ao que de
fato saiu/entrou no mês, sem perder a previsão.

A escrita é feita por um endpoint dedicado e idempotente (`PATCH /lancamentos/:id/pagamento`) que **não** substitui a
edição completa (`PUT`), evitando que a tela de "marcar como pago" precise reenviar o lançamento inteiro.

## 2. Fluxo técnico

```
[Marcar pago]   → PATCH /lancamentos/:id/pagamento { pago, valorPago? }
                    → RegistrarPagamentoUseCase
                        carrega Lancamento por id (404 se não existe)
                        rejeita se origemRegraId === null (400: só recorrências)
                        pago=true  → valorPago = body.valorPago ?? valor (default = previsto)
                        pago=false → valorPago = null (volta ao previsto)
                        persiste e retorna LancamentoDTO
[Resumo mês]    → ObterResumoMensalUseCase usa valorEfetivo por lançamento
[Consumo meta]  → ObterConsumoCategoriasUseCase soma gasto por valorEfetivo
[Lista/orçamento] front exibe checkbox "pago" + valor real ao lado do previsto (badge "pago R$ X")
```

`valorEfetivo` é derivado no domínio (`Lancamento.valorEfetivo`) e reutilizado por toda agregação, garantindo fonte única.

## 3. Entidades de domínio

### Lancamento (campos adicionados)
| Atributo | Tipo | Regras |
|----------|------|--------|
| `pago` | boolean | default `false`; só pode ser `true` se `origemRegraId !== null` |
| `valorPago` | number\|null | `> 0` e `numeric(12,2)` quando informado; `null` quando `pago=false`; default `null` |

Invariantes adicionais em `Lancamento.criar`/`registrarPagamento`:
- Se `origemRegraId === null` e `pago === true` → `LancamentoInvalidoError` ("Apenas recorrências podem ser marcadas como pagas.").
- Se `pago === true` e `valorPago === null` → assume `valorPago = valor` (previsto) no use case (default explícito).
- Se `pago === false` → força `valorPago = null`.
- `valorPago`, quando informado, deve ser `> 0`.

Getter derivado: `get valorEfetivo(): number => this.pago && this.valorPago !== null ? this.valorPago : this.valor`.
Getter com sinal: `valorEfetivoComSinal` (positivo receita / negativo despesa), análogo ao `valorComSinal` atual.

## 4. Tipos compartilhados

```ts
// LancamentoDTO ganha:
export interface LancamentoDTO {
  // ...campos atuais...
  /** true se a ocorrência (de recorrência) já foi paga. Sempre false em lançamentos manuais. */
  pago: boolean;
  /** Valor efetivamente pago (numeric 2 casas) ou null se ainda não pago / lançamento manual. */
  valorPago: number | null;
}

/** Corpo do registro de pagamento de uma ocorrência recorrente. */
export interface RegistrarPagamentoDTO {
  pago: boolean;
  /** Obrigatório opcional: se ausente e pago=true, assume o valor previsto. */
  valorPago?: number | null;
}
```

## 5. Contratos de API

- **PATCH /lancamentos/:id/pagamento**
  - Request: `{ "pago": true, "valorPago": 237.00 }` (ou `{ "pago": false }`).
  - Response 200: `LancamentoDTO` (com `pago` e `valorPago` atualizados).
  - 400: lançamento manual (`origemRegraId === null`) → "Apenas recorrências podem ser marcadas como pagas."
  - 400: `valorPago <= 0` ou mais de 2 casas decimais.
  - 404: lançamento inexistente.
- **GET /lancamentos?competencia=AAAA-MM** — inalterado na rota; resposta agora inclui `pago` e `valorPago`.
- **GET /lancamentos/resumo?competencia=AAAA-MM** — inalterado na rota; `totalReceitas`/`totalDespesas`/`saldo`
  passam a usar `valorEfetivo`.
- **PUT /lancamentos/:id** — inalterado: edição completa **não** mexe em `pago`/`valorPago` (preserva o estado de
  pagamento existente; campos não fazem parte do corpo de edição).

## 6. Requisitos funcionais

- **RF-001** — O domínio `Lancamento` **DEVE** expor `pago` e `valorPago` e a regra de que só ocorrências com
  `origemRegraId !== null` podem ser pagas.
- **RF-002** — `RegistrarPagamentoUseCase` **DEVE** marcar/desmarcar pagamento e, quando `pago=true` sem
  `valorPago`, assumir o valor previsto como valor pago.
- **RF-003** — Ao desmarcar (`pago=false`), o sistema **DEVE** zerar `valorPago` (volta a usar o previsto).
- **RF-004** — `ObterResumoMensalUseCase` **DEVE** somar por `valorEfetivo` em vez de `valor`.
- **RF-005** — `ObterConsumoCategoriasUseCase` **DEVE** computar o gasto por `valorEfetivo`.
- **RF-006** — A API **DEVE** rejeitar (400) tentativa de marcar como pago um lançamento manual.
- **RF-007** — O frontend **DEVE** exibir, em cada lançamento de recorrência, um checkbox "Pago" e, quando pago,
  o valor real ao lado do previsto (ex.: "Previsto R$ 200 · Pago R$ 237").
- **RF-008** — O frontend **DEVERIA** permitir informar o valor pago num input ao marcar como pago (default
  preenchido com o previsto).

## 7. Requisitos não-funcionais

- **Performance**: `PATCH` afeta uma única linha; resumo/consumo continuam O(n) sobre os lançamentos do mês.
- **Integridade**: `valorPago` sempre coerente com `pago` (constraint de aplicação; `pago=false ⇒ valorPago=null`).
- **Compatibilidade**: lançamentos existentes assumem `pago=false`, `valorPago=null` na migração (default em coluna).
- **Precisão**: somas em centavos inteiros (mantém o padrão atual do resumo).

## 8. Edge cases técnicos

1. **Lançamento manual** marcado como pago via PATCH → 400 (não aplicável).
2. **`pago=true` sem `valorPago`** → grava `valorPago = valor previsto` (sem erro).
3. **Desmarcar pagamento** de ocorrência que tinha `valorPago` → `valorPago` volta a `null` e totais voltam ao previsto.
4. **`valorPago = 0` ou negativo** → 400 (deve ser > 0).
5. **Re-materialização** da competência: a materialização é idempotente por `(origemRegraId, ocorrenciaIndice)` e
   **não** sobrescreve lançamentos já existentes, logo `pago`/`valorPago` são preservados.
6. **Edição via PUT** de uma ocorrência paga (ex.: trocar descrição) → mantém `pago`/`valorPago` (PUT não os toca).
7. **Exclusão** de ocorrência paga → segue o fluxo de exclusão atual (marca ocorrência como excluída); sem efeito colateral nos campos.

## 9. Estratégia de testes

- Unitário (domínio): `valorEfetivo` (pago/ não pago), invariante de lançamento manual, default de `valorPago`,
  desmarcar zera `valorPago`.
- Unitário (use cases): resumo e consumo somando por `valorEfetivo`; `RegistrarPagamentoUseCase` (404, 400 manual, default).
- Integração (e2e): PATCH em ocorrência recorrente; 400 em manual; resumo reflete valor pago; re-materialização preserva pagamento.
- Frontend: checkbox alterna estado e dispara recarga; valor real exibido junto do previsto.

## 10. Breakdown de tarefas

**Shared**
- [x] T1 — Adicionar `pago` e `valorPago` em `LancamentoDTO` e criar `RegistrarPagamentoDTO`.

**Backend — domínio**
- [x] T2 — `Lancamento`: campos `pago`/`valorPago`, invariantes e getters `valorEfetivo`/`valorEfetivoComSinal`. *(T1)*

**Backend — infraestrutura**
- [x] T3 — Migration: colunas `pago boolean not null default false` e `valorPago numeric(12,2) null` em `lancamentos`. *(T2)*
- [x] T4 — Atualizar `LancamentoSchema` e `lancamento.mapper` (ida/volta dos novos campos). *(T3)*

**Backend — aplicação/apresentação**
- [x] T5 — `RegistrarPagamentoUseCase` (404/400/default) + erro de domínio para lançamento manual. *(T2,T4)*
- [x] T6 — `ObterResumoMensalUseCase` e `ObterConsumoCategoriasUseCase` passam a usar `valorEfetivo`. *(T2)*
- [x] T7 — `PATCH /lancamentos/:id/pagamento` no `LancamentosController` (DTO de request + mapeamento de erros). *(T5)*

**Frontend**
- [x] T8 — Cliente de API: método `registrarPagamento(id, body)`. *(T7)*
- [x] T9 — `LancamentoItem`: checkbox "Pago" (só quando `origemRegraId`), input de valor real e exibição previsto×pago. *(T8)*

**Testes**
- [x] T10 — Unitários de domínio + use cases (valorEfetivo, resumo, consumo, registrar pagamento). *(T5,T6)*
- [x] T11 — e2e do PATCH (sucesso, 400 manual, 404) e do resumo refletindo valor pago. *(T7)*

## 11. Decisões e premissas

- **D1** — *(confirmado pelo usuário)* O valor realmente pago **entra nos totais**: resumo e metas usam `valorEfetivo`
  (previsto enquanto não pago; pago quando marcado).
- **D2** — *(confirmado pelo usuário)* O controle de pagamento vale **somente para lançamentos de recorrências/parcelas**
  (`origemRegraId !== null`); lançamentos manuais ficam fora (sempre `pago=false`).
- **D3** — Endpoint dedicado `PATCH .../pagamento` em vez de sobrecarregar o `PUT`, para a ação de "marcar pago" ser
  barata e não exigir reenvio do lançamento inteiro.
- **D4** — `pago=true` sem `valorPago` assume o previsto, cobrindo o caso comum "pagou o valor esperado" em um clique.
- **D5** — Migração define defaults retroativos (`pago=false`, `valorPago=null`), sem backfill de dados.
