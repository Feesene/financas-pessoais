# Feature Spec — Carteira de Investimentos (P6)

- **Projeto:** financas-pessoais
- **PRD:** [`_prd.md`](./_prd.md)
- **Slug:** carteira-de-investimentos
- **Status:** Proposto
- **Depende de:** Independente (integra-se opcionalmente com reservas-por-objetivo P4 e historico-e-relatorios P5)

## 1. Descrição técnica da solução

Novo módulo de domínio **`investimentos`** (DDD/Clean) com a entidade `Ativo` (tipo `FUNDO|ACAO|FII`) e
`MovimentoCarteira` (entrada/saída/rendimento por competência). O **valor bruto** de `ACAO`/`FII` é **derivado**
de `quantidade × valorUnitario`; para `FUNDO` é informado diretamente em `valorBruto`. A **posição da carteira**
é calculada por `ObterPosicaoCarteiraUseCase` agregando ativos por tipo. O histórico mensal é a agregação dos
`MovimentoCarteira` por competência.

## 2. Fluxo técnico

```
[CRUD ativos]    → AtivosController → {Criar/Editar/Excluir}AtivoUseCase → AtivoRepository
[Movimento]      → POST /ativos/:id/movimentos → RegistrarMovimentoUseCase → MovimentoCarteiraRepository
[Posição atual]  → GET /carteira/posicao
                     → ObterPosicaoCarteiraUseCase: por ativo (valorBruto), subtotal por tipo, total geral,
                       rendimento total
[Histórico]      → GET /carteira/historico → por competência: Σentradas, Σsaidas, Σrendimentos, fluxoLiquido
```

`valorBruto` do ativo:
- `ACAO`/`FII`: `quantidade * valorUnitario` (derivado; `quantidade` e `valorUnitario` obrigatórios).
- `FUNDO`: campo `valorBruto` informado (`quantidade`/`valorUnitario` nulos).

## 3. Entidades de domínio

### Ativo
| Atributo | Tipo | Regras |
|----------|------|--------|
| `id` | uuid | |
| `tipo` | `'FUNDO'\|'ACAO'\|'FII'` | obrigatório |
| `descricao` | string | obrigatório, ≤ 80 |
| `quantidade` | number\|null | obrigatório se `ACAO`/`FII` (> 0); nulo se `FUNDO` |
| `valorUnitario` | number\|null | obrigatório se `ACAO`/`FII` (≥ 0), `numeric(12,2)`; nulo se `FUNDO` |
| `valorBruto` | number | `FUNDO`: informado (≥ 0); `ACAO`/`FII`: derivado `quantidade*valorUnitario` |
| `rendimento` | number | acumulado informado, default 0, `numeric(12,2)` |

### MovimentoCarteira
| Atributo | Tipo | Regras |
|----------|------|--------|
| `id` | uuid | |
| `ativoId` | uuid | FK Ativo |
| `tipo` | `'ENTRADA'\|'SAIDA'\|'RENDIMENTO'` | |
| `valor` | number | > 0, `numeric(12,2)` |
| `competencia` | `AAAA-MM` | |
| `descricao` | string\|null | opcional |

Regra de integridade: ao criar/editar `ACAO`/`FII`, exigir `quantidade` e `valorUnitario`; ao criar/editar
`FUNDO`, exigir `valorBruto` e rejeitar `quantidade`/`valorUnitario`.

## 4. Tipos compartilhados

```ts
export type TipoAtivo = 'FUNDO' | 'ACAO' | 'FII';
export type TipoMovimentoCarteira = 'ENTRADA' | 'SAIDA' | 'RENDIMENTO';
export interface AtivoDTO {
  id: string; tipo: TipoAtivo; descricao: string;
  quantidade: number | null; valorUnitario: number | null; valorBruto: number; rendimento: number;
}
export interface MovimentoCarteiraDTO {
  id: string; ativoId: string; tipo: TipoMovimentoCarteira; valor: number; competencia: string; descricao: string | null;
}
export interface SubtotalTipoDTO { tipo: TipoAtivo; total: number; rendimento: number; }
export interface PosicaoCarteiraDTO {
  ativos: AtivoDTO[]; subtotais: SubtotalTipoDTO[]; total: number; rendimentoTotal: number;
}
export interface HistoricoCarteiraItemDTO {
  competencia: string; entradas: number; saidas: number; rendimentos: number; fluxoLiquido: number;
}
```

## 5. Contratos de API

- **POST /ativos** `{ tipo, descricao, quantidade?, valorUnitario?, valorBruto?, rendimento? }` → 201
  `AtivoDTO`; 400 (campos inconsistentes com o tipo).
- **GET /ativos** → 200 `AtivoDTO[]`.
- **PUT /ativos/:id** → 200 `AtivoDTO`; 400; 404.
- **DELETE /ativos/:id** → 204; 404; 409 (com movimentos, exige confirmação).
- **POST /ativos/:id/movimentos** `{ tipo, valor, competencia, descricao? }` → 201 `MovimentoCarteiraDTO`; 400;
  404.
- **PUT /movimentos-carteira/:id** → 200; 404. **DELETE /movimentos-carteira/:id** → 204; 404.
- **GET /carteira/posicao** → 200 `PosicaoCarteiraDTO`.
- **GET /carteira/historico?de=AAAA-MM&ate=AAAA-MM** (intervalo opcional) → 200 `HistoricoCarteiraItemDTO[]`.

## 6. Requisitos funcionais

- **RF-001** — Backend **DEVE** CRUD de `Ativo` com validação por tipo (ação/FII exigem quantidade+unitário;
  fundo exige valorBruto).
- **RF-002** — Backend **DEVE** derivar `valorBruto = quantidade × valorUnitario` para `ACAO`/`FII`.
- **RF-003** — `ObterPosicaoCarteiraUseCase` **DEVE** calcular subtotal por tipo, total geral e rendimento
  total.
- **RF-004** — Backend **DEVE** registrar/editar/excluir `MovimentoCarteira` por competência.
- **RF-005** — Backend **DEVE** expor o histórico mensal agregado (entradas, saídas, rendimentos, fluxo
  líquido).
- **RF-006** — `DELETE /ativos/:id` **DEVE** bloquear (409) se houver movimentos vinculados.
- **RF-007** — Frontend **DEVE** ter tela de carteira com ativos agrupados por tipo, subtotais e total geral.
- **RF-008** — Frontend **DEVERIA** mostrar o histórico de movimentações por mês (tabela/gráfico).

## 7. Requisitos não-funcionais

- **Performance**: posição da carteira em < 300 ms; índice `movimento_carteira(ativoId,competencia)`.
- **Integridade**: FK `movimento_carteira.ativoId`; exclusão de ativo controlada (409 com histórico).
- **Consistência**: `valorBruto` de ação/FII sempre derivado (fonte única); 2 casas decimais.

## 8. Edge cases técnicos

1. Criar `ACAO` sem `quantidade` ou sem `valorUnitario` → 400.
2. Criar `FUNDO` enviando `quantidade`/`valorUnitario` → 400 (campos não aplicáveis ao tipo).
3. `quantidade = 0` em ação/FII → 400 (deve ser > 0); `valorUnitario = 0` é permitido (ativo zerado).
4. Excluir ativo com movimentos → 409 (confirmação explícita necessária).
5. Saída maior que entradas no mês → aceita; `fluxoLiquido` negativo (não bloqueia).
6. Editar `valorUnitario` de uma ação → recálculo automático de `valorBruto` e do total da carteira.

## 9. Estratégia de testes

- Unitário: cálculo de valorBruto (ação/FII) vs informado (fundo); validação por tipo; soma de subtotais e
  total; rendimento total.
- Integração: CRUD + 409 de exclusão com movimentos; histórico agregado por competência; fluxo líquido
  negativo.
- Frontend: agrupamento por tipo com subtotais e total; render do histórico; formulário condicional por tipo
  de ativo.

## 10. Breakdown de tarefas

**Shared**
- [ ] T1 — Tipos `TipoAtivo`, `TipoMovimentoCarteira`, `AtivoDTO`, `MovimentoCarteiraDTO`, `SubtotalTipoDTO`,
  `PosicaoCarteiraDTO`, `HistoricoCarteiraItemDTO`.

**Backend — módulo investimentos**
- [ ] T2 — Domínio `Ativo` (entidade + regras por tipo + valorBruto derivado + repo interface). *(T1)*
- [ ] T3 — Domínio `MovimentoCarteira` (entidade + repo interface). *(T1)*
- [ ] T4 — Infra TypeORM (schemas, mappers, repos) + índices. *(T2,T3)*
- [ ] T5 — Use cases CRUD de ativo (excluir bloqueia se houver movimentos). *(T4)*
- [ ] T6 — Use cases registrar/editar/excluir movimento de carteira. *(T4)*
- [ ] T7 — `ObterPosicaoCarteiraUseCase` (subtotais por tipo + total + rendimento total). *(T4)*
- [ ] T8 — `ObterHistoricoCarteiraUseCase` (agregação por competência). *(T4)*
- [ ] T9 — `InvestimentosModule` + controllers (rotas seção 5). *(T5,T6,T7,T8)*

**Frontend**
- [ ] T10 — Cliente de API de investimentos. *(T9)*
- [ ] T11 — Tela de carteira: ativos agrupados por tipo + subtotais + total geral + CRUD de ativo. *(T10)*
- [ ] T12 — Formulário de ativo condicional por tipo (ação/FII: qtd+unitário; fundo: valorBruto). *(T10)*
- [ ] T13 — Histórico de movimentações por mês + registro de movimento. *(T11)*

**Testes**
- [ ] T14 — Unitários de valorBruto/validação por tipo/posição. *(T7)*
- [ ] T15 — e2e de CRUD, movimentos, histórico e 409 de exclusão. *(T9)*

## 11. Decisões e premissas

- **D1** — `valorBruto` de ação/FII é **derivado** (qtd × unitário); fundo informa direto. Evita inconsistência.
- **D2** — Sem cotação automática: todos os valores são manuais (espelha a planilha). Cotações em tempo real
  ficam no backlog.
- **D3** — Rendimento é um valor **informado** acumulado por ativo (não calculado por preço médio), como na
  planilha.
- **D4** — Exclusão de ativo com histórico exige confirmação (409) — evita perda de movimentações.
- **D5** — Integração com o balde "Investimento" de P4 é **opcional e somente leitura** (sem acoplamento de
  dados) — coerente com D3 do spec de reservas.
