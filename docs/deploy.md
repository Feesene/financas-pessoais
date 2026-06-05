# Guia de deploy — Vercel + Supabase

Publica o **financas-pessoais** na nuvem: frontend Next.js e backend NestJS (funções serverless) na **Vercel**, e
PostgreSQL gerenciado no **Supabase**. Spec técnica: [`spec_deploy-nuvem-vercel-supabase.md`](../.speckit/features/deploy-nuvem-vercel-supabase/spec_deploy-nuvem-vercel-supabase.md).

> **Pré-requisito bloqueante:** a [autenticação por senha](../.speckit/features/autenticacao-login/spec_autenticacao-login.md)
> precisa estar ativa (`APP_PASSWORD`/`AUTH_SECRET`). O app público só deve subir com o gate de login.

## Arquitetura na nuvem

```
Browser ─HTTPS─> Frontend Next.js (Vercel projeto A)
                    └─ server actions ─> API NestJS (Vercel projeto B, serverless)
                                            └─ TypeORM (pooler 6543, SSL) ─> Postgres (Supabase)
Migrations (máquina do mantenedor) ─ conexão direta 5432 ─> Postgres (Supabase)
```

Frontend e backend são **dois projetos Vercel separados** (domínios diferentes). O Supabase é usado **apenas como
Postgres** (sem Auth/Storage/RLS).

---

## 1. Provisionar o Supabase

1. Crie um projeto em <https://supabase.com> e defina a senha do banco.
2. Em **Project Settings → Database → Connection string**, copie as duas strings:
   - **Transaction pooler** (porta `6543`) → será a `DATABASE_URL` (runtime serverless). Acrescente `?pgbouncer=true`.
   - **Direct connection** (porta `5432`) → será a `DIRECT_URL` (migrations).

## 2. Aplicar as migrations (uma vez, e a cada nova migration)

Rode da **sua máquina** apontando para a conexão **direta** (não o pooler):

```bash
# PowerShell
$env:DIRECT_URL = "postgresql://postgres.<ref>:<senha>@aws-0-<regiao>.pooler.supabase.com:5432/postgres"
$env:DATABASE_SSL = "true"
npm run migration:run -w backend
```

```bash
# bash
DIRECT_URL="postgresql://...:5432/postgres" DATABASE_SSL=true npm run migration:run -w backend
```

- Cria as 7 tabelas/índices do schema. `synchronize` permanece **desligado**.
- Rodar de novo é **idempotente** (nenhuma alteração destrutiva).
- Para reverter a última migration: `npm run migration:revert -w backend`.

## 3. Deploy do backend (API NestJS serverless)

1. Na Vercel, **New Project** a partir do repositório; **Root Directory = `backend`**.
2. O [`backend/vercel.json`](../backend/vercel.json) roteia `/(.*)` → `/api` (handler em
   [`backend/api/index.ts`](../backend/api/index.ts)). Sem framework preset.
3. Configure as **Environment Variables** (Production):

   | Variável | Valor |
   |---|---|
   | `DATABASE_TYPE` | `postgres` |
   | `DATABASE_URL` | string do **pooler** (6543, com `?pgbouncer=true`) |
   | `DATABASE_SSL` | `true` |
   | `DATABASE_POOL_MAX` | `1` |
   | `CORS_ORIGINS` | `https://<frontend>.vercel.app` (preencha após o passo 4) |
   | `API_KEY` | segredo forte (mesmo valor no frontend) — exige `x-api-key` nas chamadas |

   `NODE_ENV=production` é definido automaticamente pela Vercel.
4. Deploy. Anote a URL pública da API: `https://<backend>.vercel.app`.

## 4. Deploy do frontend (Next.js)

1. Novo projeto Vercel; **Root Directory = `frontend`** (preset Next.js detectado).
2. Environment Variables (Production):

   | Variável | Valor |
   |---|---|
   | `API_URL` | `https://<backend>.vercel.app` (da etapa 3) |
   | `APP_PASSWORD` | senha de acesso (segredo) |
   | `AUTH_SECRET` | ≥ 32 bytes aleatórios |
   | `AUTH_SESSION_TTL` | `604800` (opcional) |
   | `API_KEY` | mesmo segredo definido no backend (enviado no header `x-api-key`) |

   > Segredos **nunca** com prefixo `NEXT_PUBLIC_`. Não defina `NEXT_PUBLIC_API_URL` em produção.
3. Deploy. Anote `https://<frontend>.vercel.app`.
4. Volte ao **projeto do backend** e ajuste `CORS_ORIGINS` para essa URL; redeploy do backend.

## 4.1 Proteção de acesso (chave de API)

A Vercel liga **Deployment Protection (Vercel Authentication)** por padrão, o que bloqueia até a tela de login. Para
esta arquitetura:

- **Frontend:** Deployment Protection **desligada** (Settings → Deployment Protection → Vercel Authentication →
  *Disabled* em Production). O frontend é a superfície pública e já é protegido pelo **gate de senha** (`APP_PASSWORD`).
- **Backend:** o backend **não tem login próprio** e o CORS não barra acesso direto (curl/Postman ignoram CORS). A
  proteção é por **chave de API compartilhada**, independente de recursos da Vercel:
  1. Gere um segredo forte: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
  2. Defina `API_KEY` = esse segredo **nos dois projetos** (backend e frontend), em Production.
  3. O backend exige o header `x-api-key` ([`ApiKeyGuard`](../backend/src/shared/auth/api-key.guard.ts), registrado em
     [`app-setup.ts`](../backend/src/shared/config/app-setup.ts)); o frontend o envia
     ([`core.ts`](../frontend/src/lib/api/core.ts)). Redeploy ambos para aplicar a env var.

> Assim, só o frontend (que detém a chave) alcança a API; uma chamada direta ao backend sem o header recebe **401**.
> Sem `API_KEY` definida (dev local) o guard libera tudo, preservando o fluxo local.

## 5. Verificação

- Acesse `https://<frontend>.vercel.app`, faça login e confirme leitura/escrita nas 7 áreas.
- Crie um dado no celular e confira no desktop (mesmo banco Supabase).
- Confirme que uma origem diferente é rejeitada pelo CORS.
- Confirme que nenhum segredo aparece no bundle do cliente:
  ```bash
  # após `npm run build -w frontend`, procurar segredos no bundle (não deve haver match)
  grep -R "APP_PASSWORD\|AUTH_SECRET" frontend/.next || echo "ok: nenhum segredo no bundle"
  ```

## 6. Deploy contínuo e rollback

- Cada `git push` na branch de produção dispara novo build na Vercel (frontend e/ou backend).
- **Rollback:** em **Deployments**, abra o deploy anterior estável e use **Promote to Production**. O banco Supabase
  é externo e **não** é afetado pelo rollback de código.

## Solução de problemas

| Sintoma | Causa provável | Ação |
|---|---|---|
| API 500 em toda chamada | `DATABASE_URL` ausente/errada | Conferir variável no projeto backend; ver **Runtime Logs** na Vercel |
| `prepared statement "S_x" already exists` | PgBouncer transaction + prepared statements | Usar o **Session Pooler** do Supabase na `DATABASE_URL` (só troca a string) |
| Conexão recusada / SSL | `DATABASE_SSL` não setado | Definir `DATABASE_SSL=true` no backend e nas migrations |
| Chamadas do frontend falham | `API_URL` apontando para `localhost` | Definir `API_URL` com a URL da API na Vercel |
| CORS bloqueia o frontend | `CORS_ORIGINS` ausente/errado | Definir `CORS_ORIGINS` com a URL exata do frontend; redeploy |
