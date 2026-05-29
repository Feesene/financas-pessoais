# PRD — Categorias e Metas por Categoria (P2)

- **Projeto:** financas-pessoais
- **Prioridade:** P2 (MVP)
- **Status:** Proposto
- **Depende de:** P1 (Orçamento Mensal)

## 1. Contexto e problema

Em P1, a `categoria` do lançamento é apenas texto livre. Isso gera inconsistência (ex.: "Cartão" vs "cartao")
e impede um recurso central de planilhas de despesa: **definir um orçamento/meta por categoria** e ser avisado
ao estourar. Esta feature formaliza as **categorias** (cadastro reutilizável) e adiciona **metas mensais por
categoria** com alerta de estouro.

## 2. Usuários-alvo

- **Proprietário (usuário único).** Quer padronizar suas categorias e controlar quanto gasta em cada uma.

## 3. Fluxo principal

1. O usuário cadastra/edita categorias (nome, tipo receita/despesa, cor opcional).
2. Define, para uma categoria de despesa, uma **meta mensal** (limite em R$).
3. Ao lançar despesas (P1), o app acumula o gasto da categoria no mês e mostra **consumo da meta**
   (gasto ÷ meta).
4. Quando o gasto ultrapassa a meta, o app exibe **alerta de estouro** para aquela categoria.

## 4. User stories

### P1 — Cadastrar e reutilizar categorias *(entrega valor sozinha)*
**Como** proprietário, **quero** uma lista de categorias padronizadas **para** classificar lançamentos de
forma consistente.
- **Given** não tenho categorias, **when** crio "Cartão" (despesa) e "Salário" (receita), **then** elas ficam
  disponíveis para seleção no formulário de lançamento de P1.
- **Given** crio uma categoria com nome já existente para o mesmo tipo, **when** confirmo, **then** o sistema
  rejeita a duplicidade.

### P2 — Definir meta mensal por categoria
**Como** proprietário, **quero** definir um limite de gasto por categoria **para** controlar meus gastos.
- **Given** a categoria "Cartão" (despesa), **when** defino meta de R$ 2.500,00, **then** a meta passa a valer
  para os meses seguintes.
- **Given** uma categoria de receita, **when** tento definir meta, **then** o sistema não permite (meta só para
  despesa).

### P3 — Ver consumo e alerta de estouro
**Como** proprietário, **quero** ver quanto já consumi da meta **para** evitar estourar o orçamento.
- **Given** meta de "Cartão" R$ 2.500,00 e gastos de R$ 2.700,00 em `2026-05`, **when** abro o orçamento,
  **then** vejo a categoria sinalizada como estourada (108% da meta).
- **Given** gasto de R$ 1.000,00 sobre meta de R$ 2.500,00, **when** abro o orçamento, **then** vejo 40% de
  consumo, sem alerta.

## 5. Requisitos funcionais

- **RF-001** — O sistema **DEVE** permitir CRUD de categorias (nome, tipo, cor opcional).
- **RF-002** — O sistema **DEVE** impedir categorias duplicadas (mesmo nome + tipo).
- **RF-003** — O sistema **DEVE** permitir definir/editar/remover uma **meta mensal** (valor > 0) para
  categorias de despesa.
- **RF-004** — O sistema **DEVE** calcular o gasto acumulado por categoria numa competência e o **percentual de
  consumo** da meta.
- **RF-005** — O sistema **DEVE** sinalizar visualmente categorias que ultrapassaram a meta no mês.
- **RF-006** — O lançamento (P1) **DEVE** referenciar uma categoria cadastrada (migração do texto livre para
  `categoriaId`).
- **RF-007** — O sistema **DEVERIA** impedir excluir categoria com lançamentos vinculados (ou exigir
  realocação).
- **RF-008** — O sistema **PODE** herdar a meta do mês anterior quando não definida explicitamente.

## 6. Escopo

**Dentro:** cadastro de categorias; meta mensal por categoria de despesa; cálculo de consumo e alerta de
estouro; vínculo lançamento→categoria.

### Fora do escopo
- **Orçamento global do mês** (teto total) — pode virar item futuro; aqui é por categoria.
- **Recorrência de lançamentos** — é P3.
- **Notificações push/e-mail de estouro** — backlog; aqui o alerta é visual no app.

## 7. Premissas

- Meta é **mensal e por categoria de despesa**; categorias de receita não têm meta.
- A migração de `categoria: string` (P1) para `categoriaId` será feita nesta feature; categorias usadas em P1
  viram registros de categoria (seed/normalização). **[Premissa]**
- Cor é opcional e meramente visual.

## 8. Critérios de sucesso

- **CS-001** — 100% dos lançamentos passam a referenciar uma categoria cadastrada (sem texto livre órfão).
- **CS-002** — O percentual de consumo exibido bate com `gasto/meta` para qualquer competência (erro 0).
- **CS-003** — Toda categoria que ultrapassa a meta no mês é sinalizada — verificável com pelo menos 3 casos de
  teste (abaixo, igual, acima da meta).

## 9. Dependências

- P1 (entidade `Lancamento`, orçamento mensal). Requer ajuste para vincular `categoriaId`.
