# PRD — Projeções (Juros Compostos) (P7)

- **Projeto:** financas-pessoais
- **Prioridade:** P7 (MVP)
- **Status:** Proposto
- **Depende de:** Independente (opcionalmente pré-preenche valores de P6 Carteira)

## 1. Contexto e problema

A aba "Projeções" da planilha é uma **calculadora de juros compostos**: a partir de um aporte inicial
(Entrada), um valor investido mensalmente, uma taxa anual e um horizonte em anos, projeta quanto o usuário
teria ao longo do tempo, comparando o cenário **"Não investido"** (dinheiro guardado sem render, crescimento
linear) com o cenário **"Investido"** (com juros compostos). É uma ferramenta de planejamento, em sua maioria
**stateless** — não depende dos lançamentos reais, embora possa partir de valores já existentes na carteira.

## 2. Usuários-alvo

- **Proprietário (usuário único).** Quer simular o crescimento do patrimônio para planejar aportes e entender o
  efeito dos juros compostos no longo prazo.

## 3. Fluxo principal

1. O usuário informa: **Entrada** (aporte inicial), **aporte mensal**, **taxa anual** (%), e **tempo em anos**.
2. O sistema calcula, ano a ano, o valor acumulado em dois cenários: **não investido** (só a soma dos aportes) e
   **investido** (com juros compostos sobre saldo + aportes).
3. O app mostra uma **tabela ano a ano** e um **gráfico** comparando os dois cenários, mais o **total final** e
   os **juros ganhos** (diferença entre investido e não investido).
4. O usuário ajusta os parâmetros e a projeção recalcula imediatamente.

## 4. User stories

### P1 — Calcular projeção de juros compostos *(entrega valor sozinha)*
**Como** proprietário, **quero** informar aporte inicial, aporte mensal, taxa e prazo **para** ver quanto meu
dinheiro renderia ao longo dos anos.
- **Given** entrada R$ 10.000,00, aporte mensal R$ 500,00, taxa 10% a.a. e 10 anos, **when** calculo, **then**
  vejo o valor acumulado ano a ano no cenário investido e o total final.
- **Given** os mesmos parâmetros, **when** vejo o cenário "não investido", **then** o valor ano a ano é apenas a
  soma da entrada com os aportes acumulados (sem rendimento).

### P2 — Comparar investido vs não investido
**Como** proprietário, **quero** comparar os dois cenários **para** dimensionar o ganho dos juros compostos.
- **Given** uma projeção calculada, **when** abro a comparação, **then** vejo, no ano final, o total investido,
  o total não investido e a diferença (juros ganhos).
- **Given** taxa 0% a.a., **when** calculo, **then** os cenários investido e não investido coincidem.

### P3 — Ajustar parâmetros e visualizar gráfico
**Como** proprietário, **quero** alterar os parâmetros e ver o gráfico atualizar **para** testar cenários
rapidamente.
- **Given** uma projeção exibida, **when** altero o aporte mensal, **then** a tabela e o gráfico recalculam sem
  recarregar a página.
- **Given** um tempo de 30 anos, **when** calculo, **then** o gráfico mostra a curva de juros compostos
  divergindo da reta do não investido.

## 5. Requisitos funcionais

- **RF-001** — O sistema **DEVE** receber Entrada, aporte mensal, taxa anual (%) e tempo (anos) e validar (≥ 0;
  tempo > 0).
- **RF-002** — O sistema **DEVE** calcular o cenário **não investido** = entrada + (aporte mensal × meses), ano
  a ano.
- **RF-003** — O sistema **DEVE** calcular o cenário **investido** com juros compostos sobre saldo + aportes
  mensais (capitalização mensal a partir da taxa anual).
- **RF-004** — O sistema **DEVE** apresentar o resultado **ano a ano** (saldo investido, saldo não investido,
  total aportado, juros acumulados).
- **RF-005** — O sistema **DEVE** mostrar o **total final** e os **juros ganhos** (investido − não investido).
- **RF-006** — O sistema **DEVERIA** exibir um **gráfico** comparando os dois cenários ao longo do tempo.
- **RF-007** — O sistema **PODE** pré-preencher a Entrada com o total atual da carteira (P6).
- **RF-008** — O sistema **PODE** salvar cenários nomeados para reabrir depois.

## 6. Escopo

**Dentro:** calculadora de juros compostos com aporte inicial + aportes mensais; cenário investido vs não
investido; tabela ano a ano; total final e juros ganhos; gráfico comparativo.

### Fora do escopo
- **Projeção com inflação / valor presente líquido** — futuro; aqui é nominal.
- **Aportes variáveis por período / taxa variável ao longo do tempo** — futuro; aqui taxa e aporte são
  constantes.
- **Tributação sobre rendimentos na projeção** — futuro.

## 7. Premissas

- A calculadora é **nominal** (sem inflação) e usa **taxa e aporte constantes** no período. **[Premissa]**
- A taxa anual é convertida para **mensal equivalente** (`(1+i_a)^(1/12) − 1`) e a capitalização é **mensal**,
  com aportes no fim de cada mês. **[Premissa]** (ver Decisões da Spec)
- A feature é majoritariamente **stateless**: o cálculo não persiste por padrão (salvar cenário é opcional —
  RF-008). **[Premissa]**

## 8. Critérios de sucesso

- **CS-001** — Para entrada R$ 0, aporte R$ 100/mês, 12% a.a., 1 ano, o resultado investido bate com uma
  calculadora de juros compostos de referência (diferença ≤ R$ 0,01).
- **CS-002** — Com taxa 0% a.a., o cenário investido é **igual** ao não investido em todos os anos (erro 0).
- **CS-003** — Os juros ganhos no ano final = saldo investido − saldo não investido, conferível na tabela
  (erro 0).

## 9. Dependências

- Independente. Integração **opcional** com P6 (pré-preencher a Entrada com o total da carteira).
