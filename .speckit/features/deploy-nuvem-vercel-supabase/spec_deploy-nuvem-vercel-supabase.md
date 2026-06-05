# Feature Spec — Deploy na nuvem (Vercel + Supabase)

- **Projeto:** financas-pessoais
- **Slug:** `deploy-nuvem-vercel-supabase`
- **PRD de origem:** [prd_deploy-nuvem-vercel-supabase.md](./prd_deploy-nuvem-vercel-supabase.md)
- **Status:** Proposto
- **Camada impactada:** Infraestrutura e configuração — bootstrap NestJS (serverless), `buildTypeOrmConfig`, `data-source.ts` (migrations), CORS, `API_URL` do frontend, variáveis de ambiente, arquivos de deploy
- **Premissa que altera:** revoga "sem deploy público no MVP" e "execução local" do [objetivo do sistema](../../../docs/objetivo-do-sistema.md)
- **Dependência bloqueante:** [autenticação por senha](../autenticacao-login/spec_autenticacao-login.md) (já implementada)

---

## 1. Resumo técnico da solução

Hoje o sistema é um **monorepo npm workspaces** (`frontend`, `backend`, `shared`) que roda local: **Next.js 14
(App Router)** em `:3000`, **NestJS** (adapter Express) em `:3001` e **Postgres via Docker** em `:5432`. As
chamadas de dados saem do frontend por **server actions** que passam pelo choke point
[`core.ts`](../../../frontend/src/lib/api/core.ts) (`apiRequest`/`apiRequestBinary`), apontando para `API_URL`.

A publicação na nuvem é uma feature de **infraestrutura** — **não** altera regras de negócio nem os contratos REST
do backend. Ela tem três frentes:

1. **Banco → Supabase (Postgres gerenciado).** Substitui o Postgres do Docker apenas trocando a `DATABASE_URL`.
   O runtime serverless usa a **connection string com pooler** (PgBouncer, modo *transaction*, porta `6543`) e as
   **migrations** usam a **conexão direta** (porta `5432`). A conexão de produção habilita **SSL** e mantém
   `synchronize=false` (já é o comportamento fora de `development`).

2. **Backend NestJS → Vercel (funções serverless).** Sem reescrever os módulos DDD/Clean Architecture. Extrai-se a
   configuração do app (CORS por origem + `ValidationPipe`) para uma função `configureApp(app)` reutilizável, e
   cria-se um **entrypoint serverless** (`backend/api/index.ts`) que instancia o Nest sobre um `ExpressAdapter`,
   **cacheia a instância entre invocações** (mitiga cold start) e delega cada request ao Express. Um `vercel.json`
   roteia `/(.*)` para esse handler. As rotas e DTOs atuais ficam **idênticos**.

3. **Frontend Next.js → Vercel.** Deploy direto do diretório `frontend`. A única mudança funcional é apontar
   `API_URL` (lido server-side em `core.ts`) para a **URL pública da API** na Vercel, em vez de `localhost:3001`.
   O gate de senha da [autenticação](../autenticacao-login/spec_autenticacao-login.md) já protege todas as telas e
   o choke point de dados — nenhum dado é servido sem login.

Frontend e backend são **dois projetos Vercel distintos** (domínios diferentes), como o PRD §5 já antecipa
("Frontend e API em domínios diferentes"). Os segredos (`DATABASE_URL`, `APP_PASSWORD`, `AUTH_SECRET`) vivem
**apenas** como variáveis de ambiente na Vercel/Supabase, nunca versionados nem com prefixo `NEXT_PUBLIC_`.

### 1.1. Diagrama de fluxo

**Provisionamento e migração de schema (mantenedor, único, manual):**

```
mantenedor → cria projeto Supabase
   ├─ copia connection string DIRETA (5432)      → DIRECT_URL (uso de migrations)
   └─ copia connection string POOLER (6543)      → DATABASE_URL (uso de runtime)
mantenedor (máquina local) → DIRECT_URL exportada → npm run migration:run (workspace backend)
   └─ data-source.ts aplica as 7 migrations com SSL → schema criado; synchronize OFF
```

**Request em produção (proprietário autenticado):**

```
Browser → https://<frontend>.vercel.app/orcamento
   ├─ middleware.ts (auth) → sessão válida? não → /login ; sim ↓
   └─ Server Component / action → apiRequest('/lancamentos')      (core.ts, server-side)
        ├─ getSession() válido? não → 401 (não toca backend)
        └─ sim → fetch(API_URL='https://<api>.vercel.app' + '/lancamentos')
             └─ Vercel Function (backend/api/index.ts)
                  ├─ instância Nest em cache? não → bootstrap + configureApp ; sim ↓
                  ├─ CORS: origin ∈ CORS_ORIGINS? não → bloqueia
                  └─ Express → controller Nest → TypeORM (pooler 6543, SSL) → Supabase
                       └─ JSON ← ← ← resposta
```

**Deploy e rollback (mantenedor):**

```
git push (branch de produção) → Vercel build (frontend e/ou backend) → publica HTTPS
deploy com defeito → Vercel: "Promote to Production" no deploy anterior → app volta; banco intacto
```

---

## 2. Arquitetura e componentes impactados

| Componente | Caminho | Mudança |
|---|---|---|
| Config compartilhada do app Nest | `backend/src/shared/config/app-setup.ts` (novo) | `configureApp(app)`: CORS por origem (`CORS_ORIGINS`) + `ValidationPipe` (whitelist/transform) — fonte única para `main.ts` e serverless |
| Bootstrap local | `backend/src/main.ts` (editar) | Trocar `enableCors()` aberto por `configureApp(app)`; manter `app.listen(PORT)` para dev/local |
| Entrypoint serverless | `backend/api/index.ts` (novo) | `ExpressAdapter` + `configureApp` + cache de instância entre invocações; handler `(req,res)` |
| Roteamento Vercel (API) | `backend/vercel.json` (novo) | Rewrite `/(.*)` → `/api`; runtime Node; sem build de framework |
| Config TypeORM (runtime) | `backend/src/shared/config/typeorm.config.ts` (editar) | SSL em produção; `extra.max` enxuto (pool por instância serverless); `synchronize` segue `false` fora de dev |
| Data source (migrations CLI) | `backend/src/shared/config/data-source.ts` (editar) | Preferir `DIRECT_URL` (não-pooled) com fallback `DATABASE_URL`; SSL quando alvo é nuvem |
| Dependências backend | `backend/package.json` (editar) | Adicionar `express` + `@types/express` (usados pelo `ExpressAdapter` no handler) |
| Config Vercel (frontend) | `frontend/vercel.json` (novo, opcional) | Garantir framework Next.js + Root Directory `frontend` (ou configurar via painel) |
| Camada de chamada do frontend | `frontend/src/lib/api/core.ts` | **Sem código novo** — apenas `API_URL` de produção via env aponta para a API na Vercel |
| Env de exemplo | `.env.example`, `frontend/.env.local.example` (editar) | Documentar `DATABASE_URL` (pooler), `DIRECT_URL`, `DATABASE_SSL`, `DATABASE_POOL_MAX`, `CORS_ORIGINS`, `API_URL` de produção |
| Guia de deploy | `README.md` e/ou `docs/deploy.md` (novo) | Passo a passo Supabase → migrations → Vercel (front + api) → variáveis → rollback |
| Objetivo do sistema | `docs/objetivo-do-sistema.md` (editar) | Remover premissas "sem deploy público" e "execução local" |

> **Nota de runtime serverless:** cada função Vercel pode reutilizar o processo entre invocações ("warm"). Por isso
> a instância Nest e o pool TypeORM são **module-scoped e cacheados**: criar um novo `DataSource`/pool por invocação
> esgotaria o limite de conexões do Postgres (mitigado também pelo pooler do Supabase — ver EC-1/EC-2).

---

## 3. Entidades de domínio

Esta feature **não cria nem altera entidades de domínio** — o schema persistido é exatamente o das migrations
existentes (`backend/src/migrations/*`: categorias, metas, lançamentos, ocorrências excluídas, regras recorrentes,
baldes, movimentos de reserva, cotações de ativo). As "entidades" relevantes aqui são **objetos de configuração**
derivados do ambiente, não persistidos:

### 3.1. `RuntimeDbConfig` (derivado do ambiente, runtime serverless)

| Atributo | Tipo | Origem | Default |
|---|---|---|---|
| `url` | `string` | `DATABASE_URL` (string com pooler, porta 6543) | — (obrigatório em prod) |
| `ssl` | `boolean \| { rejectUnauthorized: boolean }` | `DATABASE_SSL==='true'` ou `NODE_ENV==='production'` | `false` em dev |
| `poolMax` | `number` | `DATABASE_POOL_MAX` | `1` (uma conexão por instância serverless) |
| `synchronize` | `boolean` | `NODE_ENV==='development'` | `false` (prod/nuvem) |

### 3.2. `MigrationDbConfig` (derivado do ambiente, CLI de migrations)

| Atributo | Tipo | Origem | Default |
|---|---|---|---|
| `url` | `string` | `DIRECT_URL` (conexão direta, porta 5432) com fallback `DATABASE_URL` | — (obrigatório) |
| `ssl` | `boolean \| { rejectUnauthorized: boolean }` | `DATABASE_SSL==='true'` | `false` |
| `synchronize` | `boolean` | constante | `false` (sempre) |

### 3.3. `CorsConfig` (derivado do ambiente, ambos os runtimes)

| Atributo | Tipo | Origem | Default |
|---|---|---|---|
| `origins` | `string[]` | `CORS_ORIGINS` (lista separada por vírgula) | `['*']` apenas se `NODE_ENV!=='production'` |
| `credentials` | `boolean` | constante | `true` |

- **Relacionamento:** `DATABASE_URL` (pooler) ↔ runtime das funções; `DIRECT_URL` (direto) ↔ execução de
  migrations. As duas strings apontam para o **mesmo** banco Supabase, por caminhos de conexão diferentes.

---

## 4. Contratos

Esta feature **não introduz novos endpoints REST**. Os contratos abaixo são **contratos de configuração e de
infraestrutura** (entrada/saída de cada peça nova ou alterada).

### 4.1. Entrypoint serverless — `backend/api/index.ts`

- **Runtime:** Node (Vercel Function). Não usa Edge.
- **Entrada:** request HTTP (qualquer método/rota da API existente) roteada por `vercel.json`.
- **Comportamento:**
  ```ts
  let cached: import('express').Express | undefined;

  async function getServer() {
    if (!cached) {
      const expressApp = express();
      const app = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), { logger: ['error','warn'] });
      configureApp(app);              // CORS por origem + ValidationPipe
      await app.init();               // NÃO app.listen — Vercel controla o socket
      cached = expressApp;
    }
    return cached;
  }

  export default async function handler(req, res) {
    const server = await getServer();
    server(req, res);
  }
  ```
- **Saída:** resposta do controller Nest correspondente (JSON ou binário), idêntica ao comportamento local.
- **Erros:**
  | Situação | Comportamento |
  |---|---|
  | `DATABASE_URL` ausente | bootstrap do TypeORM falha no `app.init()` → função retorna 500 com log explícito (EC-3); **não** sobe "vazia" |
  | Origem fora de `CORS_ORIGINS` | resposta sem headers CORS → navegador bloqueia (preflight 403-equivalente) |
  | Exceção de controller | filtro de exceção padrão do Nest (status mapeado do DTO/exception) — inalterado |

### 4.2. `vercel.json` (backend) — contrato de roteamento

```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }]
}
```

- **Entrada:** qualquer caminho público da API. **Saída:** sempre delegado a `api/index.ts`.
- **Build:** Vercel detecta `api/*.ts` como Node Function (sem framework). Root Directory do projeto = `backend`.

### 4.3. `configureApp(app: INestApplication): void` — contrato de configuração

- **Efeito:** aplica `app.enableCors({ origin: parseCorsOrigins(), credentials: true })` e
  `app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }))`.
- **Idempotência:** chamada uma vez por instância (no `bootstrap` local e no cache serverless).
- **Sem retorno** (configura o `app` por efeito colateral); equivalente entre os dois runtimes.

### 4.4. `buildTypeOrmConfig` (alterado) — contrato de saída (branch postgres)

```ts
{
  type: 'postgres',
  url: DATABASE_URL,
  autoLoadEntities: true,
  synchronize: NODE_ENV === 'development',           // false em produção (inalterado)
  ssl: isSsl ? { rejectUnauthorized: false } : false, // novo: TLS exigido pelo Supabase
  extra: { max: poolMax },                            // novo: pool enxuto por instância serverless
}
```

- **Pré-condição:** `DATABASE_URL` definido quando `DATABASE_TYPE=postgres` (ou inferido por presença de URL).
- **Pós-condição:** conexão TLS ao pooler do Supabase; no máximo `poolMax` conexões por instância.

### 4.5. Variáveis de ambiente — contrato por projeto

| Projeto / contexto | Variável | Obrigatória | Exemplo / nota |
|---|---|---|---|
| Backend (Vercel) | `DATABASE_URL` | sim | string **pooler** Supabase (`...pooler.supabase.com:6543/postgres`) |
| Backend (Vercel) | `DATABASE_TYPE` | sim | `postgres` |
| Backend (Vercel) | `DATABASE_SSL` | recomendado | `true` |
| Backend (Vercel) | `DATABASE_POOL_MAX` | opcional | `1` |
| Backend (Vercel) | `CORS_ORIGINS` | sim | `https://<frontend>.vercel.app` (lista por vírgula) |
| Backend (Vercel) | `NODE_ENV` | auto | `production` (definido pela Vercel) |
| Migrations (máquina do mantenedor) | `DIRECT_URL` | sim | string **direta** Supabase (`...supabase.com:5432/postgres`) |
| Migrations | `DATABASE_SSL` | recomendado | `true` |
| Frontend (Vercel) | `API_URL` | sim | `https://<backend>.vercel.app` |
| Frontend (Vercel) | `APP_PASSWORD` | sim | segredo (auth) — **nunca** `NEXT_PUBLIC_` |
| Frontend (Vercel) | `AUTH_SECRET` | sim | ≥ 32 bytes aleatórios (auth) |
| Frontend (Vercel) | `AUTH_SESSION_TTL` | opcional | `604800` |

---

## 5. Edge cases técnicos

| # | Cenário | Comportamento esperado |
|---|---|---|
| EC-1 | Esgotamento de conexões: muitas funções abrindo conexões diretas ao Postgres | Runtime usa **pooler** do Supabase (6543, PgBouncer transaction) e `extra.max=1` por instância; o pool é **cacheado** entre invocações (instância warm). Migrations usam a conexão direta, fora do pooler. (RF-004, CS-005) |
| EC-2 | Prepared statements incompatíveis com PgBouncer (modo *transaction*) | A connection string do pooler inclui `?pgbouncer=true`; o pool roda enxuto (`max=1`) e sem reuso de prepared statements entre transações. Caso surjam erros `prepared statement "S_x" already exists`, usar o **Session Pooler** do Supabase como alternativa documentada. |
| EC-3 | `DATABASE_URL` ausente/incorreta no deploy | `app.init()` falha ao conectar → função responde **500 com log explícito** no `getRuntimeLogs` da Vercel; **não** sobe uma API que devolve 500 silenciosos sem causa. (RF da observabilidade) |
| EC-4 | `synchronize` ligado em produção | `buildTypeOrmConfig` deriva `synchronize` de `NODE_ENV==='development'`; em produção é **sempre `false`**. Schema só muda por migrations executadas pelo mantenedor. (RF-005, CS-003) |
| EC-5 | SSL exigido pelo Supabase | Em produção/`DATABASE_SSL=true`, a config TypeORM passa `ssl: { rejectUnauthorized: false }`; sem isso a conexão é recusada. Migrations idem. (RF-003) |
| EC-6 | Segredo vazando para o cliente | `DATABASE_URL`, `APP_PASSWORD`, `AUTH_SECRET` ficam só em env server-side, **sem** `NEXT_PUBLIC_`; `core.ts` (server action) lê `API_URL` no servidor. Verificação: o bundle do cliente não contém os valores. (RF-008, CS-004) |
| EC-7 | CORS aberto demais | `configureApp` restringe `origin` a `CORS_ORIGINS`; origem diferente do frontend publicado é rejeitada. Sem `CORS_ORIGINS` em produção, a lista fica vazia (bloqueia tudo) em vez de cair em `*`. (RF-006, CS-004) |
| EC-8 | Migration interrompida no meio (rollback) | Migrations rodam **manualmente** pelo mantenedor (não no boot da função). Cada migration roda em transação do TypeORM; falha → `migration:revert` reverte a última. Boot serverless **nunca** dispara migrations (evita execução concorrente). (PRD §8) |
| EC-9 | Cold start | Primeira invocação após inatividade paga o bootstrap do Nest + conexão; invocações seguintes reusam a instância cacheada. Aceitável para uso pessoal; tempo "comparável ao local após warm-up". (CS-005) |
| EC-10 | Runtime em UTC | Datas/competências são tratadas por string `AAAA-MM` e formatação pt-BR no app; o fuso UTC do runtime **não** altera totais nem rótulos. (PRD §8) |
| EC-11 | Frontend e API em domínios diferentes | `API_URL` de produção aponta para a URL pública da API na Vercel; nunca `localhost:3001`. Se ausente, `core.ts` cai no fallback `localhost` → chamadas falham de forma óbvia em produção (sinal claro de env faltando). (RF-007) |
| EC-12 | Deploy defeituoso | "Promote to Production" do deploy anterior na Vercel restaura o app; o banco Supabase é externo e **não** é afetado pelo rollback de código. (RF-010, CS-006) |

---

## 6. Requisitos funcionais

- **RF-001** — O frontend Next.js **DEVE** ser implantável na Vercel a partir do diretório `frontend` do
  repositório, gerando uma URL pública HTTPS, sem mudança de código além de `API_URL` por ambiente.
- **RF-002** — O backend NestJS **DEVE** ser implantado na Vercel como função serverless via
  `backend/api/index.ts` (ExpressAdapter + instância cacheada), preservando **todas** as rotas e DTOs atuais, sem
  reescrever módulos de domínio.
- **RF-003** — A persistência **DEVE** usar o Postgres do Supabase via `DATABASE_URL`, com **SSL** habilitado em
  produção (`ssl: { rejectUnauthorized: false }`), substituindo o Postgres do Docker.
- **RF-004** — O acesso ao banco em runtime serverless **DEVE** usar o **pooler** do Supabase (transaction, 6543) e
  pool enxuto (`extra.max`, default `1`), com a instância/pool reaproveitados entre invocações.
- **RF-005** — Em produção, `synchronize` **DEVE** permanecer `false`; o schema **DEVE** evoluir apenas por
  **migrations** do TypeORM executadas pelo mantenedor contra o banco Supabase via conexão direta (`DIRECT_URL`).
- **RF-006** — A API **DEVE** restringir CORS às origens de `CORS_ORIGINS` (URL do frontend de produção), em vez de
  `enableCors()` aberto; em produção sem `CORS_ORIGINS`, **não** deve cair em `*`.
- **RF-007** — As server actions do frontend **DEVEM** chamar a API pela `API_URL` de produção (URL da API na
  Vercel), configurável por variável de ambiente, sem `localhost` hardcoded.
- **RF-008** — Segredos (`DATABASE_URL`, `APP_PASSWORD`, `AUTH_SECRET`) **DEVEM** ser configurados como variáveis de
  ambiente na Vercel/Supabase e **nunca** versionados nem expostos ao cliente (sem `NEXT_PUBLIC_`).
- **RF-009** — O app público **DEVE** exigir a [autenticação por senha](../autenticacao-login/spec_autenticacao-login.md)
  antes de servir qualquer dado (gate já implementado em `middleware.ts` + `core.ts`).
- **RF-010** — Um deploy defeituoso **DEVERIA** poder ser revertido (promover deploy anterior na Vercel) sem perda
  de dados no banco Supabase.
- **RF-011** — A documentação (`README` e/ou `docs/deploy.md`) **DEVERIA** descrever o passo a passo: criar Supabase,
  rodar migrations, configurar variáveis e deploy na Vercel (front + API), e rollback.
- **RF-012** — O sistema **PODE** manter o caminho de execução **local** (Docker Postgres ou SQLite) intacto,
  alternando apenas por variáveis de ambiente, para desenvolvimento.

---

## 7. Requisitos não-funcionais

### 7.1. Segurança
- Segredos exclusivamente em env server-side; **nenhum** com `NEXT_PUBLIC_`; verificação de ausência no bundle do
  cliente (CS-004).
- CORS restrito por origem de produção; falha **fechada** (lista vazia bloqueia, não abre) quando `CORS_ORIGINS`
  ausente em produção.
- TLS obrigatório na conexão com o Supabase.
- Backend público fica atrás do gate de senha do frontend; o backend em si não expõe dados sem a sessão validada no
  choke point `core.ts` (a API permanece a fonte, mas o acesso parte sempre do frontend autenticado).

### 7.2. Performance
- Pool enxuto + pooler do Supabase evitam esgotamento de conexões sob uso pessoal (CS-005).
- Instância Nest e pool cacheados entre invocações reduzem custo após o warm-up; cold start aceitável para um
  usuário (EC-9).

### 7.3. Observabilidade
- Falha de conexão/configuração no boot serverless deve aparecer em **log explícito** (Vercel Runtime Logs), não em
  500 silencioso (EC-3).
- `console.error` claro quando `DATABASE_URL`/`CORS_ORIGINS` ausentes em produção.
- Não logar a `DATABASE_URL` completa nem segredos.

### 7.4. Compatibilidade
- O mesmo código roda local (Docker/SQLite, CORS relaxado, sem SSL) e na nuvem (Supabase, CORS restrito, SSL),
  alternando **apenas por variáveis de ambiente** (RF-012).
- Node ≥ 20 (engines do monorepo) — compatível com o runtime Node da Vercel.

---

## 8. Estratégia de testes

- **Unitários (`buildTypeOrmConfig`):** com `NODE_ENV=production` + `DATABASE_SSL=true` → retorna `ssl` setado,
  `synchronize=false`, `extra.max` aplicado; com `development` → `synchronize=true`, sem SSL.
- **Unitários (`parseCorsOrigins`):** lista por vírgula vira array aparado; vazio em produção → `[]` (bloqueia),
  não `['*']`; em dev → `['*']`.
- **Integração (entrypoint serverless, local):** invocar o handler `api/index.ts` com um request fake (supertest
  sobre o Express cacheado) → uma rota existente (ex.: `GET /baldes`) responde igual ao `main.ts`; segunda
  invocação **não** recria a instância (cache).
- **Integração (migrations contra Supabase):** rodar `migration:run` com `DIRECT_URL` num banco vazio → todas as 7
  migrations aplicam; rodar de novo → idempotente (nenhuma alteração) (CS-003).
- **Smoke de deploy (manual):** após publicar, `GET https://<api>.vercel.app/baldes` autenticado responde 200; o
  frontend autenticado lê e grava nas 7 áreas (CS-001).
- **Verificação de segredos (manual/CI leve):** `grep` no bundle `frontend/.next` por `APP_PASSWORD`/`AUTH_SECRET`/
  trecho da `DATABASE_URL` → **nenhum** match (CS-004).

> O backend já possui Jest configurado (`backend` workspace). O frontend não tem runner; testes do frontend ficam
> como verificação manual dos critérios de sucesso. O aceite mínimo é CS-001..CS-006 do PRD.

---

## 9. Breakdown de tarefas

Cada item cabe em **1 PR** (exceto tarefas de operação, marcadas **[ops]** — execução manual do mantenedor, sem
código). Dependências indicadas inline.

- [x] **T1 — Extrair `configureApp` e restringir CORS por env.**
  Criar `backend/src/shared/config/app-setup.ts` com `configureApp(app)` (CORS via `CORS_ORIGINS` + `credentials`,
  `ValidationPipe`) e `parseCorsOrigins()` (fecha em produção sem env). Editar
  [`main.ts`](../../../backend/src/main.ts) para chamar `configureApp(app)` em vez de `enableCors()` aberto,
  mantendo `app.listen(PORT)` para local. _Sem dependências._

- [x] **T2 — SSL + pool no `buildTypeOrmConfig`.**
  Editar [`typeorm.config.ts`](../../../backend/src/shared/config/typeorm.config.ts): branch postgres ganha
  `ssl` (quando `DATABASE_SSL==='true'` ou `NODE_ENV==='production'`) e `extra.max` (`DATABASE_POOL_MAX`, default
  `1`); `synchronize` segue `NODE_ENV==='development'`. _Sem dependências._

- [x] **T3 — SSL + `DIRECT_URL` no data source de migrations.**
  Editar [`data-source.ts`](../../../backend/src/shared/config/data-source.ts): `url` preferindo `DIRECT_URL` com
  fallback `DATABASE_URL`; `ssl` quando `DATABASE_SSL==='true'`. Mantém `synchronize:false`. _Sem dependências._

- [x] **T4 — Entrypoint serverless do backend + roteamento Vercel.**
  Adicionar `express`/`@types/express` ao `backend/package.json`. Criar `backend/api/index.ts` (ExpressAdapter +
  `configureApp` + cache de instância + handler) e `backend/vercel.json` (rewrite `/(.*)`→`/api`). _Depende de: T1._

- [x] **T5 — Testes do entrypoint serverless e da config.**
  Unitários de `parseCorsOrigins` e do branch postgres de `buildTypeOrmConfig`; integração (supertest) batendo numa
  rota existente via handler cacheado e checando que a segunda invocação reusa a instância. _Depende de: T2, T4._

- [x] **T6 — Documentar variáveis de ambiente de produção.**
  Editar [`.env.example`](../../../.env.example) e
  [`frontend/.env.local.example`](../../../frontend/.env.local.example): adicionar `DATABASE_URL` (pooler),
  `DIRECT_URL`, `DATABASE_SSL`, `DATABASE_POOL_MAX`, `CORS_ORIGINS` e `API_URL` de produção, com comentários (sem
  valores reais). _Depende de: T1, T2, T3._

- [x] **T7 — Guia de deploy e rollback (`docs/deploy.md` + README).**
  Passo a passo: criar projeto Supabase, copiar strings (pooler vs direta), rodar `migration:run` com `DIRECT_URL`,
  criar 2 projetos Vercel (Root Directory `frontend` e `backend`), configurar env por projeto, deploy por push e
  rollback ("Promote to Production"). _Depende de: T4, T6._

- [x] **T8 — [ops] Provisionar Supabase e aplicar migrations.**
  Criar projeto Supabase; exportar `DIRECT_URL` + `DATABASE_SSL=true`; `npm run migration:run -w backend`; conferir
  as 7 migrations e idempotência (CS-003). _Depende de: T3, T7._
  **Feito (2026-06-04):** projeto `financas-pessoais` (ref `ckfrxfbfjpjfpeqkiufc`, região `sa-east-1`) criado via
  conector. As migrations assumem uma tabela base `lancamentos` pré-existente (originalmente criada por `synchronize`
  no dev) que nenhuma migration cria — então o schema completo (base `lancamentos` + DDL das 7 migrations, backfills
  são no-op em banco vazio) foi aplicado direto via `apply_migration`. 10 tabelas criadas (0 linhas). **RLS habilitado**
  em todas as tabelas para bloquear o acesso público anon/PostgREST; o backend conecta como role `postgres` (BYPASSRLS)
  e não é afetado.

- [ ] **T9 — [ops] Configurar e publicar os 2 projetos Vercel.**
  Projeto frontend (Root `frontend`, env `API_URL`, `APP_PASSWORD`, `AUTH_SECRET`, `AUTH_SESSION_TTL`); projeto
  backend (Root `backend`, env `DATABASE_URL` pooler, `DATABASE_TYPE=postgres`, `DATABASE_SSL`, `DATABASE_POOL_MAX`,
  `CORS_ORIGINS`). Deploy de ambos. Ajustar `API_URL`/`CORS_ORIGINS` com as URLs finais. _Depende de: T4, T8._

- [ ] **T10 — [ops] Verificar critérios de sucesso e segredos.**
  Validar CS-001..CS-006: login + leitura/escrita nas 7 áreas; cross-device; `synchronize` off; **0** segredos no
  bundle (`grep` em `frontend/.next`); CORS rejeita origem estranha; rollback restaura sem perder dados.
  _Depende de: T9._

- [ ] **T11 — Atualizar `docs/objetivo-do-sistema.md`.**
  Remover as premissas "sem deploy público no MVP" e "execução local"; referenciar este deploy. _Depende de: T10._

---

## 10. Decisões e premissas técnicas

- **[Decisão] Dois projetos Vercel (frontend e backend separados).** O PRD §5 já trata "frontend e API em domínios
  diferentes" e parametriza `API_URL`; manter projetos distintos evita misturar o roteamento Next.js com o handler
  Nest e mantém os contratos REST intactos. Alternativa (Nest dentro de rotas `app/api` do Next) foi descartada por
  exigir reescrever o backend.
- **[Decisão] `ExpressAdapter` com instância cacheada no entrypoint serverless.** O Nest já usa
  `@nestjs/platform-express`; instanciar o app sobre um Express explícito e cacheá-lo entre invocações é o padrão
  para rodar Nest na Vercel sem `app.listen`, reaproveitando processo warm e evitando recriar o pool a cada request.
- **[Decisão] Duas connection strings: pooler para runtime, direta para migrations.** `DATABASE_URL` (PgBouncer
  6543) para as funções (RF-004); `DIRECT_URL` (5432) para migrations, que precisam de sessão estável e prepared
  statements. Reflete o PRD §8.
- **[Decisão] CORS fecha em produção sem `CORS_ORIGINS`.** Em vez de cair em `*`, a lista vazia bloqueia — falha
  segura (EC-7), satisfazendo RF-006/CS-004.
- **[Decisão] SSL via `rejectUnauthorized: false`.** O Supabase exige TLS; usa-se `rejectUnauthorized:false` (padrão
  amplamente adotado com o pooler, que apresenta certificado próprio) para conectar sem distribuir CA custom. Pode
  ser endurecido depois com a CA do Supabase.
- **[Premissa] Supabase só como Postgres.** Sem Auth, Storage, PostgREST ou RLS — o NestJS continua a única camada
  de dados (PRD §8).
- **[Premissa] Migrations manuais e idempotentes.** O mantenedor roda `migration:run` sob demanda; o boot das
  funções **nunca** dispara migrations (evita concorrência em serverless) (EC-8).
- **[Premissa] `prepareThreshold`/prepared statements no pooler transaction.** Assume-se `?pgbouncer=true` +
  `max=1`; se aparecerem conflitos de prepared statement, o **Session Pooler** do Supabase é o fallback documentado
  (EC-2) — sem mudança de código, só de connection string.
- **[Premissa] Plano gratuito Vercel + Supabase suficiente** para um usuário (PRD §8).
- **[Premissa] Autenticação já implementada e bloqueante.** A publicação só ocorre com o gate de senha ativo
  (RF-009, [spec de auth](../autenticacao-login/spec_autenticacao-login.md)).
- **[Premissa] Runtime em UTC.** Datas por competência `AAAA-MM` e formatação pt-BR no app tornam o fuso do servidor
  irrelevante para os resultados (EC-10).

---

## 11. Referências

- PRD: [prd_deploy-nuvem-vercel-supabase.md](./prd_deploy-nuvem-vercel-supabase.md)
- Dependência (auth): [spec_autenticacao-login.md](../autenticacao-login/spec_autenticacao-login.md)
- Bootstrap atual: [`backend/src/main.ts`](../../../backend/src/main.ts)
- Config TypeORM (runtime): [`backend/src/shared/config/typeorm.config.ts`](../../../backend/src/shared/config/typeorm.config.ts)
- Data source (migrations): [`backend/src/shared/config/data-source.ts`](../../../backend/src/shared/config/data-source.ts)
- Migrations: `backend/src/migrations/*`
- Choke point de API (frontend): [`frontend/src/lib/api/core.ts`](../../../frontend/src/lib/api/core.ts)
- Envs: [`.env.example`](../../../.env.example), [`frontend/.env.local.example`](../../../frontend/.env.local.example)
- Objetivo do sistema (premissa revogada): [`docs/objetivo-do-sistema.md`](../../../docs/objetivo-do-sistema.md)
