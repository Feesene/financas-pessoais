# Feature Spec — Categorias e Metas por Categoria (P2)

- **Projeto:** financas-pessoais
- **PRD:** [`_prd.md`](./_prd.md)
- **Slug:** categorias-e-metas
- **Status:** Proposto
- **Depende de:** orcamento-mensal (P1)

## 1. Descrição técnica da solução

Cria o módulo de domínio **`categorias`** (DDD/Clean, mesma estrutura de `lancamentos`) com a entidade
`Categoria` e a entidade/valor `MetaMensal`. Ajusta o módulo `lancamentos` para referenciar `categoriaId` em
vez de texto livre. O cálculo de consumo cruza lançamentos × metas por competência.

## 2. Fluxo técnico

```
[CRUD categorias]  → CategoriasController → {Criar/Editar/Excluir}CategoriaUseCase → CategoriaRepository
[Definir meta]     → POST/PUT /categorias/:id/metas → DefinirMetaUseCase → MetaRepository
[Consumo do mês]   → GET /categorias/consumo?competencia=
                       → ObterConsumoCategoriasUseCase
                          ├─ lê metas da competência (MetaRepository)
                          └─ soma despesas por categoria (LancamentoRepository)
                       → ConsumoCategoriaDTO[] { categoria, meta, gasto, percentual, estourou }
```

## 3. Entidades de domínio

### Categoria
| Atributo | Tipo | Regras |
|----------|------|--------|
| `id` | uuid | |
| `nome` | string | obrigatório, único por `tipo`, ≤ 80 |
| `tipo` | `'RECEITA'\|'DESPESA'` | obrigatório |
| `cor` | string\|null | hex opcional |

### MetaMensal
| Atributo | Tipo | Regras |
|----------|------|--------|
| `id` | uuid | |
| `categoriaId` | uuid | FK; categoria deve ser DESPESA |
| `competencia` | `AAAA-MM` | |
| `valor` | number | > 0, `numeric(12,2)` |

Relacionamento: `Lancamento.categoriaId → Categoria.id` (após migração). `MetaMensal.categoriaId → Categoria.id`.

## 4. Tipos compartilhados

```ts
export interface CategoriaDTO { id: string; nome: string; tipo: TipoLancamento; cor: string | null; }
export interface MetaMensalDTO { id: string; categoriaId: string; competencia: string; valor: number; }
export interface ConsumoCategoriaDTO {
  categoria: CategoriaDTO;
  meta: number | null;
  gasto: number;
  percentual: number | null; // gasto/meta, null se sem meta
  estourou: boolean;
}
```

## 5. Contratos de API

- **POST /categorias** → 201 `CategoriaDTO`; 400 inválido; 409 duplicada.
- **GET /categorias** → 200 `CategoriaDTO[]`.
- **PUT /categorias/:id** → 200; 404; 409.
- **DELETE /categorias/:id** → 204; 404; **409** se houver lançamentos vinculados.
- **PUT /categorias/:id/metas** (body `{ competencia, valor }`) → 200 `MetaMensalDTO`; 400 (valor≤0 ou categoria
  não-despesa); 404.
- **DELETE /categorias/:id/metas?competencia=** → 204; 404.
- **GET /categorias/consumo?competencia=** → 200 `ConsumoCategoriaDTO[]`; 400 competência inválida.

## 6. Requisitos funcionais

- **RF-001** — Backend **DEVE** expor CRUD de `Categoria` com unicidade `(nome,tipo)`.
- **RF-002** — Backend **DEVE** expor definição/remoção de meta mensal apenas para categorias de despesa.
- **RF-003** — Backend **DEVE** calcular consumo (`gasto`, `percentual`, `estourou`) por categoria/competência.
- **RF-004** — `lancamentos` **DEVE** passar a usar `categoriaId` (FK) com migração dos textos existentes.
- **RF-005** — `DELETE /categorias/:id` **DEVE** bloquear (409) se houver lançamentos vinculados.
- **RF-006** — Frontend **DEVE** ter tela de categorias e definição de metas, e exibir consumo/estouro no
  orçamento (P1).
- **RF-007** — Frontend **DEVERIA** usar a cor da categoria nas listas e gráficos.
- **RF-008** — Frontend **DEVE** seguir o design system ([`docs/ui-frontend.md`](../../../docs/ui-frontend.md)):
  CRUD de categoria e definição de meta em **modais** (`Dialog`); exclusão com **`AlertDialog`** (e mensagem
  clara quando bloqueada por 409); cor da categoria via seletor de cor; **consumo/estouro com barra de
  progresso** e **`Badge`** de estouro; avisos via **`toast`** (`sonner`).

## 7. Requisitos não-funcionais

- **Performance**: consumo do mês em < 300 ms (volume baixo). Índices em `meta(categoriaId,competencia)` e
  `lancamento(categoriaId,competencia)`.
- **Integridade**: FK `lancamento.categoriaId` com `ON DELETE RESTRICT`.
- **Segurança**: validação estrita; sem auth (local).

## 8. Edge cases técnicos

1. Categoria duplicada (mesmo nome+tipo) → 409.
2. Meta em categoria de receita → 400.
3. Consumo de categoria **sem meta** → `meta:null, percentual:null, estourou:false`.
4. Excluir categoria com lançamentos → 409 (RESTRICT).
5. Migração: lançamento P1 com categoria de texto inexistente → cria categoria correspondente no migration.
6. Gasto exatamente igual à meta (100%) → não conta como estouro (`estourou` só se `gasto > meta`).

## 9. Estratégia de testes

- Unitário: unicidade de categoria; meta só p/ despesa; cálculo de percentual e flag de estouro (abaixo/igual/
  acima).
- Integração: migração de categoria-texto→FK; bloqueio de exclusão (409); consumo por competência.
- Frontend: render do consumo com cores; estado sem meta.

## 10. Breakdown de tarefas

**Shared**
- [x] T1 — Tipos `CategoriaDTO`, `MetaMensalDTO`, `ConsumoCategoriaDTO` em shared.

**Backend — módulo categorias**
- [x] T2 — Domínio `Categoria` (entidade + repo interface + erros). *(T1)*
- [x] T3 — Domínio `MetaMensal` + repo interface (regra: só despesa). *(T1)*
- [x] T4 — Infra TypeORM: schemas, mappers e repositórios de Categoria e Meta + índices. *(T2,T3)*
- [x] T5 — Use cases Criar/Editar/Excluir Categoria (excluir bloqueia se vinculada). *(T4)*
- [x] T6 — Use cases Definir/Remover Meta. *(T4)*
- [x] T7 — `ObterConsumoCategoriasUseCase` (cruza meta × despesas). *(T4)*
- [x] T8 — `CategoriasModule` + controller (rotas da seção 5). *(T5,T6,T7)*

**Backend — ajuste em lancamentos**
- [x] T9 — Adicionar `categoriaId` (FK) ao `Lancamento`/schema; manter compat e validar categoria existente. *(T4)*
- [x] T10 — Migration: criar categorias a partir dos textos distintos de lançamentos existentes e popular
  `categoriaId`. *(T9)*

**Frontend**
- [x] T11 — Cliente de API de categorias/metas/consumo. *(T8)*
- [x] T12 — Tela de gestão de categorias (CRUD + cor). *(T11)*
- [x] T13 — UI de definição de meta por categoria/competência. *(T11)*
- [x] T14 — Integrar consumo/estouro na tela de orçamento (P1): barra de consumo e destaque. *(T11)*

**Testes**
- [x] T15 — Unitários de domínio/casos de uso. *(T5,T6,T7)*
- [x] T16 — e2e de categorias+metas+consumo e da migração. *(T8,T10)*

## 11. Decisões e premissas

- **D1** — Meta modelada como entidade própria por (categoria, competência) — permite valores diferentes por
  mês e histórico de metas.
- **D2** — Migração de P1 (texto→FK) é parte desta feature; categorias derivadas dos textos distintos.
- **D3** — Estouro = `gasto > meta` estritamente (100% não estoura).
- **D4** — Sem teto global do mês no MVP; somente metas por categoria.
