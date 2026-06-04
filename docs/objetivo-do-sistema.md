# Objetivo do Sistema — financas-pessoais

## Propósito principal

Substituir a planilha de despesas pessoais por uma aplicação web única, em português e R$ (BRL), que reúne
**orçamento mensal**, **reservas por objetivo**, **carteira de investimentos** e **projeções financeiras** —
do jeito do usuário, sem assinatura e sem as fragilidades de uma planilha.

## Problemas que resolve

- **Fragilidade da planilha**: fórmulas que quebram, ausência de validação, risco de sobrescrever células.
- **Trabalho manual repetitivo**: relançar assinaturas e parcelas todo mês.
- **Falta de automação**: sem alertas de estouro de orçamento, sem consolidação automática de histórico.
- **Visão fragmentada**: orçamento, reservas e investimentos espalhados em abas/arquivos distintos.

## Principais fluxos de negócio

1. **Registrar lançamentos** — informar receitas e despesas por categoria num mês de competência (AAAA-MM) e
   ver o **saldo do mês** (receitas − despesas). *(P1)*
2. **Definir metas por categoria** — limite mensal por categoria e alerta ao ultrapassar. *(P2)*
3. **Automatizar recorrências** — assinaturas e parcelas que se repetem sem redigitar. *(P3)*
4. **Gerir reservas por objetivo** — "baldes" (ex.: Poupança, Viagem) com aportes e retiradas e saldo
   acumulado. *(P4)*
5. **Consolidar histórico e relatórios** — visão mês a mês / ano a ano, gráficos e exportação. *(P5)*
6. **Acompanhar a carteira** — ações, FIIs e fundos, com total de renda variável. *(P6)*
7. **Projetar o futuro** — calculadora de juros compostos: "não investido" × "investido". *(P7)*

## Atores envolvidos

- **Usuário único (proprietário)** — pessoa física que controla as próprias finanças. Único perfil do MVP.
- **Sistemas externos** — nenhum no MVP (sem integração bancária, sem cotações automáticas). Candidatos
  futuros: Open Finance, APIs de cotação — ver [BACKLOG](./BACKLOG.md).

## Funcionalidades centrais

- Lançamentos de receita/despesa por categoria e competência, com saldo mensal.
- Categorias com orçamento/meta e alertas.
- Lançamentos recorrentes e parcelados.
- Reservas por objetivo (aportes/retiradas, saldo por balde).
- Histórico consolidado, dashboards e exportação.
- Carteira de renda variável (ações, FIIs, fundos).
- Projeção de juros compostos.

## Visão de produto

Posiciona-se como **painel financeiro pessoal completo e privado**, reunindo num só lugar o que apps de mercado
costumam separar (orçamento vs. investimentos) e o que planilhas fazem de forma frágil. Diferencial: feito sob
medida para o uso do proprietário, em português/R$, sem limite de categorias e sem mensalidade.

**Fora de escopo no MVP** (backlog): importação de planilha/CSV, Open Finance, cotações automáticas, multiusuário
(o login é por senha única, single-user), app mobile.

## Contexto operacional

- **Execução local** na máquina do usuário: frontend Next.js (`:3000`), API NestJS (`:3001`), PostgreSQL via
  Docker (`:5432`).
- **Autenticação por senha única (portão de acesso):** o app é protegido por uma senha definida em `APP_PASSWORD`;
  sem sessão válida, todas as rotas e server actions de dados são bloqueadas e redirecionam para `/login`
  (ver [feature de login](../.speckit/features/autenticacao-login/spec_autenticacao-login.md)). Isso revoga a
  premissa original "sem autenticação" e habilita a exposição pública. Como o sistema é single-user, não há
  multiusuário nem isolamento de dados por dono.
- Configuração por variáveis de ambiente (`.env`), com exemplos versionados (`.env.example`).
