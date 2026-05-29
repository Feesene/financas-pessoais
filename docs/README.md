# Documentação — financas-pessoais

Esta pasta concentra a documentação técnica do projeto, seguindo o fluxo de **Spec Driven Development**.

## Fluxo

1. **Documentação inicial** — visão geral da arquitetura e objetivo do sistema (skill `criar-doc-inicial`).
2. **PRD** (`.speckit/features/{slug}/_prd.md`) — define **o quê** e **por quê** de cada feature (skill `criar-prd`).
3. **Feature Spec** (`.speckit/features/{slug}/_spec.md`) — define **como**: arquitetura, contratos, entidades e breakdown de tarefas (skill `criar-feature-spec`).
4. **Execução** — implementação das tarefas da spec, marcando os checkboxes conforme conclui (skill `executar-spec`).
5. **Atualização das docs** — changelog e documentação refletindo o que foi implementado (skill `atualizar-docs`).

## Convenções

- Cada feature tem uma pasta própria em `.speckit/features/{slug}/` com `_prd.md` e `_spec.md`.
- `{slug}` em kebab-case, sem acentos (ex.: `orcamento-mensal`); se houver ticket, inclua-o (`142-...`).
- A Spec referencia o PRD correspondente no cabeçalho.

## Estrutura do projeto

- `frontend/` — aplicação Next.js (App Router).
- `backend/` — API NestJS com TypeORM e PostgreSQL.
- `shared/` — tipos e utilitários compartilhados (`@financas-pessoais/shared`).

## Priorização do MVP

| # | Feature | Status | PRD / Spec |
|---|---------|--------|------------|
| P1 | Orçamento mensal (receitas/despesas por categoria, saldo do mês) | MVP | [PRD](../.speckit/features/orcamento-mensal/_prd.md) · [Spec](../.speckit/features/orcamento-mensal/_spec.md) |
| P2 | Categorias + metas/orçamento por categoria (limite + alerta) | MVP | [PRD](../.speckit/features/categorias-e-metas/_prd.md) · [Spec](../.speckit/features/categorias-e-metas/_spec.md) |
| P3 | Recorrências e parcelas | MVP | [PRD](../.speckit/features/recorrencias-e-parcelas/_prd.md) · [Spec](../.speckit/features/recorrencias-e-parcelas/_spec.md) |
| P4 | Reservas / metas por objetivo (baldes) | MVP | [PRD](../.speckit/features/reservas-por-objetivo/_prd.md) · [Spec](../.speckit/features/reservas-por-objetivo/_spec.md) |
| P5 | Histórico e relatórios/dashboards | MVP | [PRD](../.speckit/features/historico-e-relatorios/_prd.md) · [Spec](../.speckit/features/historico-e-relatorios/_spec.md) |
| P6 | Carteira de investimentos (ações, FIIs, fundos) | MVP | [PRD](../.speckit/features/carteira-de-investimentos/_prd.md) · [Spec](../.speckit/features/carteira-de-investimentos/_spec.md) |
| P7 | Projeções (juros compostos) | MVP | [PRD](../.speckit/features/projecoes/_prd.md) · [Spec](../.speckit/features/projecoes/_spec.md) |

Ver backlog (fora do MVP) em [BACKLOG.md](./BACKLOG.md).
