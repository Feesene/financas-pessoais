# PRD — Histórico e Relatórios/Dashboards (P5)

- **Projeto:** financas-pessoais
- **Prioridade:** P5 (MVP)
- **Status:** Proposto
- **Depende de:** P1 (Orçamento Mensal), P2 (Categorias e Metas), P4 (Reservas por Objetivo)

## 1. Contexto e problema

A aba "Histórico/Resumo" da planilha consolida o ano inteiro em uma visão por mês: quanto foi **líquido
recebido**, quanto foi **gasto**, quanto foi para **poupança** e **viagem**, e quanto **sobrou**. Hoje essa
consolidação é feita com fórmulas manuais que somam as outras abas. Esta feature reproduz essa visão
consolidada e adiciona o que toda planilha de despesas madura oferece: **gráficos** (gasto por categoria,
evolução mensal), **comparação entre meses** e **exportação** (PDF/Excel). Os dados são em sua maioria
**derivados** das features P1/P2/P4 — não há entrada manual nova relevante.

## 2. Usuários-alvo

- **Proprietário (usuário único).** Quer enxergar o ano inteiro de uma vez, entender para onde o dinheiro foi e
  comparar meses sem reabrir cada tela individualmente.

## 3. Fluxo principal

1. O usuário abre a tela de **Histórico** e escolhe um ano (ou intervalo de competências).
2. O sistema mostra uma **tabela consolidada por mês**: líquido recebido, gastos, poupança, viagem e sobras.
3. O usuário abre **Relatórios** e vê gráficos: gasto por categoria no período, evolução mensal de
   receitas/despesas/saldo, e comparação entre dois meses.
4. O usuário **exporta** o relatório atual em PDF ou Excel para guardar/compartilhar.

## 4. User stories

### P1 — Visão consolidada anual *(entrega valor sozinha)*
**Como** proprietário, **quero** ver um resumo de todos os meses do ano em uma tabela **para** entender a
evolução das minhas finanças sem abrir cada mês.
- **Given** lançamentos em `2026-01`..`2026-12`, **when** abro o histórico de 2026, **then** vejo uma linha por
  mês com líquido recebido, gastos, poupança, viagem e sobras, mais uma linha de **totais do ano**.
- **Given** um mês sem nenhum lançamento, **when** abro o histórico, **then** aquele mês aparece com valores
  zerados (não some da tabela).

### P2 — Gráficos do período
**Como** proprietário, **quero** ver gráficos de gasto por categoria e de evolução mensal **para** identificar
visualmente onde gasto mais e como evoluo.
- **Given** despesas categorizadas no período, **when** abro o relatório de categorias, **then** vejo um
  gráfico de pizza/barras com o total gasto por categoria, ordenado do maior para o menor.
- **Given** 12 meses de dados, **when** abro a evolução mensal, **then** vejo uma linha de receitas, uma de
  despesas e uma de saldo ao longo dos meses.

### P3 — Comparação e exportação
**Como** proprietário, **quero** comparar dois meses e exportar o relatório **para** analisar variações e
guardar um registro.
- **Given** os meses `2026-03` e `2026-04`, **when** os comparo, **then** vejo, por categoria, o gasto de cada
  mês e a variação (absoluta e percentual).
- **Given** um relatório aberto, **when** clico em exportar, **then** baixo um arquivo (PDF ou Excel) com a
  tabela/gráficos do período selecionado.

## 5. Requisitos funcionais

- **RF-001** — O sistema **DEVE** exibir uma tabela consolidada por competência no período escolhido, com
  líquido recebido, gastos, poupança, viagem e sobras, e uma linha de totais.
- **RF-002** — O sistema **DEVE** calcular **sobras** do mês = líquido recebido − gastos − aportes em poupança −
  aportes em viagem (replicando a fórmula da planilha).
- **RF-003** — O sistema **DEVE** exibir gráfico de gasto por categoria no período (agregado).
- **RF-004** — O sistema **DEVE** exibir gráfico de evolução mensal de receitas, despesas e saldo.
- **RF-005** — O sistema **DEVE** permitir comparar dois meses, mostrando gasto por categoria e variação
  (absoluta e %).
- **RF-006** — O sistema **DEVERIA** permitir exportar o relatório do período em PDF e/ou Excel.
- **RF-007** — O sistema **DEVE** tratar meses sem dados como zerados, sem omiti-los da série temporal.
- **RF-008** — O sistema **PODE** permitir filtrar o histórico por intervalo de competências (não só ano fechado).

## 6. Escopo

**Dentro:** visão consolidada por mês; totais do ano; gráfico de gasto por categoria; evolução mensal de
receitas/despesas/saldo; comparação entre dois meses; exportação PDF/Excel.

### Fora do escopo
- **Relatórios customizáveis pelo usuário** (montar suas próprias métricas/colunas) — futuro.
- **Previsões/orçamento futuro projetado** — coberto parcialmente por P7 (projeções); aqui é histórico/atual.
- **Agendamento/envio automático de relatórios por e-mail** — backlog (app local, sem servidor sempre ligado).

## 7. Premissas

- "Poupança" e "Viagem" na fórmula de sobras correspondem a **aportes em baldes** (P4) cujos nomes/identidades
  são reconhecidos como tal; na ausência de P4 populado, esses valores são zero. **[Premissa]**
- A consolidação é **derivada** em tempo de consulta a partir de P1/P2/P4; o histórico não tem armazenamento
  próprio de valores agregados. **[Premissa]**
- Exportação é gerada **sob demanda** no cliente/servidor local, sem dependência de serviço externo. **[Premissa]**

## 8. Critérios de sucesso

- **CS-001** — A linha consolidada de um mês reproduz os valores da aba histórico da planilha para um mês real
  (diferença R$ 0,00 em líquido, gastos e sobras).
- **CS-002** — O total do ano é igual à soma das 12 linhas mensais em cada coluna (erro 0).
- **CS-003** — O gráfico de gasto por categoria soma exatamente o total de despesas do período (erro 0).
- **CS-004** — A comparação entre dois meses apresenta variação correta (valor e %) verificável em ≥ 3
  categorias.

## 9. Dependências

- P1 (lançamentos/totais), P2 (categorias para o gráfico por categoria), P4 (aportes de poupança/viagem para a
  coluna de sobras). É uma feature majoritariamente **de leitura/agregação**.
