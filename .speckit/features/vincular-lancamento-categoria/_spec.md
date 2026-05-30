# Feature Spec — Vincular lançamento manual a categoria/meta cadastrada

- **Projeto:** financas-pessoais
- **PRD:** _(não há; spec derivada de pedido de melhoria)_
- **Slug:** vincular-lancamento-categoria
- **Status:** Proposto
- **Depende de:** categorias-e-metas (P2), orcamento-mensal (P1)

## 1. Descrição técnica da solução

O backend **já aceita** `categoriaId` ao criar/editar lançamentos (`CriarLancamentoRequest.categoriaId`,
`CriarLancamentoUseCase` valida a existência e lança `CategoriaInexistenteError`/400). O problema é **exclusivamente
de frontend**: o `LancamentoFormDialog` usa um `<Input>` de texto livre com `datalist` de sugestões estáticas
(`CATEGORIAS_SUGERIDAS`) e **nunca envia `categoriaId`**. Resultado: um lançamento avulso não se vincula a uma
categoria cadastrada (e, portanto, não conta no consumo da meta daquela categoria) — só recorrências, que carregam
`categoriaId` na materialização, ficam vinculadas.

A solução troca o campo de categoria do formulário por um seletor das categorias cadastradas (`GET /categorias`,
filtradas pelo `tipo` selecionado — receita/despesa), enviando `categoria` (nome, mantido por compatibilidade) **e**
`categoriaId`. Para não perder a flexibilidade atual, mantém-se uma opção "Outra (digitar)" que permite texto livre
sem `categoriaId` (lançamento não classificado), preservando o comportamento legado.

Com o vínculo correto, o consumo de metas (`ObterConsumoCategoriasUseCase`, que agrega por categoria) passa a contar
os lançamentos manuais junto das ocorrências recorrentes — que é o efeito esperado pelo usuário ("controle melhor da
meta").

## 2. Fluxo técnico

```
[Abrir form] → carrega categorias via categoriasApi.listar() (cacheável por sessão)
             → filtra por tipo atual (DESPESA/RECEITA)
[Selecionar] → Select de categorias cadastradas:
                 opção cadastrada → categoria=nome, categoriaId=id
                 opção "Outra"    → input de texto livre, categoriaId=null
[Trocar tipo] → re-filtra a lista; se a categoria escolhida não bate com o novo tipo, limpa a seleção
[Submeter]    → POST/PUT /lancamentos { tipo, categoria, categoriaId, descricao?, valor, competencia }
                 backend valida categoriaId (400 se inexistente) — já implementado
```

## 3. Entidades de domínio

Sem novas entidades. Reuso de:
- `CategoriaDTO { id, nome, tipo, cor }` (origem do seletor).
- `LancamentoDTO` / `AtualizarLancamentoDTO` — já possuem `categoriaId` (opcional). Nenhuma mudança de schema.

Regra de coerência (frontend): a categoria selecionada deve ter `tipo` igual ao `tipo` do lançamento; o seletor só
lista categorias do tipo corrente.

## 4. Tipos compartilhados

Nenhuma alteração. `AtualizarLancamentoDTO.categoriaId?: string | null` e `LancamentoDTO.categoriaId` já existem.

## 5. Contratos de API

Sem novos endpoints nem mudança de contrato. Uso dos existentes:
- **GET /categorias** → 200 `CategoriaDTO[]` (para popular o seletor).
- **POST /lancamentos** `{ tipo, categoria, categoriaId?, descricao?, valor, competencia }` → 201 `LancamentoDTO`;
  400 (`categoriaId` inexistente / inválido).
- **PUT /lancamentos/:id** mesmo corpo → 200; 400; 404.

Mudança no frontend: o corpo enviado passa a incluir `categoriaId` (antes sempre omitido).

## 6. Requisitos funcionais

- **RF-001** — O formulário de lançamento **DEVE** listar as categorias cadastradas filtradas pelo tipo selecionado.
- **RF-002** — Ao escolher uma categoria cadastrada, o frontend **DEVE** enviar `categoria` (nome) e `categoriaId` (id).
- **RF-003** — O formulário **DEVE** oferecer a opção "Outra (digitar)" para texto livre, enviando `categoriaId=null`.
- **RF-004** — Ao alternar o tipo (receita/despesa), o formulário **DEVE** refiltrar a lista e invalidar a seleção
  incompatível.
- **RF-005** — Em modo edição, o formulário **DEVE** pré-selecionar a categoria atual a partir de `lancamento.categoriaId`
  (ou cair em "Outra" quando `categoriaId` for `null`).
- **RF-006** — Lançamentos manuais vinculados **DEVEM** passar a contar no consumo da meta da categoria (efeito do
  vínculo correto, sem mudança de backend).
- **RF-007** — Quando não houver nenhuma categoria cadastrada do tipo, o formulário **DEVERIA** cair direto no modo
  texto livre e sugerir cadastrar categorias.

## 7. Requisitos não-funcionais

- **Performance**: lista de categorias buscada uma vez por abertura do diálogo (ou cache em memória na sessão).
- **Compatibilidade**: mantém `categoria` (texto) no payload; `categoriaId=null` continua válido (lançamentos não
  classificados), sem quebrar dados/lançamentos legados.
- **UX**: seletor com busca/scroll; reaproveita o componente `Select` existente.

## 8. Edge cases técnicos

1. **Nenhuma categoria do tipo cadastrada** → form em modo texto livre; `categoriaId=null`.
2. **Categoria selecionada e depois troca de tipo** → seleção limpa (não envia `categoriaId` incompatível).
3. **`categoriaId` apontando para categoria excluída** (edição de lançamento antigo) → seletor não acha o id; cai em
   "Outra" preservando o nome em texto; ao salvar sem reselecionar, mantém `categoriaId=null`.
4. **Envio de `categoriaId` inexistente** (corrida: categoria excluída entre carregar e submeter) → backend responde
   400 e o front exibe toast de erro.
5. **Texto livre com nome igual a uma categoria cadastrada, mas sem selecioná-la** → grava `categoriaId=null`
   (não há match automático por nome — vínculo é explícito por id).
6. **Modo edição de ocorrência recorrente** → mantém o `categoriaId` da regra; permite reclassificar manualmente.

## 9. Estratégia de testes

- Frontend (unit/componente): seleção popula `categoriaId`; "Outra" zera `categoriaId`; troca de tipo refiltra e
  invalida; pré-seleção em edição.
- Integração (e2e, reuso): criar lançamento com `categoriaId` e verificar que aparece no consumo da meta da categoria;
  `categoriaId` inexistente → 400.
- Regressão: lançamento em modo "Outra" mantém comportamento atual (`categoriaId=null`).

## 10. Breakdown de tarefas

**Frontend**
- [x] T1 — Garantir client `categoriasApi.listar()` disponível e tipado (reuso do existente). *(—)*
- [x] T2 — `LancamentoFormDialog`: substituir o `<Input>`+datalist por `Select` de categorias filtradas por tipo +
  opção "Outra (digitar)"; estado `categoriaId`. *(T1)*
- [x] T3 — Enviar `categoriaId` no corpo de POST/PUT e tratar troca de tipo (refiltra + invalida seleção). *(T2)*
- [x] T4 — Modo edição: pré-seleção a partir de `lancamento.categoriaId`; fallback "Outra" quando `null`/inexistente. *(T2)*
- [x] T5 — Estado vazio: sem categorias do tipo, cai em texto livre com dica de cadastrar categorias. *(T2)*

**Testes**
- [ ] T6 — Testes de componente do formulário (seleção, "Outra", troca de tipo, edição). *(T3,T4)*
- [x] T7 — e2e confirmando que o lançamento manual vinculado entra no consumo da meta. *(T3)*

## 11. Decisões e premissas

- **D1** — Backend **não muda**: `categoriaId` já é aceito e validado. A correção é de frontend (enviar o id).
- **D2** — Mantém-se a opção de **texto livre** ("Outra") para não regredir o fluxo atual e permitir lançamentos não
  classificados (`categoriaId=null`).
- **D3** — Vínculo é **explícito por id**, nunca inferido por igualdade de nome — evita falso vínculo a categorias
  homônimas de tipos diferentes.
- **D4** — O seletor filtra por `tipo` (despesa/receita) para impedir vincular uma despesa a uma categoria de receita
  e vice-versa.
