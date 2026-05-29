# Feature Spec — Projeções (Juros Compostos) (P7)

- **Projeto:** financas-pessoais
- **PRD:** [`_prd.md`](./_prd.md)
- **Slug:** projecoes
- **Status:** Proposto
- **Depende de:** Independente (integra-se opcionalmente com carteira-de-investimentos P6)

## 1. Descrição técnica da solução

Módulo de domínio **`projecoes`** centrado em um **serviço de cálculo puro** (`CalcularProjecaoUseCase`) sem
persistência por padrão — a projeção é determinística e derivada apenas dos parâmetros de entrada. Opcionalmente
(RF-008), um `CenarioProjecao` pode ser salvo para reabrir. O cálculo principal é uma função pura que itera mês
a mês aplicando a taxa mensal equivalente e o aporte, agregando os resultados por ano.

## 2. Fluxo técnico

```
[Calcular]  → POST /projecoes/calcular { entrada, aporteMensal, taxaAnual, anos }
                → CalcularProjecaoUseCase (função pura, sem I/O):
                    i_m = (1 + taxaAnual)^(1/12) - 1
                    para mês m = 1..(anos*12):
                       saldoInvestido = saldoInvestido*(1+i_m) + aporteMensal
                       saldoNaoInvestido = entrada + aporteMensal*m
                       (no mês 0: ambos = entrada)
                    ao fim de cada ano, registra ProjecaoAnoDTO
                → ProjecaoResultadoDTO { anos[], totalFinal..., jurosGanhos }

[Salvar]    → POST /projecoes/cenarios { nome, parametros }      (opcional, RF-008)
[Listar]    → GET  /projecoes/cenarios
[Excluir]   → DELETE /projecoes/cenarios/:id
```

Capitalização mensal; aporte aplicado ao **fim** de cada mês (annuity-due vs ordinary: usamos *ordinary* — ver
D2). No mês 0, saldoInvestido = saldoNaoInvestido = `entrada`.

## 3. Entidades de domínio

### Parametros (value object de entrada)
| Atributo | Tipo | Regras |
|----------|------|--------|
| `entrada` | number | ≥ 0 |
| `aporteMensal` | number | ≥ 0 |
| `taxaAnual` | number | ≥ 0 (fração: 0.10 = 10% a.a.) |
| `anos` | number | inteiro, 1..60 |

### CenarioProjecao (persistido apenas se RF-008 ativo)
| Atributo | Tipo | Regras |
|----------|------|--------|
| `id` | uuid | |
| `nome` | string | obrigatório, ≤ 80 |
| `parametros` | Parametros | embutido (colunas ou jsonb) |
| `criadoEm` | timestamp | |

> O resultado da projeção **não é persistido** — é sempre recalculado a partir de `parametros` (determinístico).

## 4. Tipos compartilhados

```ts
export interface ProjecaoParametrosDTO {
  entrada: number; aporteMensal: number; taxaAnual: number; anos: number; // taxaAnual como fração (0.1 = 10%)
}
export interface ProjecaoAnoDTO {
  ano: number;            // 1..anos
  totalAportado: number;  // entrada + aporteMensal * (ano*12)
  saldoNaoInvestido: number;
  saldoInvestido: number;
  jurosAcumulados: number; // saldoInvestido - totalAportado
}
export interface ProjecaoResultadoDTO {
  parametros: ProjecaoParametrosDTO;
  anos: ProjecaoAnoDTO[];
  totalFinalInvestido: number;
  totalFinalNaoInvestido: number;
  jurosGanhos: number;     // totalFinalInvestido - totalFinalNaoInvestido
}
export interface CenarioProjecaoDTO {
  id: string; nome: string; parametros: ProjecaoParametrosDTO; criadoEm: string;
}
```

## 5. Contratos de API

- **POST /projecoes/calcular** `{ entrada, aporteMensal, taxaAnual, anos }` → 200 `ProjecaoResultadoDTO`; 400
  (valores negativos, `anos` fora de 1..60 ou não inteiro).
- **POST /projecoes/cenarios** `{ nome, parametros }` → 201 `CenarioProjecaoDTO`; 400. *(opcional, RF-008)*
- **GET /projecoes/cenarios** → 200 `CenarioProjecaoDTO[]`. *(opcional)*
- **GET /projecoes/cenarios/:id** → 200 `CenarioProjecaoDTO`; 404. *(opcional)*
- **DELETE /projecoes/cenarios/:id** → 204; 404. *(opcional)*

> O endpoint `calcular` é **stateless** (não grava nada). Os endpoints de cenário só existem se RF-008 for
> implementado nesta iteração.

## 6. Requisitos funcionais

- **RF-001** — Backend **DEVE** validar parâmetros (`entrada/aporteMensal/taxaAnual ≥ 0`, `anos` inteiro
  1..60).
- **RF-002** — `CalcularProjecaoUseCase` **DEVE** calcular o cenário **não investido** = `entrada +
  aporteMensal × meses`.
- **RF-003** — `CalcularProjecaoUseCase` **DEVE** calcular o cenário **investido** com capitalização mensal
  (taxa mensal equivalente) e aporte ao fim de cada mês.
- **RF-004** — A resposta **DEVE** trazer uma linha por ano com total aportado, saldo investido, saldo não
  investido e juros acumulados.
- **RF-005** — A resposta **DEVE** trazer `totalFinalInvestido`, `totalFinalNaoInvestido` e `jurosGanhos`.
- **RF-006** — Frontend **DEVE** ter formulário de parâmetros que recalcula a projeção e exibe tabela + gráfico
  comparativo.
- **RF-007** — Frontend **DEVERIA** permitir pré-preencher a Entrada com o total da carteira (P6) quando
  disponível.
- **RF-008** — Backend/Frontend **PODE** salvar/reabrir cenários nomeados (endpoints de cenário).

## 7. Requisitos não-funcionais

- **Performance**: cálculo de 60 anos (720 meses) em < 50 ms (função pura, sem I/O).
- **Precisão**: arredondamento só na **apresentação** (2 casas); cálculo interno em ponto flutuante de dupla
  precisão para não acumular erro.
- **Determinismo**: mesma entrada → mesma saída; nenhuma dependência de estado externo no `calcular`.
- **Segurança**: validação estrita de entrada (sem auth; app local).

## 8. Edge cases técnicos

1. `taxaAnual = 0` → cenário investido **igual** ao não investido em todos os anos.
2. `aporteMensal = 0` e `entrada > 0` → só a entrada capitaliza (juros compostos puros sobre o principal).
3. `entrada = 0` e `aporteMensal = 0` → todos os saldos = 0; `jurosGanhos = 0`.
4. `anos` não inteiro ou ≤ 0 ou > 60 → 400.
5. Valores negativos em qualquer parâmetro → 400.
6. Taxa muito alta + 60 anos → número grande, porém finito; sem overflow em float de dupla precisão (validar
   que não vira `Infinity`).

## 9. Estratégia de testes

- Unitário: taxa mensal equivalente; valor investido vs calculadora de referência (≤ R$ 0,01); igualdade
  investido=não investido com taxa 0; aporte 0; entrada 0; juros ganhos = investido − não investido.
- Integração: `POST /calcular` retorna tabela ano a ano correta; validações → 400; (se RF-008) CRUD de cenário.
- Frontend: recálculo reativo ao mudar parâmetros; gráfico das duas curvas; pré-preenchimento via P6.

## 10. Breakdown de tarefas

**Shared**
- [ ] T1 — Tipos `ProjecaoParametrosDTO`, `ProjecaoAnoDTO`, `ProjecaoResultadoDTO`, `CenarioProjecaoDTO`.

**Backend — módulo projecoes**
- [ ] T2 — Função/serviço de domínio puro de juros compostos (taxa mensal equivalente, iteração mês a mês,
  agregação anual). *(T1)*
- [ ] T3 — `CalcularProjecaoUseCase` (valida parâmetros + monta `ProjecaoResultadoDTO`). *(T2)*
- [ ] T4 — *(opcional RF-008)* Domínio `CenarioProjecao` + repo interface + infra TypeORM + use cases
  salvar/listar/excluir. *(T1)*
- [ ] T5 — `ProjecoesModule` + controller (`POST /projecoes/calcular` + rotas de cenário se T4). *(T3,T4)*

**Frontend**
- [ ] T6 — Cliente de API de projeções. *(T5)*
- [ ] T7 — Formulário de parâmetros (entrada, aporte, taxa, anos) com recálculo reativo. *(T6)*
- [ ] T8 — Tabela ano a ano + cartões de total final e juros ganhos. *(T7)*
- [ ] T9 — Gráfico comparativo investido vs não investido. *(T8)*
- [ ] T10 — *(opcional)* Pré-preencher Entrada com total da carteira (P6) + salvar/abrir cenários. *(T7)*

**Testes**
- [ ] T11 — Unitários do cálculo (referência, taxa 0, aporte 0, entrada 0, juros ganhos). *(T2)*
- [ ] T12 — e2e de `POST /calcular` + validações (e CRUD de cenário se T4). *(T5)*

## 11. Decisões e premissas

- **D1** — `calcular` é **stateless** por padrão; persistência só para cenários nomeados (RF-008, opcional) —
  mantém o módulo leve e determinístico.
- **D2** — Aportes ao **fim** de cada mês (annuity *ordinary*) e capitalização **mensal** com taxa mensal
  equivalente `(1+i_a)^(1/12) − 1`. Documentado para reprodutibilidade da planilha.
- **D3** — Arredondamento só na apresentação (2 casas); cálculo interno em float de dupla precisão para evitar
  acúmulo de erro.
- **D4** — `taxaAnual` trafega como **fração** (0.10 = 10%); a UI converte de/para porcentagem.
- **D5** — Projeção é **nominal** (sem inflação/tributação) e com parâmetros constantes — variações ficam no
  backlog.
