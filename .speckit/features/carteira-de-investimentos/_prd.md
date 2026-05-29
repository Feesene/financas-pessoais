# PRD — Carteira de Investimentos (P6)

- **Projeto:** financas-pessoais
- **Prioridade:** P6 (MVP)
- **Status:** Proposto
- **Depende de:** Independente (integra-se opcionalmente com P4 Reservas e P5 Relatórios)

## 1. Contexto e problema

A aba "Investimentos" da planilha controla a **carteira de renda variável e fundos** do usuário: **Fundos**
(descrição, valor bruto, rendimento), **Ações** (descrição, quantidade, valor unitário, valor bruto =
quantidade × unitário) e **FIIs** (mesma estrutura das ações), além de um **total de renda variável** e um
histórico mensal de **entrada/saída/rendimento**. Todos os valores são **digitados manualmente** (a planilha
não busca cotações). Esta feature reproduz esse controle como um inventário de ativos com posição atual e
histórico de movimentações.

## 2. Usuários-alvo

- **Proprietário (usuário único).** Quer registrar manualmente sua carteira (fundos, ações, FIIs), ver o valor
  total investido e acompanhar entradas, saídas e rendimentos mês a mês.

## 3. Fluxo principal

1. O usuário cadastra **ativos** classificados por tipo: `FUNDO`, `ACAO` ou `FII`.
2. Para ações/FIIs informa **quantidade** e **valor unitário** (o valor bruto é calculado); para fundos informa
   o **valor bruto** diretamente, mais o **rendimento** acumulado.
3. O app mostra a **posição atual** por ativo e por tipo, e o **total da carteira**.
4. A cada mês o usuário registra **movimentações** (entrada/aporte, saída/resgate, rendimento) e acompanha a
   evolução da carteira.

## 4. User stories

### P1 — Cadastrar ativos e ver o total da carteira *(entrega valor sozinha)*
**Como** proprietário, **quero** cadastrar meus ativos (fundos, ações, FIIs) **para** ver quanto tenho
investido no total.
- **Given** cadastro a ação "PETR4" com 100 cotas a R$ 38,50, **when** salvo, **then** o valor bruto do ativo é
  R$ 3.850,00.
- **Given** ativos de tipos diferentes, **when** abro a carteira, **then** vejo o subtotal por tipo (fundos,
  ações, FIIs) e o **total geral** da carteira.

### P2 — Editar posição e rendimento
**Como** proprietário, **quero** atualizar quantidade, valor unitário e rendimento **para** manter a carteira
fiel à realidade.
- **Given** a ação "PETR4" com 100 cotas, **when** atualizo o valor unitário para R$ 40,00, **then** o valor
  bruto passa a R$ 4.000,00 e o total da carteira reflete a mudança.
- **Given** um fundo com rendimento R$ 120,00, **when** atualizo para R$ 150,00, **then** o rendimento exibido
  e somado é R$ 150,00.

### P3 — Histórico de movimentações mensais
**Como** proprietário, **quero** registrar entradas, saídas e rendimentos por mês **para** acompanhar a
evolução da carteira.
- **Given** movimentações em vários meses, **when** abro o histórico, **then** vejo, por competência, a soma de
  entradas, saídas e rendimentos e a posição ao final do mês.
- **Given** uma saída maior que a entrada no mês, **when** registro, **then** o sistema aceita e reflete o
  fluxo líquido negativo no mês (sem bloquear).

## 5. Requisitos funcionais

- **RF-001** — O sistema **DEVE** permitir CRUD de ativos com tipo `FUNDO`, `ACAO` ou `FII`, descrição e dados
  de posição.
- **RF-002** — Para `ACAO`/`FII`, o sistema **DEVE** calcular o valor bruto = quantidade × valor unitário.
- **RF-003** — Para `FUNDO`, o sistema **DEVE** aceitar o valor bruto informado diretamente e um rendimento
  acumulado.
- **RF-004** — O sistema **DEVE** exibir o subtotal por tipo e o **total** da carteira.
- **RF-005** — O sistema **DEVE** permitir registrar movimentações mensais (`ENTRADA`, `SAIDA`, `RENDIMENTO`)
  por competência.
- **RF-006** — O sistema **DEVE** exibir o histórico mensal de entradas, saídas e rendimentos.
- **RF-007** — O sistema **DEVERIA** mostrar o rendimento total da carteira (soma dos rendimentos) e, se
  possível, o percentual sobre o investido.
- **RF-008** — O sistema **PODE** integrar o total da carteira ao balde "Investimento" de P4 como referência
  (sem acoplamento obrigatório).

## 6. Escopo

**Dentro:** cadastro/edição/exclusão de ativos (fundo/ação/FII); cálculo de valor bruto; total por tipo e
geral; movimentações mensais (entrada/saída/rendimento); histórico mensal.

### Fora do escopo
- **Busca automática de cotações em tempo real** (API de bolsa) — backlog; aqui os valores são manuais.
- **Cálculo de imposto de renda / DARF sobre operações** — futuro.
- **Importação de notas de corretagem / integração com corretoras** — futuro.

## 7. Premissas

- Todos os valores são **inseridos manualmente**; não há cotação automática. **[Premissa]**
- O "valor bruto" da ação/FII é sempre derivado de quantidade × valor unitário (fonte única); para fundos é
  informado direto. **[Premissa]**
- Rendimento é um valor **informado** (não calculado a partir de preço de compra), espelhando a planilha.
  **[Premissa]**

## 8. Critérios de sucesso

- **CS-001** — O total da carteira reproduz a célula "Total de renda variável" + fundos da planilha para um
  estado real (diferença R$ 0,00).
- **CS-002** — O valor bruto de uma ação/FII é sempre quantidade × valor unitário (erro 0), verificável em ≥ 3
  ativos.
- **CS-003** — O histórico mensal soma corretamente entradas, saídas e rendimentos por competência (erro 0).

## 9. Dependências

- Independente em dados próprios. Integra-se **opcionalmente** com P4 (balde "Investimento" como referência
  contábil) e com P5 (o total da carteira pode aparecer nos relatórios).
