# PRD — Recorrências e Parcelas (P3)

- **Projeto:** financas-pessoais
- **Prioridade:** P3 (MVP)
- **Status:** Proposto
- **Depende de:** P1 (Orçamento Mensal), P2 (Categorias)

## 1. Contexto e problema

Boa parte das despesas do usuário se repete todo mês (assinaturas: ML, Office, Spotify, Crunchyroll, PS plus;
contas: Condomínio, Internet, Energia, Água) ou é parcelada (compras no cartão divididas em N vezes). Hoje,
isso é redigitado mês a mês na planilha. Esta feature gera **lançamentos automaticamente** a partir de regras
de recorrência e de parcelamento, eliminando o trabalho repetitivo.

## 2. Usuários-alvo

- **Proprietário (usuário único).** Quer cadastrar uma vez e ver os lançamentos aparecerem nos meses certos.

## 3. Fluxo principal

1. O usuário cria uma **recorrência** (ex.: "Spotify", despesa, R$ 21,90, mensal, a partir de `2026-01`, sem
   fim) ou um **parcelamento** (ex.: "Notebook", R$ 3.000,00 em 10x, início `2026-05`).
2. Ao abrir um mês (P1), o sistema garante que os lançamentos previstos por recorrências/parcelas ativas
   naquele mês **existam** (materialização).
3. O usuário vê esses lançamentos no orçamento, podendo **editar/excluir uma ocorrência** sem afetar as demais,
   ou **encerrar a regra**.

## 4. User stories

### P1 — Recorrência mensal gera lançamentos *(entrega valor sozinha)*
**Como** proprietário, **quero** cadastrar uma despesa mensal recorrente **para** não relançá-la todo mês.
- **Given** crio "Internet" R$ 99,90 mensal a partir de `2026-03`, **when** abro `2026-04`, **then** existe um
  lançamento "Internet" R$ 99,90 naquele mês.
- **Given** a recorrência ativa, **when** abro um mês **anterior** ao início, **then** nenhum lançamento dela é
  criado.

### P2 — Parcelamento em N vezes
**Como** proprietário, **quero** lançar uma compra parcelada **para** ver cada parcela no mês correspondente.
- **Given** "Notebook" R$ 3.000,00 em 10x a partir de `2026-05`, **when** abro `2026-05`..`2027-02`, **then**
  vejo uma parcela de R$ 300,00 em cada um, rotulada "1/10".. "10/10".
- **Given** a 11ª competência após o início, **when** abro o mês, **then** não há parcela (parcelamento tem
  fim).

### P3 — Editar/encerrar uma regra e ocorrências
**Como** proprietário, **quero** alterar o valor ou encerrar uma recorrência **para** refletir mudanças.
- **Given** "Spotify" R$ 21,90 mensal, **when** edito o valor para R$ 24,90 a partir de `2026-06`, **then** as
  ocorrências de `2026-06` em diante usam R$ 24,90 e as anteriores permanecem.
- **Given** uma ocorrência específica já materializada, **when** a excluo, **then** apenas aquele mês perde o
  lançamento; a regra segue gerando nos demais.

## 5. Requisitos funcionais

- **RF-001** — O sistema **DEVE** permitir criar recorrência (frequência mensal; início; fim opcional; tipo;
  categoria; valor).
- **RF-002** — O sistema **DEVE** permitir criar parcelamento (valor total ou valor da parcela; nº de parcelas;
  competência inicial).
- **RF-003** — O sistema **DEVE** materializar os lançamentos previstos ao acessar um mês, sem duplicar os já
  criados (idempotência).
- **RF-004** — O sistema **DEVE** rotular parcelas como "k/N".
- **RF-005** — O sistema **DEVE** permitir editar a regra com vigência a partir de uma competência (sem
  reescrever o passado).
- **RF-006** — O sistema **DEVE** permitir excluir uma **ocorrência** isolada e **encerrar** a regra.
- **RF-007** — O sistema **DEVERIA** indicar, no orçamento, que um lançamento veio de recorrência/parcela.
- **RF-008** — O sistema **PODE** permitir pausar/retomar uma recorrência.

## 6. Escopo

**Dentro:** recorrência mensal; parcelamento fixo; materialização idempotente por competência; edição
prospectiva; exclusão de ocorrência; encerramento de regra.

### Fora do escopo
- **Frequências diferentes de mensal** (semanal, anual) — futuro.
- **Recorrência com valor variável previsto** (ex.: conta de luz estimada) — futuro; aqui o valor é fixo.
- **Notificações de cobrança/vencimento** — backlog (lembretes de contas a pagar).

## 7. Premissas

- Frequência do MVP é **mensal**. **[Premissa]**
- Materialização ocorre **sob demanda** (ao abrir o mês), não por job agendado — coerente com app local sem
  servidor sempre ligado. **[Premissa]**
- Parcelamento distribui o valor igualmente; resíduo de arredondamento vai na última parcela.

## 8. Critérios de sucesso

- **CS-001** — Abrir o mesmo mês duas vezes **não** duplica lançamentos de recorrência/parcela (idempotência:
  0 duplicatas).
- **CS-002** — Uma recorrência mensal sem fim gera exatamente 1 lançamento por mês em ≥ 12 meses consecutivos.
- **CS-003** — A soma das N parcelas é **igual** ao valor total informado (diferença R$ 0,00).
- **CS-004** — Editar valor a partir de uma competência não altera ocorrências anteriores.

## 9. Dependências

- P1 (lançamentos) e P2 (categorias). Recorrência/parcela referenciam categoria.
