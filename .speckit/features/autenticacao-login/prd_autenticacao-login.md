# PRD — Autenticação por senha única (Login)

- **Projeto:** financas-pessoais
- **Prioridade:** P8 (pré-requisito para qualquer exposição pública — ver [deploy na nuvem](../deploy-nuvem-vercel-supabase/prd_deploy-nuvem-vercel-supabase.md))
- **Status:** Proposto
- **Premissa que altera:** revoga a premissa "sem autenticação" do [objetivo do sistema](../../../docs/objetivo-do-sistema.md)

## 1. Contexto e problema

O app é hoje **single-user e sem login**: qualquer pessoa com acesso à URL (`localhost:3000` hoje, um domínio público
amanhã) vê e edita todas as finanças do proprietário. A própria documentação registra que **"qualquer exposição na
internet exige antes implementar autenticação e isolamento de dados"** ([objetivo-do-sistema.md](../../../docs/objetivo-do-sistema.md)).

Como o sistema tem **um único dono** e não há multiusuário, não é necessário cadastro, perfis ou banco de usuários.
Basta um **portão de senha única**: o app fica protegido por uma senha definida em variável de ambiente
(`APP_PASSWORD`); quem informa a senha correta recebe uma sessão autenticada e passa a usar o app normalmente; quem
não informa é redirecionado para a tela de login. Esta feature implementa esse portão, no frontend (Next.js App
Router), de forma que funcione tanto no uso local quanto depois na nuvem.

## 2. Usuários-alvo

- **Proprietário (usuário único).** Pessoa física que controla as próprias finanças e conhece a senha definida no
  `.env`. É o único ator que deve passar pelo login.
- **Visitante não autenticado (negativo).** Qualquer pessoa sem a senha — deve ser barrada em todas as telas e
  endpoints de dados, vendo apenas a tela de login.

## 3. Fluxo principal

1. Um visitante acessa qualquer rota do app (ex.: `/orcamento`).
2. Não havendo sessão válida, o middleware do Next.js o redireciona para `/login`.
3. Na tela de login ele informa a senha e confirma.
4. O servidor compara a senha com `APP_PASSWORD` (comparação em tempo constante):
   - **Correta:** cria uma sessão (cookie `httpOnly`, `Secure`, `SameSite=Lax`, assinado) e redireciona para a rota
     originalmente pedida (ou para `/` quando não houver).
   - **Incorreta:** permanece em `/login` com mensagem "Senha incorreta", sem revelar nada além disso.
5. Com sessão válida, o usuário navega e usa todas as features normalmente; a Topbar exibe uma ação **"Sair"**.
6. Ao clicar em "Sair", a sessão é invalidada (cookie removido) e ele volta para `/login`.
7. A sessão expira automaticamente após o tempo configurado; expirada, qualquer ação leva de volta ao login.

## 4. User stories

### P1 — Entrar com a senha e acessar o app *(entrega valor sozinha)*
**Como** proprietário, **quero** informar minha senha e abrir uma sessão **para** que só eu consiga ver e editar
minhas finanças.

- **Given** estou deslogado e abro `/orcamento`,
  **when** a página carrega,
  **then** sou redirecionado para `/login` e não vejo nenhum dado financeiro.
- **Given** estou em `/login` e a senha correta é a definida em `APP_PASSWORD`,
  **when** digito a senha correta e confirmo,
  **then** recebo um cookie de sessão e sou levado para a rota que eu havia pedido (ou `/`).
- **Given** estou em `/login`,
  **when** digito uma senha errada,
  **then** continuo em `/login` com a mensagem "Senha incorreta" e **nenhum** cookie de sessão é criado.

### P2 — Permanecer logado e sair quando quiser
**Como** proprietário, **quero** continuar logado entre navegações e poder sair **para** não digitar a senha a cada
clique e poder encerrar a sessão num dispositivo compartilhado.

- **Given** estou autenticado,
  **when** navego entre `/orcamento`, `/reservas` e `/investimentos` e recarrego a página,
  **then** continuo autenticado sem nova solicitação de senha.
- **Given** estou autenticado,
  **when** clico em "Sair" na Topbar,
  **then** o cookie de sessão é apagado e sou redirecionado para `/login`; voltar no navegador não restaura o acesso.

### P3 — Proteger também os dados, não só as telas
**Como** proprietário, **quero** que as chamadas de dados exijam sessão **para** que ninguém leia/escreva minhas
finanças contornando a interface.

- **Given** não tenho sessão válida,
  **when** uma server action de dados é invocada (ex.: listar lançamentos, criar reserva),
  **then** a ação falha com 401 e nenhum dado é retornado ou gravado.
- **Given** minha sessão expirou pelo tempo configurado,
  **when** tento qualquer ação que busca/grava dados,
  **then** sou redirecionado para `/login` e, após reautenticar, retorno ao app.

## 5. Edge cases

- **`APP_PASSWORD` ausente ou vazia no ambiente:** o app **não** deve subir "aberto"; deve falhar de forma segura —
  bloquear o login com mensagem de erro de configuração (e log no servidor), nunca liberar acesso sem senha.
- **Cookie de sessão adulterado/forjado:** assinatura inválida deve ser tratada como "sem sessão" → redireciona para
  `/login`; nunca confiar no conteúdo do cookie sem validar a assinatura.
- **Senha correta porém com espaços/whitespace nas pontas:** a comparação considera a senha exatamente como em
  `APP_PASSWORD`; entradas do usuário têm `trim` apenas nas bordas do campo, documentado, para evitar falso negativo.
- **Acesso direto a uma rota profunda enquanto deslogado:** após login, o usuário deve voltar para **aquela** rota
  (preservar `redirectTo`), não para a home genérica.
- **Múltiplas tentativas de senha em sequência:** aplicar atraso/limite básico (ex.: pequeno _backoff_ após N erros)
  para dificultar força bruta, sem travar permanentemente o único dono.
- **Sessão aberta em outro dispositivo após trocar `APP_PASSWORD`:** ao mudar a senha/segredo de assinatura, sessões
  antigas devem deixar de ser válidas (invalidação por rotação de segredo).
- **Rota pública necessária ao login:** `/login` e os assets estáticos não podem ser bloqueados pelo próprio gate
  (senão o usuário nunca consegue logar) — allowlist explícita no middleware.

## 6. Requisitos funcionais

- **RF-001** — O sistema **DEVE** oferecer uma rota `/login` com um campo de senha e ação de envio, acessível sem
  sessão.
- **RF-002** — O sistema **DEVE** validar a senha enviada contra a variável de ambiente `APP_PASSWORD` no **servidor**,
  usando comparação em tempo constante, sem expor a senha ao cliente.
- **RF-003** — Em caso de sucesso, o sistema **DEVE** criar uma sessão representada por um cookie `httpOnly`, `Secure`
  (em produção), `SameSite=Lax`, assinado com um segredo de servidor (`AUTH_SECRET`).
- **RF-004** — O sistema **DEVE** bloquear, via middleware do Next.js, o acesso a todas as rotas de aplicação quando
  não houver sessão válida, redirecionando para `/login?redirectTo=<rota>`; `/login` e assets estáticos ficam em
  allowlist.
- **RF-005** — As **server actions** que leem ou gravam dados **DEVEM** exigir sessão válida e falhar com 401 quando
  ausente, sem retornar nem persistir dados.
- **RF-006** — O sistema **DEVE** oferecer uma ação **"Sair"** na Topbar que invalida a sessão (remove o cookie) e
  redireciona para `/login`.
- **RF-007** — A sessão **DEVERIA** expirar após um tempo configurável (`AUTH_SESSION_TTL`, padrão sugerido 7 dias);
  expirada, o acesso é tratado como deslogado.
- **RF-008** — Quando `APP_PASSWORD` ou `AUTH_SECRET` não estiverem definidos, o sistema **DEVE** recusar autenticação
  (fail-safe) e registrar erro de configuração, nunca liberar acesso.
- **RF-009** — Após login bem-sucedido, o sistema **DEVERIA** redirecionar para o valor de `redirectTo` quando válido
  (mesma origem), caindo em `/` caso contrário.
- **RF-010** — O sistema **PODE** aplicar um _backoff_/limite simples de tentativas por IP/sessão para mitigar força
  bruta.

## 7. Escopo

**Dentro:** tela `/login`; validação de senha única no servidor; criação/validação de sessão por cookie assinado;
middleware de proteção de rotas; guarda de sessão nas server actions; ação "Sair"; expiração de sessão; tratamento
fail-safe de configuração ausente; variáveis `APP_PASSWORD`, `AUTH_SECRET` e `AUTH_SESSION_TTL` documentadas no
`.env.example` e no `frontend/.env.local.example`.

### Fora do escopo
- **Cadastro de usuários, múltiplos perfis e papéis** — o app é single-user; não há banco de usuários.
- **Recuperação/troca de senha pela UI** — a senha vive no `.env`; alterá-la é editar a variável e reimplantar.
- **Login social / OAuth / 2FA / magic link** — não fazem parte deste portão simples.
- **Isolamento de dados por usuário (multi-tenant)** — sem multiusuário, não há partição de dados por dono.
- **Autorização granular por feature** — autenticado = acesso total (dono único).
- **Hospedagem/infra de nuvem** — tratada no [PRD de deploy](../deploy-nuvem-vercel-supabase/prd_deploy-nuvem-vercel-supabase.md).

## 8. Premissas

- **App single-user:** existe **uma** senha para **um** dono; "autenticado" significa "é o dono". Não há identidade
  individual a rastrear. **[Premissa]**
- **Onde mora a sessão:** a autenticação é implementada na **camada Next.js** (middleware + server actions), que já é
  o ponto por onde o frontend fala com o backend. Assim o mesmo gate protege uso local e, depois, o app na Vercel.
  **[Premissa]**
- **Senha no ambiente:** conforme pedido, a senha fica em `APP_PASSWORD` (não versionada); apenas um exemplo
  placeholder vai para os arquivos `.env*.example`. **[Premissa]**
- **Mesma senha na nuvem:** este mesmo portão protegerá o app público na Vercel (decisão confirmada), sem um segundo
  mecanismo de auth. **[Premissa]**
- **Segredo de sessão:** a assinatura do cookie usa `AUTH_SECRET` (gerado aleatoriamente, ≥ 32 bytes), distinto da
  senha de acesso, para permitir rotação independente. **[Premissa]**
- **TTL padrão:** 7 dias de sessão, configurável; valor escolhido por conveniência de uso pessoal. **[Premissa]**
- **Cookie `Secure`:** ativado quando em produção/HTTPS; em `localhost` (HTTP) o flag `Secure` é relaxado para o
  desenvolvimento funcionar. **[Premissa]**

## 9. Critérios de sucesso

- **CS-001** — Com o app no ar, **100%** das rotas de aplicação acessadas sem sessão redirecionam para `/login` e
  **nenhum** dado financeiro é renderizado antes do login (verificável em todas as 7 áreas: orçamento, categorias,
  recorrências, reservas, relatórios, investimentos, projeções).
- **CS-002** — Informar a senha correta cria a sessão e dá acesso em **≤ 1 requisição** (um envio do formulário), e a
  sessão **persiste** por recarga de página e navegação entre rotas dentro do TTL.
- **CS-003** — Com sessão ausente/expirada, **100%** das server actions de dados respondem 401 e **não** persistem
  alterações (testável por chamada direta sem cookie).
- **CS-004** — Com `APP_PASSWORD` ou `AUTH_SECRET` não definidos, o app **nunca** concede acesso (0% de logins
  bem-sucedidos) e registra o erro de configuração.
- **CS-005** — "Sair" remove o acesso: após o clique, **0** rotas protegidas ficam acessíveis sem novo login (incluindo
  navegação "voltar" do navegador).

## 10. Dependências

- **Frontend Next.js (App Router)** — `frontend/src/middleware.ts` (a criar), nova rota `frontend/src/app/login/`,
  utilitário de sessão (ex.: assinar/validar cookie) e ação de logout na [Topbar](../../../frontend/src/components/layout/Topbar.tsx).
- **Guarda nas server actions** — helper compartilhado para as ações em [`frontend/src/lib/api/actions/`](../../../frontend/src/lib/api/actions) exigirem sessão; reaproveita o padrão `ApiResult`/`unwrap` de [`core.ts`](../../../frontend/src/lib/api/core.ts).
- **Configuração de ambiente** — novas variáveis em [`.env.example`](../../../.env.example) e
  [`frontend/.env.local.example`](../../../frontend/.env.local.example): `APP_PASSWORD`, `AUTH_SECRET`,
  `AUTH_SESSION_TTL`.
- **Bloqueia** o [PRD de deploy na nuvem](../deploy-nuvem-vercel-supabase/prd_deploy-nuvem-vercel-supabase.md):
  expor publicamente só é permitido com este portão ativo.
