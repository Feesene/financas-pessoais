# PRD — Orçamento Mensal (P1)

- **Projeto:** financas-pessoais
- **Prioridade:** P1 (primeira feature do MVP)
- **Status:** Proposto
- **Substitui:** aba "Despesas" da planilha "Despesas - 2026.xlsx"

## 1. Contexto e problema

O controle financeiro do usuário hoje vive numa planilha cuja aba principal ("Despesas") registra, mês a mês,
**receitas e despesas por categoria** e calcula o **saldo do mês**. A planilha é frágil: fórmulas quebram ao
inserir linhas, não há validação de valores, e a navegação entre meses depende de colunas lado a lado.

Esta feature reproduz e moderniza essa aba: registrar lançamentos por categoria num mês de competência, ver os
totais de receita e despesa e o saldo do mês, e navegar entre os meses do ano — com validação e sem o risco de
quebrar fórmulas.

## 2. Usuários-alvo

- **Proprietário (usuário único).** Pessoa física que controla as próprias finanças, em R$, num app local sem
  login. Único perfil do sistema no MVP.

## 3. Fluxo principal

1. O usuário abre o app no mês corrente (competência `AAAA-MM`).
2. Adiciona lançamentos informando: tipo (Receita/Despesa), categoria, valor e descrição opcional.
3. A tela exibe, em tempo real: **total de receitas**, **total de despesas** e **saldo do mês**
   (receitas − despesas), além das listas agrupadas por categoria.
4. O usuário pode editar ou excluir um lançamento; os totais recalculam.
5. O usuário navega para outro mês (anterior/seguinte) e vê os lançamentos e o saldo daquele mês.

## 4. User stories

### P1 — Registrar lançamentos e ver o saldo do mês *(entrega valor sozinha)*
**Como** proprietário, **quero** registrar receitas e despesas por categoria num mês **para** saber meu saldo
do mês sem depender da planilha.

- **Given** estou na competência `2026-05` sem lançamentos,
  **when** crio uma despesa "Cartão" de R$ 2.000,00 e uma receita "Salário" de R$ 3.728,39,
  **then** vejo total de receitas R$ 3.728,39, total de despesas R$ 2.000,00 e saldo do mês R$ 1.728,39.
- **Given** tento criar um lançamento com valor 0 ou negativo,
  **when** confirmo,
  **then** o sistema rejeita com mensagem clara e nada é salvo.

### P2 — Editar e excluir lançamentos
**Como** proprietário, **quero** corrigir ou remover um lançamento **para** manter os totais corretos.

- **Given** existe uma despesa "PIX" de R$ 107,90 em `2026-05`,
  **when** edito o valor para R$ 150,00,
  **then** o lançamento é atualizado e o total de despesas e o saldo recalculam.
- **Given** existe uma receita lançada por engano,
  **when** a excluo,
  **then** ela some da lista e os totais recalculam.

### P3 — Navegar entre meses
**Como** proprietário, **quero** alternar entre os meses do ano **para** acompanhar a evolução mês a mês.

- **Given** estou em `2026-05`,
  **when** clico em "mês anterior",
  **then** vejo os lançamentos e o saldo de `2026-04`.
- **Given** estou em um mês sem lançamentos,
  **when** abro a tela,
  **then** vejo totais zerados (R$ 0,00) e um estado vazio convidando a adicionar o primeiro lançamento.

## 5. Requisitos funcionais

- **RF-001** — O sistema **DEVE** permitir criar um lançamento com tipo (`RECEITA`|`DESPESA`), categoria,
  valor e descrição opcional, associado a uma competência `AAAA-MM`.
- **RF-002** — O sistema **DEVE** rejeitar lançamentos com valor menor ou igual a zero e com categoria vazia.
- **RF-003** — O sistema **DEVE** listar os lançamentos de uma competência, agrupados por tipo e por categoria.
- **RF-004** — O sistema **DEVE** calcular e exibir, por competência: total de receitas, total de despesas e
  saldo do mês (receitas − despesas).
- **RF-005** — O sistema **DEVE** permitir editar e excluir um lançamento existente, recalculando os totais.
- **RF-006** — O sistema **DEVE** permitir navegar entre competências (mês anterior/seguinte e seleção direta
  de mês/ano).
- **RF-007** — O sistema **DEVERIA** exibir valores formatados em R$ (pt-BR, duas casas decimais).
- **RF-008** — O sistema **DEVERIA** oferecer uma lista inicial de categorias sugeridas (Salário, Vale, FGTS,
  Cartão, Condomínio, Internet, Energia, Água, PIX, Outros…), permitindo digitar uma categoria livre.
- **RF-009** — O sistema **PODE** destacar visualmente saldo negativo (despesas > receitas) no mês.

## 6. Escopo

**Dentro:** CRUD de lançamentos por competência; totais de receita/despesa e saldo do mês; navegação entre
meses; formatação em R$; categoria como atributo de texto (com sugestões).

### Fora do escopo
- **Gestão de categorias e metas/orçamento por categoria** — é a feature P2.
- **Lançamentos recorrentes/parcelados** — é a feature P3.
- **Relatórios, gráficos e exportação** — é a feature P5.
- **Importação de planilha/CSV** — backlog.
- **Autenticação/multiusuário** — fora do MVP (uso local).

## 7. Premissas

- A categoria, em P1, é um **atributo de texto** do lançamento (o backend já modela `categoria: string`). A
  gestão formal de categorias (cadastro, cor, ordenação) e metas fica para **P2**.
- Competência é o **mês de referência** (`AAAA-MM`); não há campo de data exata do lançamento no MVP de P1.
  **[Premissa]** — pode ser adicionado depois se necessário.
- Valores monetários positivos; o sinal é dado pelo tipo. Persistência em `numeric(12,2)`.
- App single-user, local, sem login — não há escopo de permissão.
- Idioma pt-BR, moeda R$ (BRL).

## 8. Critérios de sucesso

- **CS-001** — É possível reproduzir um mês real da planilha (ex.: Janeiro/2026) e o **saldo do mês calculado
  bate exatamente** com o valor da planilha (diferença R$ 0,00).
- **CS-002** — Criar, editar e excluir um lançamento reflete nos totais **em no máximo 1 segundo** (operação
  local) sem recarregar a página inteira.
- **CS-003** — 100% das tentativas de salvar valor ≤ 0 ou categoria vazia são **bloqueadas** com mensagem de
  erro, sem persistir dados inválidos.
- **CS-004** — O usuário consegue navegar para qualquer mês do ano e ver os dados corretos daquele mês em **até
  2 cliques**.

## 9. Dependências

- Módulo backend `lancamentos` já existente (criar/listar). **Faltam** os casos de uso de **editar** e
  **excluir**, e o cálculo agregado de totais por competência.
- Contrato `LancamentoDTO` em `@financas-pessoais/shared`.
