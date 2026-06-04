# Feature Spec — Autenticação por senha única (Login)

- **Projeto:** financas-pessoais
- **Slug:** `autenticacao-login`
- **PRD de origem:** [prd_autenticacao-login.md](./prd_autenticacao-login.md)
- **Status:** Proposto
- **Camada impactada:** Frontend Next.js (App Router) — middleware, rota `/login`, sessão por cookie, guarda nas server actions
- **Premissa que altera:** revoga a premissa "sem autenticação" do [objetivo do sistema](../../../docs/objetivo-do-sistema.md)

---

## 1. Resumo técnico da solução

O app é um monorepo com **frontend Next.js 14 (App Router)** que conversa com um **backend NestJS** em `:3001`
exclusivamente através de **server actions** (`frontend/src/lib/api/actions/*.ts`). Toda chamada de dados passa por
duas funções centrais em [`core.ts`](../../../frontend/src/lib/api/core.ts): `apiRequest` e `apiRequestBinary`.

A autenticação é um **portão de senha única** implementado **inteiramente na camada Next.js**, em dois pontos de
controle complementares:

1. **Proteção de telas — `middleware.ts` (Edge).** Um middleware novo (`frontend/src/middleware.ts`) intercepta toda
   navegação, valida o cookie de sessão e redireciona para `/login?redirectTo=<rota>` quando não há sessão válida.
   `/login` e os assets estáticos ficam em allowlist.
2. **Proteção de dados — guarda no `apiRequest`.** Como **todas** as server actions de dados passam por `apiRequest`
   / `apiRequestBinary`, adicionamos a verificação de sessão **nesse ponto único**: sem sessão válida, a função
   retorna `{ ok: false, status: 401 }` antes de tocar o backend. Isso protege as 7 áreas (orçamento, categorias,
   recorrências, reservas, relatórios, investimentos, projeções) com uma única alteração, sem editar cada action.

A sessão é um **JWT assinado (HS256)** guardado em cookie `httpOnly`, `Secure` (em produção), `SameSite=Lax`. A
assinatura/validação usa a biblioteca [`jose`](https://github.com/panva/jose) — escolhida por ser **compatível com o
Edge Runtime** do middleware (não usa o módulo `crypto` do Node), por já tratar **expiração** (`exp`) e por permitir
**rotação de segredo**. O segredo de assinatura é `AUTH_SECRET`, distinto da senha de acesso `APP_PASSWORD`.

A verificação da senha ocorre **no servidor**, via **server action de login**, comparando a entrada com
`APP_PASSWORD` em **tempo constante** (`crypto.timingSafeEqual` no runtime Node da action). O cliente nunca recebe a
senha nem o segredo.

### 1.1. Diagrama de fluxo

**Acesso a rota protegida (deslogado):**

```
Browser → GET /orcamento
   └─ middleware.ts
        ├─ rota em allowlist? (/login, _next, assets) → NÃO
        ├─ cookie "session" presente e JWT válido (assinatura + exp)? → NÃO
        └─ 307 Redirect → /login?redirectTo=%2Forcamento
```

**Login bem-sucedido:**

```
/login (form) → server action loginAction(formData)
   ├─ APP_PASSWORD / AUTH_SECRET definidos?  → NÃO → { ok:false, code:'config' }  (fail-safe + log)
   ├─ timingSafeEqual(input, APP_PASSWORD)   → false → { ok:false, code:'invalid' } (sem cookie)
   └─ true:
        ├─ token = jwtSign({ sub:'owner', iat, exp:now+TTL }, AUTH_SECRET)
        ├─ cookies().set('session', token, { httpOnly, secure(prod), sameSite:'lax', maxAge:TTL, path:'/' })
        └─ redirect(redirectTo seguro || '/')
```

**Chamada de dados (guarda no apiRequest):**

```
componente → server action (ex.: listarBaldes) → apiRequest('/baldes')
   ├─ getSession() lê cookie + valida JWT → ausente/inválido → { ok:false, status:401, message:'Sessão expirada.' }
   └─ válido → fetch(API_URL + path) → ApiResult normal
```

**Logout:**

```
Topbar "Sair" (form) → server action logoutAction()
   ├─ cookies().delete('session')
   └─ redirect('/login')
```

---

## 2. Arquitetura e componentes impactados

| Componente | Caminho | Mudança |
|---|---|---|
| Utilitário de sessão | `frontend/src/lib/auth/session.ts` (novo) | Assinar/validar JWT, ler/escrever/limpar cookie, ler config de ambiente |
| Config de auth | `frontend/src/lib/auth/config.ts` (novo) | Carregar e validar `APP_PASSWORD`, `AUTH_SECRET`, `AUTH_SESSION_TTL`; expor `isAuthConfigured()` |
| Middleware | `frontend/src/middleware.ts` (novo) | Gate de rotas + allowlist + `redirectTo` |
| Server actions de auth | `frontend/src/lib/auth/actions.ts` (novo) | `loginAction`, `logoutAction` (`'use server'`) |
| Página de login | `frontend/src/app/login/page.tsx` (novo) | Tela `/login` (Server Component) |
| Form de login | `frontend/src/app/login/LoginForm.tsx` (novo) | Client Component com estado de erro/backoff |
| Guarda de dados | `frontend/src/lib/api/core.ts` (editar) | Checar sessão antes do `fetch` em `apiRequest` e `apiRequestBinary` |
| Logout na UI | `frontend/src/components/layout/Topbar.tsx` (editar) | Ação "Sair" no menu de configurações |
| Backoff (opcional) | `frontend/src/lib/auth/rateLimit.ts` (novo) | Atraso progressivo por tentativas (RF-010) |
| Env de exemplo | `.env.example`, `frontend/.env.local.example` (editar) | `APP_PASSWORD`, `AUTH_SECRET`, `AUTH_SESSION_TTL` |
| Dependência | `frontend/package.json` (editar) | Adicionar `jose` |

> **Nota de runtime:** `middleware.ts` roda em **Edge Runtime** → só pode usar `jose` (Web Crypto), nunca o módulo
> `crypto` do Node. A `loginAction` roda em **Node Runtime** → pode usar `crypto.timingSafeEqual` para a comparação
> da senha. A validação do JWT (`jwtVerify` do `jose`) funciona nos dois runtimes e é usada em ambos os pontos.

---

## 3. Entidades de domínio

Não há persistência em banco — a "sessão" é **stateless**, carregada inteiramente no JWT. Entidades lógicas:

### 3.1. `SessionToken` (claims do JWT)

| Atributo | Tipo | Descrição |
|---|---|---|
| `sub` | `string` | Sempre `"owner"` (app single-user; não há identidade individual) |
| `iat` | `number` (epoch s) | Emissão; preenchido por `jose` |
| `exp` | `number` (epoch s) | Expiração = `iat + AUTH_SESSION_TTL` |

- **Assinatura:** HS256 com `AUTH_SECRET`.
- **Relacionamento:** 1 token ↔ 1 cookie `session`. Trocar `AUTH_SECRET` invalida todos os tokens existentes.

### 3.2. `AuthConfig` (derivado do ambiente, não persistido)

| Atributo | Tipo | Origem | Default |
|---|---|---|---|
| `password` | `string` | `APP_PASSWORD` | — (obrigatório) |
| `secret` | `Uint8Array` | `AUTH_SECRET` (≥ 32 bytes) | — (obrigatório) |
| `sessionTtlSeconds` | `number` | `AUTH_SESSION_TTL` | `604800` (7 dias) |
| `secureCookie` | `boolean` | `NODE_ENV === 'production'` | `false` em dev |

### 3.3. `LoginResult` (retorno da `loginAction`)

```ts
type LoginResult =
  | { ok: true }                                  // cookie setado + redirect disparado
  | { ok: false; code: 'invalid' }                // senha incorreta
  | { ok: false; code: 'config' }                 // APP_PASSWORD/AUTH_SECRET ausentes
  | { ok: false; code: 'rate_limited'; retryAfterMs: number }; // backoff (opcional)
```

---

## 4. Contratos

As operações de auth são **server actions** (não REST), mas têm contratos bem definidos.

### 4.1. `loginAction(formData: FormData): Promise<LoginResult>`

- **Runtime:** Node. `'use server'`.
- **Request (FormData):**
  - `password: string` — senha digitada (sofre `trim` apenas nas bordas).
  - `redirectTo?: string` — rota original; validada para ser **mesma origem** (começa com `/`, não `//`, não
    `http`). Inválida → ignorada, cai em `/`.
- **Comportamento / Respostas:**
  | Situação | Retorno | Efeito colateral |
  |---|---|---|
  | Config ausente | `{ ok:false, code:'config' }` | `console.error` de configuração; **nenhum** cookie |
  | Senha incorreta | `{ ok:false, code:'invalid' }` | **nenhum** cookie; incrementa contador de backoff |
  | Excesso de tentativas (opcional) | `{ ok:false, code:'rate_limited', retryAfterMs }` | atraso aplicado |
  | Senha correta | `redirect()` (não retorna) | cookie `session` setado; `redirect(redirectTo \|\| '/')` |
- **Status equivalentes:** sucesso = 200/redirect; senha errada = 401-lógico; config = 500-lógico.

### 4.2. `logoutAction(): Promise<void>`

- **Runtime:** Node. `'use server'`.
- **Request:** sem corpo (acionada por `<form action={logoutAction}>`).
- **Efeito:** `cookies().delete('session')` → `redirect('/login')`. Idempotente (sem sessão também redireciona).

### 4.3. Guarda em `apiRequest` / `apiRequestBinary` (editar `core.ts`)

- **Pré-condição adicionada:** antes do `fetch`, chamar `getSession()`.
- **Sessão ausente/inválida/expirada:**
  ```ts
  return { ok: false, status: 401, message: 'Sessão expirada. Faça login novamente.' };
  ```
  Nenhum `fetch` ao backend é disparado; nenhum dado é lido ou gravado.
- **Sessão válida:** comportamento atual inalterado (retorna `ApiResult<T>`).
- **Propagação ao cliente:** o `unwrap` ([`http.ts`](../../../frontend/src/lib/api/http.ts)) já lança `ApiError`
  com `status`. Um tratamento global (ver Task 9) detecta `status === 401` e redireciona para `/login`.

### 4.4. Cookie `session`

| Atributo | Valor |
|---|---|
| Nome | `session` |
| Valor | JWT HS256 |
| `httpOnly` | `true` |
| `Secure` | `true` em produção; `false` em `localhost`/dev |
| `SameSite` | `Lax` |
| `Path` | `/` |
| `Max-Age` | `AUTH_SESSION_TTL` (segundos) |

---

## 5. Edge cases técnicos

| # | Cenário | Comportamento esperado |
|---|---|---|
| EC-1 | `APP_PASSWORD` **ou** `AUTH_SECRET` ausente/vazio | `isAuthConfigured()` → `false`. Login retorna `{ code:'config' }` com `console.error`; **nenhuma** sessão é criada. App **nunca** sobe "aberto". |
| EC-2 | Cookie `session` adulterado/forjado (assinatura inválida) | `jwtVerify` lança → `getSession()` retorna `null` → tratado como "sem sessão" → redireciona para `/login`. Conteúdo do cookie **nunca** é confiado sem validar assinatura. |
| EC-3 | JWT expirado (`exp` < agora) | `jose` lança `JWTExpired` → `null`. Navegação → `/login`; server action → 401. |
| EC-4 | Senha correta com whitespace nas bordas | Entrada sofre `trim` apenas nas pontas (documentado); comparada exatamente com `APP_PASSWORD`. `timingSafeEqual` exige buffers de mesmo tamanho → comparar comprimento de forma a **não** vazar timing (comparar hash de tamanho fixo, ver §6). |
| EC-5 | `AUTH_SECRET` rotacionado com sessões abertas | Tokens assinados com o segredo antigo falham em `jwtVerify` → todas as sessões antigas invalidadas (invalidação por rotação). |
| EC-6 | `redirectTo` malicioso (`//evil.com`, `https://...`, sem `/`) | Validação rejeita open redirect → cai em `/`. Aceita apenas paths internos (`/` seguido de não-`/`). |
| EC-7 | Acesso direto à server action sem cookie (bypass da UI) | Guarda em `apiRequest` retorna 401 antes de qualquer `fetch`; nada é lido/gravado. (CS-003) |
| EC-8 | `/login` ou assets bloqueados pelo gate | Allowlist explícita no middleware (`/login`, `/_next/*`, `/favicon.ico`, arquivos estáticos) impede loop de redirecionamento. |
| EC-9 | Concorrência: TTL expira durante uma sessão de uso ativa | Próxima navegação → middleware redireciona; próxima action → 401 + redirect global. Após reautenticar, usuário retorna ao app (idealmente à rota corrente). |
| EC-10 | Força bruta (várias senhas em sequência) | Backoff incremental por IP/sessão (RF-010, opcional): atraso crescente após N erros, sem travar permanentemente o dono único. |
| EC-11 | `AUTH_SESSION_TTL` inválido (não numérico/≤0) | Cai no default 7 dias com `console.warn`; nunca desabilita expiração silenciosamente. |

---

## 6. Requisitos funcionais

- **RF-001** — O sistema **DEVE** expor a rota `/login` (Server Component + Client `LoginForm`) com campo de senha e
  ação de envio, acessível **sem** sessão.
- **RF-002** — O sistema **DEVE** validar a senha no **servidor** (`loginAction`, runtime Node) contra `APP_PASSWORD`
  usando **comparação em tempo constante**, sem expor senha nem segredo ao cliente.
- **RF-003** — Em caso de sucesso, o sistema **DEVE** emitir um JWT HS256 (`sub:'owner'`, `exp`) e guardá-lo em cookie
  `session` `httpOnly`, `Secure` (prod), `SameSite=Lax`, assinado com `AUTH_SECRET`.
- **RF-004** — O sistema **DEVE** bloquear via `middleware.ts` o acesso a todas as rotas de aplicação sem sessão
  válida, redirecionando para `/login?redirectTo=<rota>`; `/login` e assets estáticos ficam em allowlist.
- **RF-005** — `apiRequest` e `apiRequestBinary` **DEVEM** exigir sessão válida e retornar `{ ok:false, status:401 }`
  quando ausente, **sem** chamar o backend nem persistir dados.
- **RF-006** — O sistema **DEVE** oferecer ação **"Sair"** na Topbar que invalida a sessão (remove o cookie) e
  redireciona para `/login`.
- **RF-007** — A sessão **DEVERIA** expirar após `AUTH_SESSION_TTL` (default 7 dias); expirada, o acesso é tratado
  como deslogado (validação via claim `exp` do JWT).
- **RF-008** — Quando `APP_PASSWORD` **ou** `AUTH_SECRET` não estiverem definidos, o sistema **DEVE** recusar
  autenticação (fail-safe), registrar erro e nunca liberar acesso.
- **RF-009** — Após login, o sistema **DEVERIA** redirecionar para `redirectTo` quando for path interno válido
  (mesma origem), caindo em `/` caso contrário (proteção contra open redirect).
- **RF-010** — O sistema **PODE** aplicar backoff/limite simples de tentativas por IP/sessão para mitigar força
  bruta, sem travar permanentemente o dono.
- **RF-011** — O cliente **DEVE** reagir a respostas 401 de actions de dados redirecionando o usuário para `/login`
  (tratamento global de sessão expirada).

---

## 7. Requisitos não-funcionais

### 7.1. Segurança
- Senha e `AUTH_SECRET` **nunca** chegam ao bundle do cliente (somente em código de servidor / `process.env` server-side).
- Comparação de senha em tempo constante; mensagens de erro não diferenciam "config" de "senha errada" para o
  visitante além do necessário ("Senha incorreta").
- Cookie `httpOnly` (sem acesso via JS) + `SameSite=Lax` (mitiga CSRF em navegação cross-site) + `Secure` em prod.
- Proteção contra open redirect na validação de `redirectTo`.
- `AUTH_SECRET` ≥ 32 bytes; documentado como aleatório e rotacionável.

### 7.2. Performance
- Validação de JWT no middleware é **stateless** (sem I/O de banco/rede) → overhead desprezível por request.
- Login concede acesso em **≤ 1 requisição** (um submit) — CS-002.

### 7.3. Observabilidade
- `console.error` em falha de configuração (EC-1) e `console.warn` em TTL inválido (EC-11).
- Não logar a senha digitada nem o token. Logar apenas eventos: "login falhou (senha)", "config ausente",
  "sessão inválida".

### 7.4. Compatibilidade
- Middleware **deve** rodar em Edge Runtime → exclusivamente `jose`/Web Crypto.
- Funciona em `localhost` (HTTP, `Secure=false`) e na Vercel (HTTPS, `Secure=true`) sem mudança de código.

---

## 8. Estratégia de testes

- **Unitários (utilitário de sessão):** assinar→validar round-trip; rejeitar token adulterado; rejeitar token
  expirado; rejeitar assinatura com segredo trocado; `redirectTo` aceita/rejeita corretamente; `isAuthConfigured`
  com env ausente/presente.
- **Unitários (loginAction):** senha correta seta cookie; senha errada não seta e retorna `invalid`; config ausente
  retorna `config` + log; whitespace nas bordas (EC-4).
- **Integração (middleware):** rota protegida sem cookie → 307 para `/login?redirectTo=...`; com cookie válido →
  segue; `/login` e `/_next` em allowlist nunca redirecionam.
- **Integração (guarda de dados):** chamar uma server action de dados sem cookie → `status:401` e backend **não**
  é invocado (mock do `fetch` não recebe chamada).
- **E2E (fluxo feliz):** deslogado → `/orcamento` redireciona → login → volta para `/orcamento`; recarregar mantém
  sessão; "Sair" → `/login` e "voltar" do navegador não restaura acesso (CS-005).
- **Verificação manual mínima:** as 7 áreas redirecionam sem sessão (CS-001).

> O projeto não possui runner de testes configurado no frontend hoje; tarefas marcam onde adicionar testes, mas o
> critério mínimo de aceite é a verificação manual dos critérios de sucesso CS-001..CS-005 do PRD.

---

## 9. Breakdown de tarefas

Cada item cabe em **1 PR**. Dependências indicadas inline.

- [x] **T1 — Adicionar dependência `jose` e variáveis de ambiente.**
  Instalar `jose` em `frontend/package.json`. Documentar `APP_PASSWORD`, `AUTH_SECRET`, `AUTH_SESSION_TTL` em
  [`.env.example`](../../../.env.example) e [`frontend/.env.local.example`](../../../frontend/.env.local.example)
  com placeholders (sem valores reais). _Sem dependências._

- [x] **T2 — Config de auth (`lib/auth/config.ts`).**
  Ler `APP_PASSWORD`, `AUTH_SECRET` (→ `Uint8Array`), `AUTH_SESSION_TTL` (parse + default 7d + warn se inválido).
  Expor `getAuthConfig()`, `isAuthConfigured()`, `isSecureCookie()`. _Depende de: T1._

- [x] **T3 — Utilitário de sessão (`lib/auth/session.ts`).**
  `signSession()` (jose HS256 com `exp`), `verifySessionToken()`, `getSession()` (lê cookie + valida → claims|null),
  `setSessionCookie()`, `clearSessionCookie()`, `sanitizeRedirectTo()`. Compatível Edge + Node. _Depende de: T2._

- [x] **T4 — Testes unitários do utilitário de sessão.**
  Round-trip, adulteração, expiração, rotação de segredo, `sanitizeRedirectTo`. _Depende de: T3._

- [x] **T5 — Server actions de auth (`lib/auth/actions.ts`).**
  `loginAction(formData)` (`timingSafeEqual`, trim de bordas, fail-safe config, set cookie, redirect seguro) e
  `logoutAction()` (clear cookie + redirect `/login`). _Depende de: T3._

- [x] **T6 — Tela `/login` (`app/login/page.tsx` + `LoginForm.tsx`).**
  Server Component lê `redirectTo` do search param; Client `LoginForm` com `useFormState`/estado de erro exibindo
  "Senha incorreta" e erro de configuração; usa primitivos `Button`/`Input`/`Card`/`Label` existentes.
  _Depende de: T5._

- [x] **T7 — Middleware de proteção de rotas (`frontend/src/middleware.ts`).**
  Allowlist (`/login`, `/_next`, `/favicon.ico`, estáticos); valida sessão; redireciona para
  `/login?redirectTo=<rota>`. Configurar `matcher`. _Depende de: T3._

- [x] **T8 — Guarda de dados no `apiRequest`/`apiRequestBinary` (`lib/api/core.ts`).**
  Inserir `getSession()` antes do `fetch`; retornar `{ ok:false, status:401, message }` se ausente. _Depende de: T3._

- [x] **T9 — Tratamento global de 401 no cliente.**
  Detectar `ApiError.status === 401` (via `unwrap`/boundary) e redirecionar para `/login`. Avaliar `error.tsx` global
  ou wrapper nos consumidores. _Depende de: T8._

- [x] **T10 — Ação "Sair" na Topbar (`components/layout/Topbar.tsx`).**
  Adicionar item "Sair" no menu de configurações com `<form action={logoutAction}>`. _Depende de: T5._

- [x] **T11 — (Opcional, RF-010) Backoff de tentativas (`lib/auth/rateLimit.ts`).**
  Contador em memória por IP/sessão com atraso incremental; integrar na `loginAction`. _Depende de: T5._

- [x] **T12 — Verificação dos critérios de sucesso e ajuste de docs.**
  Validar CS-001..CS-005 manualmente nas 7 áreas; atualizar `docs/objetivo-do-sistema.md` removendo a premissa "sem
  autenticação". _Depende de: T6, T7, T8, T9, T10._

---

## 10. Decisões e premissas técnicas

- **[Decisão] Biblioteca `jose` (JWT HS256) para a sessão.** Necessária porque `middleware.ts` roda em Edge Runtime,
  onde o módulo `crypto` do Node não existe; `jose` usa Web Crypto, trata `exp` e permite rotação por troca de
  `AUTH_SECRET`. Alternativa (HMAC manual com `SubtleCrypto`) foi descartada por reescrever o que `jose` já entrega.
- **[Decisão] Guarda de dados centralizada em `apiRequest`.** Como todas as server actions de dados passam por
  `core.ts`, a verificação de sessão vive nesse choke point único — protege as 7 áreas sem editar cada action,
  satisfazendo RF-005/CS-003.
- **[Decisão] Comparação de senha em tempo constante na `loginAction` (runtime Node).** Usa
  `crypto.timingSafeEqual` sobre buffers de tamanho fixo (ex.: comparar `sha256(input)` vs `sha256(APP_PASSWORD)`)
  para não vazar comprimento/timing, satisfazendo RF-002 e EC-4.
- **[Premissa] App single-user.** Uma senha (`APP_PASSWORD`) para um dono; `sub:'owner'` fixo; sem banco de usuários,
  perfis ou identidade individual (alinhado ao PRD §8).
- **[Premissa] Backend NestJS não é exposto publicamente.** O portão protege a camada Next.js; em produção, o backend
  fica em rede privada/não público (tratado no [PRD de deploy](../deploy-nuvem-vercel-supabase/prd_deploy-nuvem-vercel-supabase.md)).
  Em `localhost` o backend continua acessível diretamente — aceitável em uso de dev.
- **[Premissa] `Secure` condicional a `NODE_ENV`.** `true` em produção/HTTPS; relaxado em `localhost` para o dev
  funcionar (PRD §8).
- **[Premissa] TTL padrão 7 dias (`AUTH_SESSION_TTL=604800`),** configurável; valor por conveniência pessoal.
- **[Premissa] Sem runner de testes no frontend hoje.** As tarefas de teste descrevem a cobertura desejada; o aceite
  mínimo é a verificação manual de CS-001..CS-005.

---

## 11. Referências

- PRD: [prd_autenticacao-login.md](./prd_autenticacao-login.md)
- Choke point de API: [`frontend/src/lib/api/core.ts`](../../../frontend/src/lib/api/core.ts)
- Tipos de resultado: [`frontend/src/lib/api/http.ts`](../../../frontend/src/lib/api/http.ts)
- Topbar (logout): [`frontend/src/components/layout/Topbar.tsx`](../../../frontend/src/components/layout/Topbar.tsx)
- Layout raiz: [`frontend/src/app/layout.tsx`](../../../frontend/src/app/layout.tsx)
- Objetivo do sistema (premissa revogada): [`docs/objetivo-do-sistema.md`](../../../docs/objetivo-do-sistema.md)
