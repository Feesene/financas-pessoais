# financas-pessoais

Painel financeiro pessoal, em R$, que reúne **orçamento mensal**, **reservas por objetivo**, **carteira de
investimentos** e **projeções** num único lugar — substituindo a planilha de despesas por uma aplicação web.

## Problema

Controlar finanças pessoais hoje depende de uma planilha frágil: fórmulas quebram, não há validação, é ruim no
celular e não automatiza recorrências, alertas ou consolidação de dados.

## Proposta de valor

Um painel financeiro pessoal único, em português e R$, do seu jeito e sem assinatura: orçamento por categoria
com saldo do mês, reservas por objetivo, histórico de longo prazo, carteira de renda variável e calculadora de
juros compostos.

## Stack

- **Monorepo**: npm workspaces (`frontend`, `backend`, `shared`).
- **Frontend**: Next.js (App Router) + React + TypeScript.
- **Backend**: NestJS + TypeORM + PostgreSQL, organizado em **DDD + Clean Architecture** (módulos por domínio).
- **Shared**: pacote `@financas-pessoais/shared` com tipos compartilhados.
- **Qualidade**: ESLint + Prettier na raiz, `tsconfig.base.json` com `strict: true`.
- **Infra**: Docker Compose com PostgreSQL.

## Setup local

Pré-requisitos: Node.js 20+, Docker.

```bash
cd financas-pessoais
cp .env.example .env          # ajuste as variáveis se necessário
npm install
docker compose up -d          # sobe o PostgreSQL
npm run dev:backend           # API NestJS em http://localhost:3001
npm run dev:frontend          # Next.js em http://localhost:3000
```

> No Windows (PowerShell), use `Copy-Item .env.example .env` no lugar do `cp`.

## Documentação

A documentação técnica e o fluxo de **Spec Driven Development** ficam em [`docs/`](./docs/README.md). A
priorização do MVP e o backlog também estão lá.

Índice:

- [Arquitetura do sistema](./docs/arquitetura-do-sistema.md)
- [Objetivo do sistema](./docs/objetivo-do-sistema.md)
- Módulos:
  - [lancamentos](./docs/modules/lancamentos.md)
  - [shared](./docs/modules/shared.md)
- [Fluxo Spec Driven e priorização](./docs/README.md)
- [Backlog (fora do MVP)](./docs/BACKLOG.md)

## Escopo do MVP

P1 Orçamento mensal · P2 Metas por categoria · P3 Recorrências · P4 Reservas por objetivo ·
P5 Histórico e relatórios · P6 Carteira de investimentos · P7 Projeções.

Fora do MVP (ver [docs/BACKLOG.md](./docs/BACKLOG.md)): importação de planilha/CSV, Open Finance, cotações
automáticas, login/multiusuário, app mobile.
