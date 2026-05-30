# Feature Spec — Reservas por Objetivo (P4)

- **Projeto:** financas-pessoais
- **PRD:** [`_prd.md`](./_prd.md)
- **Slug:** reservas-por-objetivo
- **Status:** Proposto
- **Depende de:** orcamento-mensal (P1, opcional via sugestão de aporte)

## 1. Descrição técnica da solução

Novo módulo de domínio **`reservas`** (DDD/Clean) com as entidades `Balde` (objetivo) e `MovimentoReserva`
(aporte/retirada). O saldo é **derivado** dos movimentos + saldo inicial (não armazenado redundantemente),
calculado por `ObterSaldosUseCase`. A evolução por competência é uma agregação cumulativa.

## 2. Fluxo técnico

```
[CRUD baldes]    → BaldesController → {Criar/Editar/Excluir}BaldeUseCase → BaldeRepository
[Movimento]      → POST /baldes/:id/movimentos → RegistrarMovimentoUseCase → MovimentoRepository
[Saldos atuais]  → GET /reservas/saldos[?competencia=]
                     → ObterSaldosUseCase: por balde, saldoInicial + Σaportes − Σretiradas (≤ competência)
                     → SaldoBaldeDTO[] + total
[Evolução]       → GET /baldes/:id/evolucao → saldo acumulado ao fim de cada competência
```

## 3. Entidades de domínio

### Balde
| Atributo | Tipo | Regras |
|----------|------|--------|
| `id` | uuid | |
| `nome` | string | obrigatório, único, ≤ 80 |
| `saldoInicial` | number | ≥ 0, default 0, `numeric(12,2)` |
| `cor` | string\|null | opcional |

### MovimentoReserva
| Atributo | Tipo | Regras |
|----------|------|--------|
| `id` | uuid | |
| `baldeId` | uuid | FK Balde |
| `tipo` | `'APORTE'\|'RETIRADA'` | |
| `valor` | number | > 0, `numeric(12,2)` |
| `competencia` | `AAAA-MM` | |
| `descricao` | string\|null | opcional |

Saldo do balde até competência C = `saldoInicial + Σ(APORTE.valor) − Σ(RETIRADA.valor)` para movimentos com
`competencia ≤ C`.

## 4. Tipos compartilhados

```ts
export type TipoMovimentoReserva = 'APORTE' | 'RETIRADA';
export interface BaldeDTO { id: string; nome: string; saldoInicial: number; cor: string | null; }
export interface MovimentoReservaDTO {
  id: string; baldeId: string; tipo: TipoMovimentoReserva; valor: number; competencia: string; descricao: string | null;
}
export interface SaldoBaldeDTO { balde: BaldeDTO; saldo: number; negativo: boolean; }
export interface SaldosReservaDTO { competencia: string | null; baldes: SaldoBaldeDTO[]; total: number; }
```

## 5. Contratos de API

- **POST /baldes** → 201 `BaldeDTO`; 400; 409 (nome duplicado).
- **GET /baldes** → 200 `BaldeDTO[]`.
- **PUT /baldes/:id** → 200; 404; 409.
- **DELETE /baldes/:id** → 204; 404; 409 (com movimentos, exige confirmação/realocação).
- **POST /baldes/:id/movimentos** `{ tipo, valor, competencia, descricao? }` → 201 `MovimentoReservaDTO`; 400; 404.
- **PUT /movimentos/:id** → 200; 404. **DELETE /movimentos/:id** → 204; 404.
- **GET /reservas/saldos?competencia=** (competência opcional; ausente = saldo atual total) → 200 `SaldosReservaDTO`.
- **GET /baldes/:id/evolucao** → 200 `{ competencia: string; saldo: number }[]`.

## 6. Requisitos funcionais

- **RF-001** — Backend **DEVE** CRUD de `Balde` com nome único.
- **RF-002** — Backend **DEVE** registrar `MovimentoReserva` (aporte/retirada, valor>0, competência válida).
- **RF-003** — `ObterSaldosUseCase` **DEVE** calcular saldo por balde até a competência e o total.
- **RF-004** — Backend **DEVE** permitir editar/excluir movimento, refletindo no saldo.
- **RF-005** — Backend **DEVE** expor a evolução cumulativa do saldo de um balde por competência.
- **RF-006** — Backend **DEVERIA** sinalizar saldo negativo (`negativo:true`) sem bloquear.
- **RF-007** — Frontend **DEVE** ter tela de reservas com cards por balde (saldo + cor), total geral e
  formulário de movimento.
- **RF-008** — Frontend **DEVERIA** mostrar a evolução de um balde em gráfico/linha.

## 7. Requisitos não-funcionais

- **Performance**: saldos em < 300 ms; índice `movimento(baldeId,competencia)`.
- **Integridade**: FK `movimento.baldeId`; exclusão de balde controlada.
- **Consistência**: saldo sempre derivado dos movimentos (fonte única), 2 casas decimais.

## 8. Edge cases técnicos

1. Balde sem movimentos → saldo = `saldoInicial`.
2. Competência sem movimentos no mês → saldo = acumulado anterior (carry-over), não zera.
3. Retirada > saldo → registra e marca `negativo:true` (não bloqueia).
4. Nome de balde duplicado → 409.
5. Excluir balde com movimentos → 409 (confirmação explícita necessária).
6. Editar valor de movimento → recálculo de saldos e evolução; sem efeito em outros baldes.

## 9. Estratégia de testes

- Unitário: cálculo de saldo (inicial + aportes − retiradas); flag negativo; soma do total.
- Integração: carry-over entre meses; edição/exclusão de movimento; 409 de exclusão de balde.
- Frontend: cards de saldo e total; gráfico de evolução; aviso de negativo.

## 10. Breakdown de tarefas

**Shared**
- [x] T1 — Tipos `TipoMovimentoReserva`, `BaldeDTO`, `MovimentoReservaDTO`, `SaldoBaldeDTO`, `SaldosReservaDTO`.

**Backend — módulo reservas**
- [x] T2 — Domínio `Balde` (entidade + repo interface). *(T1)*
- [x] T3 — Domínio `MovimentoReserva` (entidade + repo interface). *(T1)*
- [x] T4 — Infra TypeORM (schemas, mappers, repos) + índices. *(T2,T3)*
- [x] T5 — Use cases CRUD de balde (excluir bloqueia se houver movimentos). *(T4)*
- [x] T6 — Use cases registrar/editar/excluir movimento. *(T4)*
- [x] T7 — `ObterSaldosUseCase` (por balde + total, com carry-over). *(T4)*
- [x] T8 — `ObterEvolucaoBaldeUseCase` (cumulativo por competência). *(T4)*
- [x] T9 — `ReservasModule` + controllers (rotas seção 5). *(T5,T6,T7,T8)*

**Frontend**
- [x] T10 — Cliente de API de reservas. *(T9)*
- [x] T11 — Tela de reservas: cards por balde + total + CRUD de balde. *(T10)*
- [x] T12 — Formulário de movimento (aporte/retirada) com competência. *(T10)*
- [x] T13 — Gráfico de evolução por balde + aviso de saldo negativo. *(T11)*

**Testes**
- [x] T14 — Unitários de saldo/evolução. *(T7,T8)*
- [x] T15 — e2e de movimentos, carry-over e exclusões. *(T9)*

## 11. Decisões e premissas

- **D1** — Saldo é **derivado** (não materializado) para evitar inconsistência; recalculado a cada consulta.
- **D2** — Saldo negativo é permitido com aviso (reflete ajustes manuais como na planilha).
- **D3** — Balde "Investimento"/"FGTS" aqui é reserva contábil; carteira detalhada é P6 (sem acoplamento).
- **D4** — Exclusão de balde com movimentos exige confirmação (409) — evita perda acidental de histórico.
