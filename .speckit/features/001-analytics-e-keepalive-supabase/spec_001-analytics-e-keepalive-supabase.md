# Feature Spec — Analytics de uso e keep-alive do banco (anti-pausa do Supabase)

- **Projeto:** financas-pessoais
- **Número:** 001
- **PRD:** [prd_001-analytics-e-keepalive-supabase.md](./prd_001-analytics-e-keepalive-supabase.md)
- **Status:** Proposto
- **Stack alvo:** Frontend Next.js 14 (App Router) + Backend NestJS serverless (Vercel) + Postgres (Supabase) + TypeORM

## 1. Resumo técnico da solução

Duas mudanças independentes, ambas operacionais:

**(A) Analytics — frontend.** Adicionar o pacote `@vercel/analytics` ao workspace `frontend` e montar o componente
`<Analytics />` (client component) uma única vez dentro do `<body>` do layout raiz
([`frontend/src/app/layout.tsx`](../../../frontend/src/app/layout.tsx)). O componente injeta o script de Web Analytics
da Vercel, que coleta page views anônimos automaticamente em produção e fica em modo "debug" (sem envio) em
desenvolvimento. Nenhuma rota, server action ou lógica existente é alterada.

**(B) Keep-alive — backend + Vercel Cron.** Criar um novo módulo NestJS `HealthModule` com um endpoint
`GET /health/keepalive` que injeta o `DataSource` do TypeORM e executa `SELECT 1`. Esse endpoint:
- é **isento** do `ApiKeyGuard` global (a chamada vem do agendador da Vercel, sem o header `x-api-key`);
- é protegido por um segredo de cron (`CRON_SECRET`) que a Vercel envia automaticamente no header
  `Authorization: Bearer <CRON_SECRET>`, evitando que terceiros martelem o endpoint e o pool de conexões.

Um **Vercel Cron Job** declarado em [`backend/vercel.json`](../../../backend/vercel.json) invoca esse endpoint
**1×/dia**. A consulta registra atividade no Supabase, reiniciando o contador de inatividade e evitando a pausa
automática do projeto no plano gratuito.

### Encaixe na arquitetura existente

- O backend é hexagonal (domain/application/infrastructure/presentation por módulo). O keep-alive é puramente
  operacional/infra (um health check), **sem regra de domínio** — por isso fica num módulo enxuto `HealthModule` com
  apenas um controller, sem use-cases nem portas/adapters, registrado em
  [`app.module.ts`](../../../backend/src/app.module.ts) ao lado dos demais módulos.
- O guard global é instanciado por `new ApiKeyGuard()` em
  [`app-setup.ts`](../../../backend/src/shared/config/app-setup.ts) (sem DI/Reflector). Para isentar o health sem
  refatorar para `APP_GUARD`, o guard ganha um **allowlist de paths** (prefixo `/health`), checado por
  `request.path` antes de exigir a API key.
- O entrypoint serverless [`api/index.ts`](../../../backend/api/index.ts) já cacheia a instância Nest e o pool
  TypeORM entre invocações "warm" — o keep-alive reaproveita esse mesmo pool, sem abrir conexões novas a cada chamada.

## 2. Fluxo técnico

### Fluxo B — Keep-alive (sequência)

```
[Vercel Cron Scheduler]  (1×/dia, ex.: 09:00 UTC)
        │  GET /health/keepalive
        │  Authorization: Bearer <CRON_SECRET>
        ▼
[Vercel rewrite "/(.*)" → "/api"]  (req.url preservado = /health/keepalive)
        ▼
[api/index.ts handler]  → bootstrapServer() (instância Nest cacheada)
        ▼
[ApiKeyGuard.canActivate]
        │  request.path começa com "/health" ? → SIM → return true (bypass da API key)
        ▼
[HealthController.keepalive]
        │  CRON_SECRET definido?
        │     ├─ sim e header Authorization != "Bearer <CRON_SECRET>" → 401
        │     └─ ok → segue
        ▼
[DataSource.query('SELECT 1')]  (pool TypeORM → pooler Supabase 6543)
        │     ├─ sucesso → 200 { status: 'ok', db: 'up', timestamp }
        │     └─ erro    → log + 503 { status: 'error', db: 'down', timestamp }
        ▼
[Supabase] registra atividade → contador de inatividade reinicia
```

### Fluxo A — Analytics (estados)

```
Build do frontend → bundle inclui <Analytics />
        ▼
Runtime no browser (produção Vercel):
   navegação de rota → @vercel/analytics envia page view anônimo → painel Web Analytics
Runtime local (next dev):
   navegação de rota → componente em modo debug → NÃO envia evento real
```

## 3. Entidades de domínio

Esta feature **não introduz entidades de domínio nem tabelas novas**. O keep-alive executa uma consulta constante
(`SELECT 1`) que não lê nem escreve nenhuma entidade existente.

Estruturas (DTOs/contratos) introduzidas:

| Estrutura | Campo | Tipo | Descrição |
|---|---|---|---|
| `KeepAliveResponse` | `status` | `'ok' \| 'error'` | Resultado lógico da verificação |
| | `db` | `'up' \| 'down'` | Estado da conexão com o Postgres |
| | `timestamp` | `string` (ISO 8601) | Momento da verificação, em UTC |

`KeepAliveResponse` é um contrato HTTP local do `HealthModule` (não precisa ir para o pacote `shared`, pois nenhum
cliente TypeScript o consome — quem chama é o agendador da Vercel).

## 4. Contratos de API

### 4.1 `GET /health/keepalive`

Endpoint de keep-alive chamado pelo Vercel Cron. Isento do `ApiKeyGuard`; protegido pelo `CRON_SECRET`.

**Request**
- Método/rota: `GET /health/keepalive`
- Headers:
  - `Authorization: Bearer <CRON_SECRET>` — enviado automaticamente pela Vercel quando `CRON_SECRET` está definido no
    projeto. Obrigatório **somente** quando `CRON_SECRET` está definido no ambiente.
- Body: nenhum.

**Responses**

| Status | Quando | Body |
|---|---|---|
| `200 OK` | Consulta `SELECT 1` retornou com sucesso | `{ "status": "ok", "db": "up", "timestamp": "2026-06-16T09:00:00.000Z" }` |
| `401 Unauthorized` | `CRON_SECRET` definido e header `Authorization` ausente/divergente | `{ "statusCode": 401, "message": "Cron secret inválido ou ausente." }` |
| `503 Service Unavailable` | Consulta ao banco falhou (timeout, conexão recusada, banco pausado) | `{ "status": "error", "db": "down", "timestamp": "2026-06-16T09:00:00.000Z" }` |

Notas:
- O endpoint **nunca** retorna dado financeiro — apenas o envelope de saúde acima.
- `503` é deliberado para que o painel da Vercel marque a execução do cron como falha (visível em logs/alertas),
  sem derrubar nada para usuários do app.

### 4.2 Configuração do Vercel Cron — `backend/vercel.json`

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "rewrites": [{ "source": "/(.*)", "destination": "/api" }],
  "crons": [{ "path": "/health/keepalive", "schedule": "0 9 * * *" }]
}
```

- `schedule: "0 9 * * *"` → todo dia às 09:00 UTC (1×/dia, dentro do limite do plano Hobby).
- O `path` passa pelo rewrite catch-all e chega ao handler serverless, que entrega ao Nest com `req.url` preservado.

### 4.3 Integração de analytics — `frontend/src/app/layout.tsx`

```tsx
import { Analytics } from '@vercel/analytics/react';
// ...dentro de <body>, após <Toaster />:
<Analytics />
```

- Sem props: usa o modo automático (produção envia, dev fica em debug).
- Não há endpoint próprio — o componente fala direto com a coleta da Vercel.

## 5. Edge cases técnicos

- **EC-1 — Banco já pausado quando o cron roda:** `SELECT 1` falha (conexão recusada). O endpoint responde `503` e
  loga o erro; **não** tenta reativar o projeto (impossível via query). A primeira reativação pós-pausa continua
  manual. Comportamento esperado: falha registrada, app dos usuários intacto.
- **EC-2 — Catch-all rewrite engole o path do cron:** o rewrite `"/(.*)" → "/api"` é o destino correto (a função
  serverless), e `req.url` preserva `/health/keepalive`; o Nest roteia normalmente. Se o módulo `HealthModule` não
  estiver registrado, a rota dá `404` — coberto por teste de rota.
- **EC-3 — `ApiKeyGuard` bloqueando o cron:** o agendador não envia `x-api-key`. Sem o allowlist de `/health`, o
  endpoint retornaria `401` e o keep-alive nunca rodaria. O guard deve liberar o prefixo `/health` **antes** de checar
  a API key. Teste cobre: requisição a `/health/keepalive` sem `x-api-key` passa pelo guard.
- **EC-4 — Endpoint público sendo martelado por terceiros:** sem proteção, qualquer um poderia abrir conexões no
  pooler do Supabase chamando o health repetidamente. Mitigação: `CRON_SECRET` obrigatório quando definido (401 sem o
  Bearer correto). Em dev local (sem `CRON_SECRET`), a checagem é relaxada para não atrapalhar.
- **EC-5 — Esgotamento do pooler em invocação "cold":** uma invocação fria recria o pool; o keep-alive deve usar o
  `DataSource` já gerenciado pelo `TypeOrmModule` (injetado), nunca abrir um `DataSource` novo por request. Reusa o
  cache de [`api/index.ts`](../../../backend/api/index.ts).
- **EC-6 — Falha transitória de rede no horário agendado:** uma execução que estoura timeout retorna `503` e **não**
  dispara retry interno (evita rajada de conexões). A próxima execução agendada (24h depois) segue normal — ainda
  dentro da janela de ~7 dias de inatividade do Supabase.
- **EC-7 — Mismatch de hidratação do `<Analytics />`:** o `layout.tsx` já roda um script inline de tema com
  `suppressHydrationWarning` no `<html>`. O `<Analytics />` é client component e deve ser montado dentro do `<body>`
  (não no `<head>`), sem alterar a árvore SSR — evita warning de hidratação.
- **EC-8 — Analytics enviando eventos em dev/local:** sem cuidado, métricas de produção seriam poluídas por navegação
  local. O componente da Vercel detecta o ambiente automaticamente (debug em dev); deve-se confiar nesse default e
  **não** forçar `mode="production"`.
- **EC-9 — `CRON_SECRET` definido no código mas ausente no ambiente Vercel:** a Vercel só injeta o header
  `Authorization` quando a env existe no projeto. Se o controller exige o segredo mas a env não foi configurada na
  Vercel, o próprio cron tomaria `401`. Decisão: o controller só exige o Bearer **se** `process.env.CRON_SECRET`
  estiver definido — alinhando a exigência à presença real da env (mesmo padrão fail-open-em-dev do `ApiKeyGuard`).

## 6. Requisitos funcionais

- **RF-001** — O workspace `frontend` **DEVE** declarar `@vercel/analytics` em `dependencies` e tê-lo instalado no
  lockfile do monorepo.
- **RF-002** — O layout raiz **DEVE** renderizar `<Analytics />` exatamente uma vez, dentro do `<body>`, cobrindo
  todas as rotas do App Router.
- **RF-003** — O backend **DEVE** expor `GET /health/keepalive` que executa `SELECT 1` via `DataSource` injetado e
  responde `200` com `{ status, db, timestamp }` em caso de sucesso.
- **RF-004** — O `ApiKeyGuard` **DEVE** liberar (bypass) qualquer rota com prefixo `/health` sem exigir o header
  `x-api-key`, preservando a exigência para todas as demais rotas.
- **RF-005** — Quando `CRON_SECRET` estiver definido no ambiente, o endpoint de keep-alive **DEVE** exigir
  `Authorization: Bearer <CRON_SECRET>` e responder `401` quando ausente/divergente; quando a env não estiver
  definida (dev local), **DEVERIA** liberar a chamada.
- **RF-006** — O `backend/vercel.json` **DEVE** declarar um bloco `crons` apontando para `/health/keepalive` com
  agendamento de no máximo 1×/dia (`"0 9 * * *"`).
- **RF-007** — Uma falha na consulta de keep-alive **DEVE** ser registrada via logger do Nest e responder `503`, sem
  lançar exceção não tratada que afete a instância serverless.
- **RF-008** — O endpoint de keep-alive **NÃO DEVE** retornar nenhum dado de domínio (lançamentos, reservas, etc.),
  apenas o envelope de saúde.
- **RF-009** — As variáveis novas (`CRON_SECRET`) **DEVERIAM** ser documentadas em
  [`backend/.env.example`](../../../backend) (ou equivalente) e configuradas no projeto backend da Vercel.

## 7. Requisitos não-funcionais

- **Performance:** o keep-alive deve completar em ≤ 2 s em invocação "warm"; usa uma única query trivial e reaproveita
  o pool TypeORM existente. Não abre conexões adicionais por request.
- **Custo/cota:** cadência diária mantém invocações da Vercel e do pooler Supabase desprezíveis; não reduzir o
  intervalo para minutos sem necessidade.
- **Segurança:** endpoint sem dados sensíveis; protegido por `CRON_SECRET` em produção; isenção do guard limitada ao
  prefixo `/health` (não amplia a superfície das rotas de domínio). Analytics da Vercel é cookieless/anônimo.
- **Observabilidade:** sucesso/falha do keep-alive visível nos *runtime logs* da Vercel (projeto backend) e no painel
  de Cron Jobs (histórico de execuções). Web Analytics visível no painel do projeto frontend.
- **Compatibilidade:** nenhuma mudança em rotas, server actions, schema ou contratos `shared` existentes; features
  atuais permanecem idênticas.

## 8. Estratégia de testes

- **Unitário — `ApiKeyGuard` (allowlist):** estender
  [`api-key.guard`](../../../backend/src/shared/auth/api-key.guard.ts) com testes: `(a)` `/health/keepalive` sem
  `x-api-key` → `canActivate` retorna `true` mesmo com `API_KEY` definida; `(b)` rota de domínio sem header continua
  `401`.
- **Unitário — `HealthController`:** mock do `DataSource`. Casos: `SELECT 1` ok → `200 { status: 'ok', db: 'up' }`;
  query lança → `503 { status: 'error', db: 'down' }`; com `CRON_SECRET` setado e Bearer errado → `401`; com
  `CRON_SECRET` ausente → segue sem exigir Bearer.
- **Integração — rota:** subir o app Nest de teste (padrão dos `*.spec.ts` existentes) e bater em `/health/keepalive`
  garantindo que o `HealthModule` está roteado (não `404`).
- **Frontend:** verificação manual + smoke test de build (`npm run build` no frontend não quebra com `<Analytics />`);
  o pacote não tem lógica testável de unidade relevante aqui. Vitest existente deve continuar verde.
- **Manual/produção:** confirmar no painel da Vercel que (1) o Cron Job aparece e executa com `200`; (2) Web Analytics
  registra page views após navegação real.

## 9. Decisões técnicas e premissas

- **D-1 — Módulo `HealthModule` enxuto (sem hexágono):** keep-alive é infra, não domínio; não há use-case nem porta.
  Um controller + registro no `AppModule` bastam. **[Decisão]**
- **D-2 — Allowlist por path no guard, sem refatorar para `APP_GUARD`:** o guard é criado por `new ApiKeyGuard()` em
  `app-setup.ts`; introduzir `Reflector`/metadata exigiria migrar para provider DI. Optou-se pelo allowlist de
  prefixo `/health` (menor mudança, isolado). **[Decisão]**
- **D-3 — Proteção via `CRON_SECRET` + header `Authorization: Bearer`:** segue o mecanismo nativo de cron da Vercel
  (injeta esse header automaticamente). Exigência condicionada à env existir, espelhando o fail-open-em-dev do
  `ApiKeyGuard`. **[Decisão]**
- **D-4 — `SELECT 1` via `DataSource` injetado:** consulta mais barata possível, sem tocar entidades; reusa o pool.
  Não cria `DataSource` próprio (evita esgotar o pooler). **[Decisão]**
- **D-5 — Agendamento diário às 09:00 UTC:** 1×/dia respeita o limite do plano Hobby e dá folga enorme frente à
  janela de ~7 dias do Supabase; horário arbitrário de baixa relevância. **[Premissa]**
- **D-6 — `503` (e não `200`) em falha de banco:** torna a falha visível no painel de cron da Vercel sem afetar
  usuários. **[Decisão]**
- **D-7 — Import `@vercel/analytics/next`:** com `@vercel/analytics@^2`, o entrypoint recomendado para Next.js App
  Router é `/next` (e não `/react`); `<Analytics />` montado dentro do `<body>`. Speed Insights fica fora (PRD).
  **[Decisão — ajuste na execução: a v2 instalada expõe o entrypoint `/next`]**
- **D-8 — Sem entrada em `shared`:** `KeepAliveResponse` é contrato HTTP interno do backend; nenhum cliente TS o
  consome. **[Decisão]**

## 10. Breakdown de tarefas

> Cada item cabe em 1 PR. Dependências indicadas inline.

**Frontend (independente do backend):**
- [x] **T1 — Instalar `@vercel/analytics` no frontend.** Adicionar a dep em
  [`frontend/package.json`](../../../frontend/package.json) e rodar `npm install` na raiz do monorepo (atualiza o
  lockfile). _Sem dependências._
- [x] **T2 — Montar `<Analytics />` no layout raiz.** Importar de `@vercel/analytics/next` (v2) e renderizar dentro do
  `<body>` em [`frontend/src/app/layout.tsx`](../../../frontend/src/app/layout.tsx). Garantir `npm run build` verde.
  _Depende de T1._

**Backend — keep-alive:**
- [x] **T3 — Criar `HealthModule` + `HealthController`.** Novo módulo em `backend/src/modules/health/` com
  `GET /health/keepalive`: injeta `DataSource` (`@InjectDataSource`), executa `SELECT 1`, retorna
  `{ status, db, timestamp }`; mapeia falha de query → `503`. _Sem dependências de outras tasks._
- [x] **T4 — Proteger o endpoint com `CRON_SECRET`.** No controller, se `process.env.CRON_SECRET` definido, validar
  `Authorization: Bearer <CRON_SECRET>` → `401` caso contrário. _Depende de T3._
- [x] **T5 — Registrar `HealthModule` no `AppModule`.** Adicionar o import em
  [`app.module.ts`](../../../backend/src/app.module.ts). _Depende de T3._
- [x] **T6 — Isentar `/health` no `ApiKeyGuard`.** Em
  [`api-key.guard.ts`](../../../backend/src/shared/auth/api-key.guard.ts), retornar `true` quando
  `request.path` começar com `/health`, antes da checagem de `x-api-key`. _Pode ir junto com ou após T3._

**Backend — agendamento:**
- [x] **T7 — Declarar o Vercel Cron.** Adicionar o bloco `crons` em
  [`backend/vercel.json`](../../../backend/vercel.json) apontando para `/health/keepalive` com `"0 9 * * *"`.
  _Depende de T3+T5+T6 (endpoint precisa existir e responder)._

**Configuração & testes:**
- [x] **T8 — Documentar `CRON_SECRET`.** Adicionar a variável ao `.env.example` do backend e anotar no docs/deploy que
  ela deve ser configurada no projeto backend da Vercel (e o Web Analytics ligado no projeto frontend). _Depende de T4._
- [x] **T9 — Testes do guard e do controller.** Specs cobrindo: bypass de `/health` no guard; `200`/`503`/`401` do
  keep-alive; rota não dá `404`. _Depende de T4+T5+T6._

**Pós-deploy (manual, fora de PR):**
- [ ] **T10 — Habilitar Web Analytics** no projeto frontend e **definir `CRON_SECRET`** no projeto backend pelo
  dashboard da Vercel; validar 1ª execução do cron e os primeiros page views. _Depende de T7+T8 publicados._
