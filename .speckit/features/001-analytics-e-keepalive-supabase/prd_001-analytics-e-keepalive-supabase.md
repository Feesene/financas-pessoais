# PRD — Analytics de uso e keep-alive do banco (anti-pausa do Supabase)

- **Projeto:** financas-pessoais
- **Número:** 001
- **Prioridade:** P2 (operação contínua do app já publicado — depende do [deploy na nuvem](../deploy-nuvem-vercel-supabase/prd_deploy-nuvem-vercel-supabase.md) já existente)
- **Status:** Proposto
- **Resumo:** duas melhorias operacionais do app já no ar: (a) instrumentar o frontend com **@vercel/analytics** para medir uso real; (b) impedir que o projeto **Supabase** seja pausado por inatividade, mantendo o banco "vivo" com um **cron** que faz uma consulta trivial periódica.

## 1. Contexto e problema

O app já está publicado na nuvem (frontend Next.js + backend serverless na Vercel, Postgres no Supabase — ver
[memória de deploy](../deploy-nuvem-vercel-supabase/prd_deploy-nuvem-vercel-supabase.md)). Dois problemas operacionais
surgiram com o app no ar:

1. **Falta de visibilidade de uso.** Não há nenhuma instrumentação de analytics no frontend. O dono não tem como
   saber se/quando o app é acessado, quais rotas são usadas, ou se houve regressão de carregamento. Como o app roda
   na Vercel, o caminho de menor atrito é o **Vercel Web Analytics** (pacote `@vercel/analytics`), que não exige
   cookies, não depende de terceiros e se integra com um único componente no App Router.

2. **Risco de pausa do banco por inatividade.** O Supabase está **notificando que vai pausar o projeto por
   inatividade**. No plano gratuito, um projeto sem atividade por ~7 dias é pausado; pausado, o app quebra (sem
   banco) até alguém entrar no dashboard e reativar manualmente. Como este é um app de uso pessoal e esporádico,
   é plausível passar dias sem acesso — exatamente o cenário que dispara a pausa. A solução é um **keep-alive**: um
   agendamento (cron) que, em intervalo regular, executa uma consulta leve no banco, registrando atividade
   suficiente para o Supabase não considerar o projeto ocioso.

As duas mudanças são pequenas, independentes entre si e ambas de natureza operacional ("manter o app saudável no
ar"), por isso são tratadas no mesmo PRD.

## 2. Usuários-alvo

- **Proprietário / operador (usuário único).** Pessoa que mantém o app no ar e quer (a) enxergar métricas de uso no
  dashboard da Vercel e (b) nunca mais precisar reativar manualmente o banco pausado. É quem se beneficia de ambas
  as entregas.
- **Visitante autenticado (indireto).** Qualquer acesso legítimo ao app gera eventos de analytics e se beneficia de o
  banco estar sempre disponível (sem janelas de indisponibilidade por pausa).
- **Agendador automático (ator de sistema).** O job de cron que dispara o keep-alive — não é uma pessoa, mas é o ator
  que executa o fluxo de manutenção sem intervenção humana.

## 3. Fluxo principal

**Fluxo A — Analytics de uso (frontend):**
1. O pacote `@vercel/analytics` é adicionado ao `frontend`.
2. O componente `<Analytics />` é montado no layout raiz (`frontend/src/app/layout.tsx`), uma única vez, envolvendo
   toda a aplicação.
3. Em produção (Vercel), Web Analytics é habilitado no projeto frontend pelo dashboard.
4. A cada navegação real de um usuário, um page view anônimo é enviado e aparece no painel de Web Analytics da Vercel.
5. Em desenvolvimento/local, o componente não envia eventos reais (modo debug), não poluindo as métricas.

**Fluxo B — Keep-alive do banco (cron):**
1. Um endpoint de keep-alive é exposto no **backend** (que é quem tem credencial de banco), executando uma consulta
   trivial e barata (ex.: `SELECT 1`).
2. Um **Vercel Cron Job** é configurado no projeto backend (`backend/vercel.json`) para chamar esse endpoint em
   intervalo regular (padrão: **uma vez por dia**, dentro do limite do plano Hobby).
3. No horário agendado, a Vercel invoca o endpoint; o backend abre conexão com o Supabase, roda a consulta e responde
   `200 OK`.
4. O Supabase registra a atividade; o contador de inatividade é reiniciado e o projeto **não** é pausado.
5. Se a chamada falhar (banco indisponível, erro de rede), o fato fica registrado nos logs de runtime da Vercel para
   diagnóstico.

## 4. User stories

### P1 — Manter o banco vivo automaticamente *(entrega valor sozinha)*
**Como** operador, **quero** um agendamento que toque o banco periodicamente **para** que o Supabase nunca pause o
projeto por inatividade e o app não quebre por falta de banco.

- **Given** o projeto Supabase está no ar e o cron está configurado,
  **when** o horário agendado chega,
  **then** o endpoint de keep-alive é chamado, executa uma consulta trivial no banco e responde `200`, e o Supabase
  contabiliza atividade.
- **Given** se passaram vários dias sem nenhum acesso humano ao app,
  **when** o cron rodou ao menos uma vez dentro da janela de inatividade do Supabase,
  **then** o projeto **não** é pausado e continua respondendo sem intervenção manual.
- **Given** o endpoint de keep-alive,
  **when** ele é chamado,
  **then** ele **não** exige nem expõe dados financeiros, apenas confirma a saúde da conexão (sem vazar informação).

### P2 — Enxergar o uso real do app
**Como** operador, **quero** ver métricas de acesso no painel da Vercel **para** entender quando e como o app é usado,
sem instalar rastreadores de terceiros.

- **Given** `@vercel/analytics` instalado e `<Analytics />` no layout raiz, com Web Analytics ligado no projeto,
  **when** um usuário navega entre rotas do app em produção,
  **then** os page views aparecem no painel de Web Analytics da Vercel em poucos minutos.
- **Given** o app rodando localmente (`next dev`),
  **when** navego entre páginas,
  **then** nenhum evento real é enviado para a Vercel (não contamina as métricas de produção).

### P3 — Não regredir o app ao instrumentar
**Como** proprietário, **quero** que adicionar analytics e o keep-alive **não** altere comportamento nem segurança do
app **para** que as features existentes (login, lançamentos, etc.) continuem idênticas.

- **Given** o `<Analytics />` montado no layout,
  **when** abro qualquer rota autenticada,
  **then** a renderização, o tema e o gate de login funcionam exatamente como antes, sem erros de hidratação.
- **Given** o endpoint de keep-alive exposto no backend,
  **when** um visitante não autorizado tenta acessá-lo,
  **then** ele não consegue ler nenhum dado financeiro por meio dele (o endpoint só devolve um status de saúde).

## 5. Edge cases

- **Catch-all rewrite do backend:** o `backend/vercel.json` reescreve `"/(.*)" → "/api"` (NestJS serverless). O path
  do cron precisa cair numa rota que o NestJS realmente exponha (ex.: `/health/keepalive`), senão o cron recebe 404
  e o keep-alive silenciosamente não funciona.
- **Guarda de API key no backend:** o backend já tem um guard de API key (commit `04d1128`). O cron da Vercel chama o
  endpoint **direto**, sem passar pelo frontend — então ou o keep-alive fica **isento** do guard, ou o cron envia o
  segredo esperado (header/secret de cron). Sem isso, o keep-alive volta `401` e não cumpre o objetivo.
- **Limite de cron do plano Hobby:** na Vercel Hobby, cron jobs rodam **no máximo uma vez por dia**. O intervalo
  precisa caber nesse limite e ainda assim ser mais frequente que a janela de pausa do Supabase (~7 dias) — uma
  execução diária satisfaz folgadamente.
- **Banco já pausado quando o cron roda:** se o projeto **já** estiver pausado, a consulta de keep-alive vai falhar
  (não reativa um projeto pausado). O keep-alive **previne** a pausa, não a desfaz — a primeira ativação após uma
  pausa ainda é manual.
- **Falha transitória da consulta:** timeout/erro de rede no horário agendado não pode derrubar nada além daquela
  execução; deve ser logado e a próxima execução agendada segue normalmente (sem retry agressivo que estoure
  conexões do pooler).
- **Bloqueador de anúncios / privacidade:** extensões podem bloquear o script da Vercel Analytics; nesse caso o page
  view simplesmente não é contado — o app continua funcionando normalmente (analytics é best-effort, nunca crítico).
- **Hidratação do `<Analytics />`:** o componente é client-side; precisa ser montado de forma que não cause mismatch
  de SSR/CSR no `layout.tsx` (que já roda um script inline de tema com `suppressHydrationWarning`).
- **Consumo de cota:** as consultas de keep-alive contam como requisições/invocações na Vercel e no Supabase; o
  intervalo diário mantém esse consumo desprezível, mas não deve ser reduzido a minutos sem necessidade.

## 6. Requisitos funcionais

- **RF-001** — O frontend **DEVE** declarar `@vercel/analytics` como dependência em `frontend/package.json` e
  instalá-la.
- **RF-002** — O frontend **DEVE** montar o componente `<Analytics />` uma única vez no layout raiz
  (`frontend/src/app/layout.tsx`), de modo a cobrir todas as rotas do App Router.
- **RF-003** — Em ambiente de desenvolvimento/local, a instrumentação **DEVE** operar em modo que **não** envie
  eventos reais para a Vercel (sem poluir métricas de produção).
- **RF-004** — O backend **DEVE** expor um endpoint de keep-alive (ex.: `GET /health/keepalive`) que executa uma
  consulta trivial e barata no Postgres (ex.: `SELECT 1`) e responde com um status de saúde, **sem** retornar dados
  financeiros.
- **RF-005** — O projeto backend **DEVE** declarar um **Vercel Cron Job** em `backend/vercel.json` apontando para o
  endpoint de keep-alive, com agendamento que rode pelo menos **uma vez por dia**.
- **RF-006** — O endpoint de keep-alive **DEVE** ser acessível pelo cron da Vercel sem ser barrado pelo guard de API
  key — seja por isenção explícita da rota, seja validando um segredo de cron próprio (`CRON_SECRET`).
- **RF-007** — Uma falha na execução do keep-alive (erro de banco/rede) **DEVE** ser registrada (log de runtime) e
  **NÃO DEVE** afetar o funcionamento do app para os usuários.
- **RF-008** — A instrumentação de analytics **NÃO DEVE** capturar dados financeiros nem informação pessoal
  identificável além do page view anônimo padrão do Vercel Web Analytics.
- **RF-009** — Qualquer variável nova (ex.: `CRON_SECRET`) **DEVERIA** ser documentada nos arquivos `.env*.example`
  correspondentes e configurada no projeto Vercel adequado.
- **RF-010** — O componente de analytics **PODE** ser estendido futuramente com Speed Insights (`@vercel/speed-insights`),
  mas isso fica como evolução, não requisito desta entrega.

## 7. Escopo

**Dentro:**
- Instalação de `@vercel/analytics` no `frontend` e montagem de `<Analytics />` no layout raiz.
- Endpoint de keep-alive no backend executando consulta trivial no Supabase.
- Vercel Cron Job em `backend/vercel.json` chamando o keep-alive em cadência diária.
- Tratamento da isenção do endpoint frente ao guard de API key (ou segredo de cron).
- Documentação de variáveis novas em `.env*.example`.

### Fora do escopo
- **Vercel Speed Insights / Web Vitals** (`@vercel/speed-insights`) — evolução futura, não entra agora.
- **Analytics de eventos customizados** (cliques, conversões, funis) — só page views padrão nesta entrega.
- **Dashboards próprios de métricas** — as métricas vivem no painel da Vercel; não construímos UI própria.
- **Reativar automaticamente um projeto Supabase já pausado** — o keep-alive previne, não ressuscita; reativar
  continua manual.
- **Migrar o Supabase para um plano pago / mudar de provedor** — fora de escopo; a solução é manter o plano atual ativo.
- **Substituir o cron por solução externa** (GitHub Actions, cron de terceiros) — adotamos o Vercel Cron por já
  estarmos na Vercel; alternativas ficam fora.

## 8. Premissas

- **Web Analytics, não Speed Insights:** "instalar `@vercel/analytics`" significa o **Vercel Web Analytics**
  (componente `<Analytics />`). Speed Insights é pacote/feature separada e fica fora. **[Premissa]**
- **Habilitação no dashboard:** além do código, Web Analytics precisa ser **ligado** no projeto frontend pelo painel
  da Vercel; isso é uma ação de configuração do operador, assumida como parte da entrega. **[Premissa]**
- **Cron via Vercel:** o keep-alive será agendado com **Vercel Cron Jobs** (nativo, sem infra extra), e não via
  `pg_cron`/Edge Function do Supabase nem GitHub Actions. **[Premissa]**
- **Cadência diária:** o cron roda **1×/dia**, suficiente para a janela de inatividade (~7 dias) do Supabase e dentro
  do limite do plano Hobby da Vercel (máx. 1×/dia). **[Premissa]**
- **Keep-alive mora no backend:** a consulta de saúde fica no **backend**, que é quem tem `DATABASE_URL`/credencial
  do Postgres; o frontend não fala direto com o banco. **[Premissa]**
- **Consulta trivial é suficiente:** uma única consulta leve (`SELECT 1` ou equivalente) por execução basta para o
  Supabase contar atividade; não é preciso escrever no banco. **[Premissa]**
- **Janela de pausa do Supabase ≈ 7 dias de inatividade** no plano gratuito; o valor exato pode variar, mas a cadência
  diária dá ampla folga. **[Premissa]**
- **Sem impacto de privacidade relevante:** Vercel Web Analytics é cookieless e anônimo, compatível com um app
  pessoal single-user; não há requisito de consentimento adicional. **[Premissa]**

## 9. Critérios de sucesso

- **CS-001** — Após o deploy, o projeto Supabase **não** é pausado por inatividade ao longo de **30 dias** sem acesso
  humano, comprovado pelo projeto seguir respondendo e por execuções diárias do cron com `200` nos logs da Vercel.
- **CS-002** — O Vercel Cron Job aparece como **ativo** no painel do projeto backend e registra **≥ 1 execução
  bem-sucedida por dia** (taxa de sucesso ≥ 95% das execuções agendadas em um período de 7 dias).
- **CS-003** — Com Web Analytics ligado, navegar por **≥ 3 rotas** do app em produção gera page views visíveis no
  painel da Vercel em **≤ 5 minutos**.
- **CS-004** — Em `next dev` local, navegar pelo app gera **0** eventos reais no painel de produção (verificável por
  ausência de novos page views durante o uso local).
- **CS-005** — Nenhuma regressão funcional: as 7 áreas do app (orçamento, categorias, recorrências, reservas,
  relatórios, investimentos, projeções) e o gate de login continuam funcionando **idênticos** após as duas mudanças,
  sem erros de hidratação no console.
- **CS-006** — O endpoint de keep-alive, chamado sem o segredo de cron / fora do guard, **não** retorna nenhum dado
  financeiro (resposta limitada a status de saúde).

## 10. Dependências

- **Frontend Next.js (App Router):** dependência `@vercel/analytics` em
  [`frontend/package.json`](../../../frontend/package.json) e montagem de `<Analytics />` em
  [`frontend/src/app/layout.tsx`](../../../frontend/src/app/layout.tsx).
- **Backend serverless (NestJS):** rota de keep-alive nos módulos em
  [`backend/src/modules`](../../../backend/src), exposta através de [`backend/api/index.ts`](../../../backend/api/index.ts),
  respeitando o rewrite catch-all e o guard de API key (commit `04d1128`).
- **Vercel Cron:** novo bloco `crons` em [`backend/vercel.json`](../../../backend/vercel.json) — hoje contém apenas o
  rewrite `"/(.*)" → "/api"`.
- **Configuração de ambiente / Vercel:** Web Analytics ligado no projeto frontend; eventual `CRON_SECRET` no projeto
  backend; variáveis documentadas nos `.env*.example`.
- **Infra de deploy existente:** assume o ambiente descrito na
  [memória de deploy Supabase + Vercel](../deploy-nuvem-vercel-supabase/prd_deploy-nuvem-vercel-supabase.md)
  (Supabase ref `ckfrxfbfjpjfpeqkiufc`, team Vercel `feesene's projects`, backend conecta como role `postgres`).
