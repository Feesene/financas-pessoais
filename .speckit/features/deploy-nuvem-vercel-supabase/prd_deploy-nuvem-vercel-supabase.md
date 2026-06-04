# PRD — Deploy na nuvem (Vercel + Supabase)

- **Projeto:** financas-pessoais
- **Prioridade:** P9 (depende de [autenticação por senha](../autenticacao-login/prd_autenticacao-login.md))
- **Status:** Proposto
- **Premissa que altera:** revoga "sem deploy público no MVP" e "execução local" do [objetivo do sistema](../../../docs/objetivo-do-sistema.md)

## 1. Contexto e problema

Hoje o sistema roda **inteiramente na máquina do usuário**: frontend Next.js (`:3000`), API NestJS (`:3001`) e
**PostgreSQL via Docker** (`:5432`), configurado por `.env`. Isso impede usar o painel de outro dispositivo (celular,
outro computador) e exige subir Docker e dois processos a cada uso.

O objetivo desta feature é **publicar o app na nuvem** de forma que o proprietário acesse por uma URL `https://`
de qualquer lugar, mantendo todo o comportamento atual:

- **Frontend Next.js → Vercel** (deploy a partir do repositório).
- **Backend NestJS → Vercel** (mesmas rotas/contratos de hoje, executando como funções serverless na Vercel —
  decisão confirmada), **sem reescrever** os módulos DDD/Clean Architecture existentes.
- **PostgreSQL → Supabase** (apenas o banco gerenciado; substitui o Postgres do Docker via `DATABASE_URL`).

O acesso público fica protegido pela [autenticação por senha](../autenticacao-login/prd_autenticacao-login.md), que é
pré-requisito obrigatório. Esta é uma feature de **infraestrutura e configuração** — não muda regras de negócio.

## 2. Usuários-alvo

- **Proprietário (usuário único).** Quer abrir o painel por uma URL pública, em qualquer dispositivo, com os mesmos
  dados — sem rodar Docker nem `npm run dev`.
- **Mantenedor (o próprio dono no papel de operador).** Precisa implantar, configurar variáveis de ambiente, rodar
  migrations contra o banco da nuvem e reverter um deploy ruim.

## 3. Fluxo principal

1. O mantenedor cria um projeto **Supabase** e obtém a `DATABASE_URL` (Postgres gerenciado, com pooler para
   serverless).
2. Roda as **migrations** do TypeORM contra o banco Supabase, criando o schema (categorias, metas, lançamentos,
   recorrências, reservas etc.).
3. Configura o repositório para a **Vercel**: frontend (Next.js) e backend (NestJS como funções serverless) com as
   variáveis de ambiente de produção (`DATABASE_URL`, `APP_PASSWORD`, `AUTH_SECRET`, `API_URL`/origens de CORS).
4. Faz o **deploy**; a Vercel constrói e publica frontend e API sob domínios HTTPS.
5. O proprietário acessa a URL pública, passa pelo **login** (senha do `.env`) e usa o app normalmente, agora lendo e
   gravando no banco Supabase.
6. Cada `git push` na branch de produção dispara um novo deploy; um deploy com problema pode ser **revertido** para o
   anterior pela Vercel.

## 4. User stories

### P1 — Usar o app por uma URL pública, com os dados na nuvem *(entrega valor sozinha)*
**Como** proprietário, **quero** acessar o painel por um endereço `https://` **para** usá-lo de qualquer dispositivo
sem subir nada localmente.

- **Given** o app está implantado na Vercel com `DATABASE_URL` apontando para o Supabase,
  **when** acesso a URL pública e faço login,
  **then** vejo meus lançamentos/reservas/investimentos carregados do banco Supabase, com os mesmos totais de hoje.
- **Given** estou autenticado no app público,
  **when** crio um lançamento no celular e depois abro o app no computador,
  **then** o mesmo lançamento aparece (mesmo banco), sem passo manual de sincronização.

### P2 — Migrar o schema para o banco da nuvem com segurança
**Como** mantenedor, **quero** aplicar as migrations no Supabase **para** que o banco de produção tenha exatamente o
schema esperado, sem `synchronize` automático.

- **Given** um banco Supabase recém-criado e vazio,
  **when** rodo as migrations do TypeORM apontando para a `DATABASE_URL` do Supabase,
  **then** todas as tabelas e índices são criados e `synchronize` permanece desligado em produção.
- **Given** o schema já aplicado,
  **when** rodo as migrations de novo,
  **then** nenhuma alteração destrutiva ocorre (idempotente) e os dados existentes são preservados.

### P3 — Publicar e reverter deploys com configuração segura
**Como** mantenedor, **quero** implantar por push e reverter um deploy ruim **para** operar a nuvem com baixo risco e
sem expor segredos.

- **Given** as variáveis de produção configuradas na Vercel (sem segredos no repositório),
  **when** faço `git push` na branch de produção,
  **then** a Vercel constrói e publica frontend + API, e nenhum segredo aparece no bundle do cliente.
- **Given** um deploy novo apresentou erro,
  **when** promovo o deploy anterior como produção (rollback),
  **then** o app volta ao estado funcional anterior sem perder dados do banco.

## 5. Edge cases

- **Cold start / limite de conexões em serverless:** muitas funções abrindo conexões diretas estouram o limite do
  Postgres; o acesso ao banco **deve** usar o **pooler** do Supabase (porta de pooling) e/ou pool enxuto por instância.
- **CORS aberto demais:** hoje `app.enableCors()` libera qualquer origem; em produção a API **deve** restringir as
  origens à(s) URL(s) do frontend na Vercel.
- **`DATABASE_URL` ausente/incorreta no deploy:** o build/boot deve falhar de forma clara (log explícito), não subir
  uma API que responde 500 silenciosos a cada chamada.
- **`synchronize` ligado em produção:** se a config de runtime herdar `synchronize: true` (usado em dev), pode alterar
  o schema sem controle — **deve** estar desligado em produção, schema só via migrations.
- **SSL exigido pelo Supabase:** a conexão Postgres na nuvem exige TLS; a config do TypeORM **deve** habilitar SSL em
  produção (caso contrário a conexão é recusada).
- **Variável só de servidor vazando para o cliente:** `DATABASE_URL`, `APP_PASSWORD` e `AUTH_SECRET` **não** podem ter
  prefixo `NEXT_PUBLIC_` nem ser referenciadas em código de cliente.
- **Migrations falhando no meio:** uma migration interrompida não pode deixar o schema num estado parcial sem registro;
  rodar migrations é passo controlado pelo mantenedor (não automático no boot da função).
- **Frontend e API em domínios diferentes:** as server actions chamam `API_URL`; em produção esse valor **deve**
  apontar para a URL pública da API na Vercel, não para `localhost:3001`.
- **Timezone/locale do servidor:** datas/competências (`AAAA-MM`) e formatação R$ devem permanecer corretas mesmo com
  o runtime da nuvem em UTC.

## 6. Requisitos funcionais

- **RF-001** — O frontend Next.js **DEVE** ser implantável na Vercel a partir do repositório, gerando uma URL pública
  HTTPS.
- **RF-002** — O backend NestJS **DEVE** ser implantado na Vercel como funções serverless, preservando as rotas e os
  contratos (DTOs) atuais, sem reescrever os módulos de domínio.
- **RF-003** — A persistência **DEVE** usar o PostgreSQL gerenciado do Supabase via `DATABASE_URL`, substituindo o
  Postgres do Docker; a conexão **DEVE** usar SSL em produção.
- **RF-004** — O acesso ao banco em runtime serverless **DEVE** usar o pooler de conexões do Supabase (ou pool mínimo),
  evitando esgotar o limite de conexões.
- **RF-005** — Em produção, `synchronize` **DEVE** estar desligado; o schema **DEVE** ser criado e evoluído apenas por
  **migrations** do TypeORM executadas pelo mantenedor contra o banco Supabase.
- **RF-006** — A API **DEVE** restringir CORS às origens do frontend de produção (URL(s) da Vercel), em vez de liberar
  qualquer origem.
- **RF-007** — As server actions do frontend **DEVEM** chamar a API pela `API_URL` de produção (URL da API na Vercel),
  configurável por variável de ambiente.
- **RF-008** — Segredos (`DATABASE_URL`, `APP_PASSWORD`, `AUTH_SECRET`) **DEVEM** ser configurados como variáveis de
  ambiente na Vercel/Supabase e **nunca** versionados nem expostos ao cliente (sem `NEXT_PUBLIC_`).
- **RF-009** — O app público **DEVE** exigir a [autenticação por senha](../autenticacao-login/prd_autenticacao-login.md)
  antes de servir qualquer dado.
- **RF-010** — Um deploy com defeito **DEVERIA** poder ser revertido (rollback para o deploy anterior) sem perda de
  dados no banco.
- **RF-011** — A documentação (`README` e/ou guia de deploy) **DEVERIA** descrever o passo a passo: criar Supabase,
  rodar migrations, configurar variáveis na Vercel e publicar.
- **RF-012** — O sistema **PODE** manter um caminho de execução **local** (Docker Postgres) intacto, alternando apenas
  por variáveis de ambiente, para desenvolvimento.

## 7. Escopo

**Dentro:** provisionar Postgres no Supabase e obter `DATABASE_URL`; configurar e rodar migrations contra a nuvem;
adaptar a config do TypeORM para produção (SSL, pooler, `synchronize=false`); empacotar o NestJS como funções
serverless na Vercel; implantar o frontend Next.js na Vercel; restringir CORS; parametrizar `API_URL` e segredos por
ambiente; integrar o gate de autenticação no app público; documentar o processo de deploy e rollback.

### Fora do escopo
- **Migração de dados local → nuvem (carga inicial):** se houver dados locais a transferir, é um passo manual à parte;
  o foco aqui é estrutura/schema, não _data migration_.
- **Reescrever o backend para Supabase nativo (PostgREST/Edge Functions/RLS):** decidido manter NestJS; Supabase entra
  só como Postgres.
- **Multiusuário, RLS por usuário e isolamento multi-tenant:** segue single-user (ver [PRD de autenticação](../autenticacao-login/prd_autenticacao-login.md)).
- **Domínio próprio, CDN avançada, e-mail transacional e observabilidade dedicada:** além do necessário para publicar.
- **CI/CD com testes automatizados como gate de deploy:** o deploy por push da Vercel basta para o MVP da nuvem.
- **Backups/PITR e plano de DR formal:** usa-se o padrão do plano Supabase; política dedicada fica para depois.

## 8. Premissas

- **Backend serverless na Vercel:** o NestJS será exposto como função(ões) serverless na própria Vercel (decisão
  confirmada), mantendo os mesmos contratos; assume-se um _entrypoint_ que inicializa o app Nest por invocação,
  reaproveitando instância entre invocações quando possível (mitiga cold start). **[Premissa]**
- **Supabase só como Postgres:** nenhum recurso Supabase além do banco (sem Auth, Storage, PostgREST) é usado nesta
  feature. **[Premissa]**
- **Pooler de conexões:** usa-se a connection string com pooling do Supabase para o runtime serverless; a string sem
  pooling fica reservada para rodar migrations. **[Premissa]**
- **Migrations manuais e controladas:** o mantenedor roda as migrations sob demanda (não no boot das funções), para
  evitar execuções concorrentes em ambiente serverless. **[Premissa]**
- **Plano gratuito é suficiente** para o uso pessoal (um usuário), tanto na Vercel quanto no Supabase. **[Premissa]**
- **Autenticação já implementada:** este PRD pressupõe o gate de senha pronto; sem ele, a publicação não deve ocorrer.
  **[Premissa]**
- **Ambiente do servidor em UTC:** datas são tratadas por competência (`AAAA-MM`) e formatação pt-BR no app, então o
  fuso UTC do runtime não deve afetar os resultados. **[Premissa]**

## 9. Critérios de sucesso

- **CS-001** — A partir de uma URL pública HTTPS, após login, o proprietário **lê e grava** dados nas 7 áreas
  (orçamento, categorias, recorrências, reservas, relatórios, investimentos, projeções) com os mesmos resultados do
  ambiente local — verificado reproduzindo ao menos um mês real.
- **CS-002** — Um dado criado num dispositivo aparece em outro dispositivo (mesmo banco Supabase) **sem** passo manual
  de sincronização, em até um refresh.
- **CS-003** — Em produção, `synchronize` está **desligado** e o schema corresponde 1:1 às migrations (nenhuma tabela
  criada "por baixo dos panos"); rodar as migrations duas vezes é idempotente.
- **CS-004** — **0** segredos (`DATABASE_URL`, `APP_PASSWORD`, `AUTH_SECRET`) aparecem no bundle do cliente ou no
  repositório; CORS de produção rejeita origens diferentes do frontend publicado.
- **CS-005** — Sob uso normal de uma sessão pessoal, as chamadas à API **não** falham por esgotamento de conexões do
  Postgres (uso do pooler comprovado), e a API responde em tempo comparável ao local após o warm-up.
- **CS-006** — Um deploy defeituoso pode ser **revertido** para o anterior pela Vercel, restaurando o app funcional
  sem alterar/perder dados no banco.

## 10. Dependências

- **[PRD de autenticação por senha](../autenticacao-login/prd_autenticacao-login.md)** — bloqueante: o app público
  só pode subir com o gate de login ativo.
- **Configuração do TypeORM em runtime** — `buildTypeOrmConfig` (usado pelo app Nest) precisa de variante de produção
  (SSL, pooler, `synchronize=false`); o [`data-source.ts`](../../../backend/src/shared/config/data-source.ts) da CLI
  já usa `DATABASE_URL` e `synchronize:false` para migrations.
- **Bootstrap do NestJS** — [`main.ts`](../../../backend/src/main.ts) hoje chama `enableCors()` aberto e `app.listen`;
  a adaptação serverless precisa de um _handler_ e CORS restrito por origem de produção.
- **Camada de chamada do frontend** — [`core.ts`](../../../frontend/src/lib/api/core.ts) já lê `API_URL`/
  `NEXT_PUBLIC_API_URL`; em produção aponta para a API na Vercel.
- **Arquivos de ambiente** — [`.env.example`](../../../.env.example) e
  [`frontend/.env.local.example`](../../../frontend/.env.local.example) ganham as variáveis de produção
  (`DATABASE_URL` Supabase, `API_URL`, segredos de auth) documentadas.
- **Migrations existentes** — `backend/src/migrations/*` devem rodar sem erro contra o Postgres do Supabase.
- **Contas/serviços externos** — projeto na **Vercel** e projeto no **Supabase** (provisionamento manual do
  mantenedor).
