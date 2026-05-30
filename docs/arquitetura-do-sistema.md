# Arquitetura do Sistema — financas-pessoais

## Visão geral da arquitetura

`financas-pessoais` é uma aplicação web **fullstack** organizada como **monorepo** (npm workspaces) com três
pacotes:

- **`frontend/`** — aplicação Next.js (App Router) + React, em TypeScript. Camada de interface, desktop-first.
  Estilização com **Tailwind CSS** e componentes **shadcn/ui** (sobre Radix UI); toasts com `sonner`, ícones
  `lucide-react`, gráficos `recharts`. Convenções de UI/UX na doc canônica [UI / Frontend](./ui-frontend.md).
- **`backend/`** — API NestJS com TypeORM e PostgreSQL, em TypeScript. Concentra as regras de negócio,
  organizada em **DDD + Clean Architecture**, com um módulo por domínio.
- **`shared/`** — pacote `@financas-pessoais/shared` com tipos/contratos usados por frontend e backend (ex.:
  `TipoLancamento`, `LancamentoDTO`, `ApiResponse<T>`).

O sistema é **single-user, local e sem autenticação** no MVP: roda na máquina do próprio usuário, sem exposição
pública. Toda a entrada de dados é **manual**.

## Padrões arquiteturais utilizados

- **Monorepo com workspaces** — `frontend`, `backend` e `shared` compartilham configs de qualidade
  (ESLint/Prettier) e um `tsconfig.base.json` com `strict: true`.
- **DDD + Clean Architecture (backend)** — organização **por domínio**, não por camada técnica. Cada domínio é
  um módulo isolado com quatro camadas e a **regra de dependência apontando sempre para dentro**:

  ```
  presentation ──▶ application ──▶ domain ◀── infrastructure
  ```

  - `domain/` — entidades, value objects, interfaces de repositório e erros. **TypeScript puro**, sem
    `@nestjs/*` nem `typeorm`.
  - `application/` — casos de uso (um por classe, método `execute`), DTOs de aplicação, ports.
  - `infrastructure/` — entidades TypeORM (`@Entity`), mappers domínio↔persistência, repositórios concretos.
  - `presentation/` — controllers HTTP finos e DTOs de request com `class-validator`.
- **Inversão de dependência** — a aplicação declara a interface do repositório (port + token `Symbol`); a
  infraestrutura implementa, e o wiring é feito no `*.module.ts` via `{ provide: TOKEN, useClass: Impl }`.
- **Contrato compartilhado** — tipos de API ficam em `shared/` e são consumidos pelos dois lados, evitando
  divergência de contrato entre cliente e servidor.

## Regras e restrições arquiteturais

- O **domínio não importa framework** (sem `@nestjs/*`, sem `typeorm`). Quebrar isso fere a Clean Architecture.
- **Entidades de domínio ≠ entidades de persistência.** Conversão sempre via mapper. O ORM não vaza para o
  domínio.
- **Nenhuma regra de negócio em controller.** Controller só recebe request, chama caso de uso e devolve.
- **Validação de entrada na presentation** (`class-validator`); **invariantes de negócio no domínio** (no
  construtor/factory da entidade).
- `synchronize` do TypeORM só em desenvolvimento (`NODE_ENV === 'development'`); em produção, usar migrations.

## Convenções técnicas adotadas

- **Linguagem**: TypeScript em todos os pacotes, tipagem estrita, sem `any` implícito.
- **Idioma do domínio (ubiquitous language)**: português — ex.: módulo `lancamentos`, entidade `Lancamento`,
  caso de uso `CriarLancamentoUseCase`.
- **Nomes de arquivo**: kebab-case com sufixo de papel — `*.use-case.ts`, `*.repository.ts`, `*.schema.ts`,
  `*.mapper.ts`, `*.request.ts`, `*.module.ts`.
- **Estrutura de pastas do backend**: `src/modules/<dominio>/{domain,application,infrastructure,presentation}`
  + `src/shared/` (kernel transversal).
- **Estilo**: Prettier (semi, aspas simples, trailing comma `all`, largura 100).

## Separação de responsabilidades

| Camada / pacote | Responsabilidade |
|-----------------|------------------|
| `frontend` | UI, navegação, chamadas à API. Sem regra de negócio. |
| `backend/presentation` | Borda HTTP: validação de request, serialização de resposta. |
| `backend/application` | Orquestração de casos de uso. |
| `backend/domain` | Regras e invariantes de negócio (núcleo). |
| `backend/infrastructure` | Persistência (TypeORM/Postgres) e detalhes técnicos. |
| `backend/src/shared` | Kernel: `DomainError`, configs transversais (TypeORM). |
| `shared` | Contratos/tipos compartilhados front↔back. |

## Fluxo de comunicação entre módulos

```
Browser (Next.js, :3000)
   │  HTTP/JSON  (NEXT_PUBLIC_API_URL)
   ▼
NestJS API (:3001)
   controller → use-case → repository (interface)
                                   │ useClass
                                   ▼
                       TypeOrmRepository → PostgreSQL (:5432)
```

Exemplo concreto (módulo `lancamentos`): `POST /lancamentos` → `LancamentosController` →
`CriarLancamentoUseCase` → `LancamentoRepository` (port) → `TypeOrmLancamentoRepository` → `LancamentoSchema`
no Postgres. O contrato de resposta (`LancamentoDTO`) vem de `@financas-pessoais/shared`.

## Dependências críticas

- **NestJS 10** (`@nestjs/common`, `core`, `platform-express`, `config`, `typeorm`).
- **TypeORM 0.3** + **pg** — persistência em PostgreSQL 16 (via docker-compose).
- **class-validator / class-transformer** — validação dos DTOs HTTP.
- **Next.js 14 / React 18** — frontend.
- **Tailwind CSS 3 + shadcn/ui (Radix UI)** — design system do frontend; `sonner` (toasts), `lucide-react`
  (ícones), `recharts` (gráficos). Ver [docs/ui-frontend.md](./ui-frontend.md).
- **Docker / docker-compose** — provisiona o PostgreSQL local.

## Riscos técnicos e pontos de atenção

- **Sem autenticação (premissa de MVP).** Válido só para uso local. **Expor na internet exige implementar
  login/isolamento antes** — ver [BACKLOG](./BACKLOG.md).
- **`synchronize: true` em dev** acelera o início, mas pode causar perda de dados se usado fora de dev.
  Migrar para migrations antes de qualquer ambiente persistente sério.
- **Escopo amplo do MVP** (7 módulos). O maior risco é diluição; por isso a construção é incremental, P1→P7.
- **Valores monetários**: persistidos como `numeric(12,2)` e convertidos via mapper (`Number`/`toFixed(2)`).
  Atenção a arredondamento — manter o padrão de duas casas em todo o domínio. **[Hipótese]** de que `numeric`
  é suficiente; reavaliar se surgir necessidade de moedas múltiplas.

## Diretrizes para futuras implementações

- Cada novo módulo do MVP (P2–P7) deve seguir a **mesma estrutura de quatro camadas** do módulo `lancamentos`,
  que serve de referência canônica.
- O **frontend** de cada feature deve seguir o design system em [docs/ui-frontend.md](./ui-frontend.md):
  Tailwind + shadcn/ui, criação/edição em modais (`Dialog`), confirmação de exclusão (`AlertDialog`), avisos
  via `toast` (`sonner`), estados de loading/vazio/erro e gráficos com `recharts`. O módulo
  `frontend/src/components/orcamento` é a implementação de referência.
- Tipos expostos pela API devem ser declarados em `shared/` antes de implementar os dois lados.
- Manter o domínio livre de framework; toda integração externa entra via port + adapter na infraestrutura.
- Seguir o fluxo **Spec Driven Development** (PRD → Spec → execução) por feature — ver [docs/README](./README.md).
