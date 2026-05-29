# Feature Spec — Recorrências e Parcelas (P3)

- **Projeto:** financas-pessoais
- **PRD:** [`_prd.md`](./_prd.md)
- **Slug:** recorrencias-e-parcelas
- **Status:** Proposto
- **Depende de:** orcamento-mensal (P1), categorias-e-metas (P2)

## 1. Descrição técnica da solução

Novo módulo de domínio **`recorrencias`** com a entidade `RegraRecorrente` (cobre recorrência mensal e
parcelamento como um caso especial com `numeroParcelas` definido). A **materialização** gera lançamentos
(`Lancamento` de P1) marcados com `origemRegraId` e `competencia`, de forma **idempotente**: ao acessar um mês,
o `MaterializarCompetenciaUseCase` verifica quais ocorrências já existem e cria só as faltantes.

## 2. Fluxo técnico

```
[Abrir mês 2026-05]
  Frontend → POST /recorrencias/materializar { competencia }
     → MaterializarCompetenciaUseCase
         para cada RegraRecorrente ativa na competência:
           se não existe Lancamento{origemRegraId, ocorrenciaIndice}:
              cria Lancamento (valor/categoria/tipo da regra) com label k/N (se parcela)
  Frontend → GET /lancamentos?competencia=2026-05  (já inclui os materializados)
```

Regra **ativa numa competência** se `competencia >= inicio` e (`fim` nulo ou `competencia <= fim`) e, para
parcela, `indice < numeroParcelas`.

## 3. Entidades de domínio

### RegraRecorrente
| Atributo | Tipo | Regras |
|----------|------|--------|
| `id` | uuid | |
| `tipo` | `'RECEITA'\|'DESPESA'` | |
| `categoriaId` | uuid | FK Categoria |
| `descricao` | string\|null | |
| `valorBase` | number | > 0; valor da ocorrência (parcela) |
| `frequencia` | `'MENSAL'` | MVP só mensal |
| `competenciaInicio` | `AAAA-MM` | |
| `competenciaFim` | `AAAA-MM`\|null | null = sem fim (recorrência) |
| `numeroParcelas` | number\|null | preenchido só p/ parcelamento |
| `ativa` | boolean | encerrar = `false` |

### Vínculo no Lancamento (P1, extensão)
- `origemRegraId: uuid\|null` — qual regra gerou o lançamento.
- `ocorrenciaIndice: number\|null` — k (1-based) para idempotência e label "k/N".

`Lancamento` editado/excluído manualmente continua existindo independentemente da regra.

## 4. Tipos compartilhados

```ts
export type Frequencia = 'MENSAL';
export interface RegraRecorrenteDTO {
  id: string; tipo: TipoLancamento; categoriaId: string; descricao: string | null;
  valorBase: number; frequencia: Frequencia;
  competenciaInicio: string; competenciaFim: string | null; numeroParcelas: number | null; ativa: boolean;
}
export interface MaterializarResultadoDTO { competencia: string; criados: number; }
```

## 5. Contratos de API

- **POST /recorrencias** (recorrência: sem `numeroParcelas`; parcela: com `numeroParcelas` e `valorTotal` ou
  `valorBase`) → 201 `RegraRecorrenteDTO`; 400.
- **GET /recorrencias** → 200 `RegraRecorrenteDTO[]`.
- **PUT /recorrencias/:id** (edição prospectiva: `aPartirDe: AAAA-MM`) → 200; 404.
- **POST /recorrencias/:id/encerrar** → 200 (seta `ativa=false`/`competenciaFim`); 404.
- **POST /recorrencias/materializar** `{ competencia }` → 200 `MaterializarResultadoDTO` (idempotente).

## 6. Requisitos funcionais

- **RF-001** — Backend **DEVE** criar `RegraRecorrente` para recorrência (sem nº parcelas) e parcelamento (com
  nº parcelas).
- **RF-002** — `MaterializarCompetenciaUseCase` **DEVE** ser idempotente por `(origemRegraId, ocorrenciaIndice)`.
- **RF-003** — Parcelamento **DEVE** gerar `numeroParcelas` ocorrências com label "k/N" e soma == valor total.
- **RF-004** — Edição **DEVE** ser prospectiva (`aPartirDe`), criando nova vigência sem alterar o passado.
- **RF-005** — Encerrar regra **DEVE** parar a materialização futura sem apagar ocorrências passadas.
- **RF-006** — Excluir um `Lancamento` materializado **DEVE** afetar só aquela ocorrência (e não reaparecer ao
  rematerializar o mesmo mês — registrar exclusão).
- **RF-007** — Frontend **DEVERIA** indicar lançamentos originados de regra (ícone/label) no orçamento.

## 7. Requisitos não-funcionais

- **Performance**: materialização de um mês em < 500 ms.
- **Idempotência/consistência**: índice único `(origemRegraId, ocorrenciaIndice)` em `lancamentos`.
- **Arredondamento**: parcelas em centavos; resíduo na última parcela.

## 8. Edge cases técnicos

1. Materializar o mesmo mês 2x → `criados=0` na segunda vez (índice único impede duplicata).
2. Mês anterior ao início da regra → nenhuma ocorrência.
3. Parcela além de N → não materializa.
4. Excluir ocorrência e rematerializar → não recria (marca de exclusão por `(regra,indice)`).
5. Editar valor prospectivamente → ocorrências passadas inalteradas; futuras com novo valor.
6. Resíduo de arredondamento (ex.: 100,00/3) → 33,33+33,33+33,34 = 100,00.

## 9. Estratégia de testes

- Unitário: cálculo de ocorrência ativa por competência; distribuição de parcelas; soma == total.
- Integração: idempotência (materializar 2x); exclusão de ocorrência + rematerialização; edição prospectiva.
- Frontend: indicação visual de origem; abrir mês dispara materialização e lista atualizada.

## 10. Breakdown de tarefas

**Shared**
- [ ] T1 — Tipos `Frequencia`, `RegraRecorrenteDTO`, `MaterializarResultadoDTO`.

**Backend — lancamentos (extensão)**
- [ ] T2 — Adicionar `origemRegraId` e `ocorrenciaIndice` ao `Lancamento`/schema + índice único
  `(origemRegraId,ocorrenciaIndice)`. *(T1)*
- [ ] T3 — Registrar exclusões de ocorrência (tabela/flag) para não recriar ao rematerializar. *(T2)*

**Backend — módulo recorrencias**
- [ ] T4 — Domínio `RegraRecorrente` (entidade + regras de vigência/parcela + repo interface). *(T1)*
- [ ] T5 — Infra TypeORM (schema, mapper, repo) + índices. *(T4)*
- [ ] T6 — Use cases Criar/Editar(prospectivo)/Encerrar regra. *(T5)*
- [ ] T7 — `MaterializarCompetenciaUseCase` idempotente (usa LancamentoRepository + registro de exclusões). *(T2,T3,T5)*
- [ ] T8 — `RecorrenciasModule` + controller (rotas seção 5). *(T6,T7)*

**Frontend**
- [ ] T9 — Cliente de API de recorrências + materializar. *(T8)*
- [ ] T10 — Tela de cadastro de recorrência/parcelamento. *(T9)*
- [ ] T11 — Disparar materialização ao abrir um mês no orçamento e indicar origem dos lançamentos. *(T9)*
- [ ] T12 — Ações de editar(prospectivo)/encerrar regra e excluir ocorrência. *(T10,T11)*

**Testes**
- [ ] T13 — Unitários de vigência/parcelas. *(T4)*
- [ ] T14 — e2e de idempotência, exclusão de ocorrência e edição prospectiva. *(T7,T8)*

## 11. Decisões e premissas

- **D1** — Parcelamento é um caso de `RegraRecorrente` com `numeroParcelas` definido (evita um segundo modelo).
- **D2** — Materialização **sob demanda** ao abrir o mês (sem cron) — app local. Idempotência via índice único.
- **D3** — Exclusão de ocorrência é registrada para sobreviver a rematerializações.
- **D4** — Edição é prospectiva por competência; passado é imutável.
- **D5** — Frequência só `MENSAL` no MVP.
