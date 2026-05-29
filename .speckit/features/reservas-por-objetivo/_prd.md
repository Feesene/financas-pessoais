# PRD — Reservas por Objetivo (P4)

- **Projeto:** financas-pessoais
- **Prioridade:** P4 (MVP)
- **Status:** Proposto
- **Depende de:** P1 (Orçamento Mensal) para o conceito de saldo do mês

## 1. Contexto e problema

A aba "Poupança" da planilha distribui o dinheiro em **objetivos/baldes** (Poupança, FGTS, Carteira, Viagem,
Criptomoeda, Investimento) com **aportes (distribuições)** e **retiradas** mês a mês, mantendo o **saldo
acumulado por balde**. É a forma do usuário organizar reservas por finalidade. Esta feature reproduz esse
controle: criar baldes, registrar aportes/retiradas por competência e ver o saldo acumulado de cada um e o
total.

## 2. Usuários-alvo

- **Proprietário (usuário único).** Quer separar reservas por finalidade e acompanhar a evolução de cada uma.

## 3. Fluxo principal

1. O usuário cria baldes (ex.: "Viagem", "Poupança") com saldo inicial opcional.
2. A cada mês, registra **aportes** (entradas) e **retiradas** (saídas) em cada balde.
3. O app mostra o **saldo acumulado por balde** (inicial + Σ aportes − Σ retiradas) e o **total geral**.
4. O usuário acompanha a evolução do saldo de cada balde ao longo dos meses.

## 4. User stories

### P1 — Criar baldes e registrar movimentos *(entrega valor sozinha)*
**Como** proprietário, **quero** criar reservas por objetivo e registrar aportes/retiradas **para** organizar
meu dinheiro por finalidade.
- **Given** crio o balde "Viagem" com saldo inicial R$ 2.171,00, **when** registro aporte de R$ 140,00 em
  `2026-04`, **then** o saldo do balde passa a R$ 2.311,00.
- **Given** o balde "Viagem" com saldo R$ 2.311,00, **when** registro retirada de R$ 750,00, **then** o saldo
  passa a R$ 1.561,00.

### P2 — Ver saldo acumulado e total
**Como** proprietário, **quero** ver o saldo de cada balde e o total **para** saber quanto tenho reservado.
- **Given** baldes com saldos R$ 1.561,00 e R$ 64.532,06, **when** abro reservas, **then** vejo o total
  R$ 66.093,06.
- **Given** uma competência sem movimentos, **when** abro reservas, **then** os saldos refletem o acumulado até
  ali (carry-over), não zeram.

### P3 — Evolução por competência
**Como** proprietário, **quero** ver o saldo de um balde mês a mês **para** acompanhar a evolução.
- **Given** aportes em vários meses, **when** abro a evolução de "Poupança", **then** vejo o saldo acumulado ao
  final de cada competência.
- **Given** uma retirada que excede o saldo, **when** confirmo, **then** o sistema avisa (saldo negativo) —
  ver premissa.

## 5. Requisitos funcionais

- **RF-001** — O sistema **DEVE** permitir CRUD de baldes (nome, saldo inicial opcional, cor opcional).
- **RF-002** — O sistema **DEVE** registrar movimentos de balde do tipo `APORTE` ou `RETIRADA`, com valor > 0 e
  competência `AAAA-MM`.
- **RF-003** — O sistema **DEVE** calcular o saldo acumulado por balde (inicial + Σ aportes − Σ retiradas).
- **RF-004** — O sistema **DEVE** exibir o total geral somando os saldos de todos os baldes.
- **RF-005** — O sistema **DEVE** permitir editar/excluir um movimento, recalculando o saldo.
- **RF-006** — O sistema **DEVE** mostrar a evolução do saldo de um balde por competência.
- **RF-007** — O sistema **DEVERIA** avisar quando uma retirada deixa o balde negativo (sem bloquear).
- **RF-008** — O sistema **PODE** vincular o aporte ao saldo do mês do orçamento (P1) como sugestão (ex.:
  "sobrou R$ X, quanto aportar?").

## 6. Escopo

**Dentro:** baldes; movimentos (aporte/retirada) por competência; saldo acumulado por balde e total; evolução
mensal; edição/exclusão de movimentos.

### Fora do escopo
- **Integração automática com a carteira de investimentos (P6)** — o balde "Investimento" aqui é só uma reserva
  contábil; a carteira detalhada é P6.
- **Metas de valor-alvo por objetivo com previsão de data** — futuro; aqui é só saldo acumulado.
- **Transferência entre baldes** — futuro (pode ser feito como retirada+aporte manuais).

## 7. Premissas

- Saldo **pode ficar negativo** com aviso (não bloqueia), pois reflete ajustes manuais. **[Premissa]**
- O balde "FGTS"/"Investimento" são reservas contábeis aqui; o detalhamento de investimentos é P6.
- Competência é mensal `AAAA-MM`, igual ao restante do sistema.

## 8. Critérios de sucesso

- **CS-001** — O saldo acumulado de um balde reproduz a coluna "Totais" da aba Poupança da planilha para um
  mês real (diferença R$ 0,00).
- **CS-002** — O total geral é igual à soma dos saldos dos baldes em qualquer competência (erro 0).
- **CS-003** — Editar/excluir um movimento recalcula o saldo corretamente, verificável em ≥ 3 casos.

## 9. Dependências

- Independente em dados próprios; integra-se opcionalmente com o saldo do mês de P1 (RF-008).
