# Feature Spec — Contraste de seleção nas caixinhas (selects/dropdowns)

- **Projeto:** financas-pessoais
- **PRD:** _(não há; spec derivada de pedido de melhoria de UI)_
- **Slug:** contraste-selecao-caixinhas
- **Status:** Proposto
- **Depende de:** componentes de UI (`frontend/src/components/ui/*`) e tokens de tema (`globals.css`)

## 1. Descrição técnica da solução

Nas "caixinhas" de seleção (`Select`/`DropdownMenu`) a opção em foco/hover usa o token `accent`, que no tema claro é um
cinza muito sutil (`220 14% 95%`) com texto escuro — pouco perceptível: o usuário não enxerga claramente **qual opção
está prestes a ser selecionada** nem **qual está selecionada**. O pedido é dar uma "cor preta para selecionar", ou seja,
um realce de alto contraste no item ativo das caixinhas.

A solução, **puramente de frontend e centrada em tokens**, faz três ajustes:

1. **Highlight de foco/hover** em `SelectItem`/`DropdownMenuItem` passa a usar um realce de alto contraste — texto
   `accent-foreground` sobre fundo escuro de seleção — em vez do cinza atual quase imperceptível. Introduz-se um par de
   tokens dedicados `--select-active`/`--select-active-foreground` (preto/quase-preto no claro; claro no escuro), para
   não sequestrar o `accent` usado em outros lugares.
2. **Item selecionado** (o valor atual) ganha destaque persistente: `font-medium` + check visível, distinto do mero hover.
3. Mantém-se a coerência no **tema escuro** (realce claro sobre fundo escuro), garantindo contraste AA em ambos os temas.

Como `Select` e `DropdownMenu` são os componentes compartilhados usados em todas as telas, o ajuste se propaga a todas as
caixinhas (tipo de lançamento, categoria, navegação de mês, formulários de ativo, etc.) sem mudar cada chamada.

## 2. Fluxo técnico

```
globals.css: novos tokens --select-active / --select-active-foreground (claro e .dark)
tailwind.config: mapear cores select-active / select-active-foreground
ui/select.tsx (SelectItem):
  focus:bg-select-active focus:text-select-active-foreground   (realce de alto contraste)
  data-[state=checked]:font-medium                              (item selecionado destacado)
ui/dropdown-menu.tsx (DropdownMenuItem): mesmo par de classes de realce
→ todas as caixinhas herdam o novo contraste automaticamente
```

## 3. Entidades de domínio

Não se aplica (mudança visual, sem domínio nem dados).

## 4. Tipos compartilhados

Nenhum. Alteração restrita a CSS/tokens e classes de componentes de UI.

## 5. Contratos de API

Não se aplica — feature exclusivamente de apresentação (sem backend, sem rede, sem persistência).

## 6. Requisitos funcionais

- **RF-001** — A opção em foco/hover de `Select` **DEVE** ter realce de alto contraste (texto claro sobre fundo escuro
  no tema claro), claramente distinta do fundo da caixinha.
- **RF-002** — A opção atualmente selecionada **DEVE** ter destaque persistente (peso de fonte + check) distinto do hover.
- **RF-003** — `DropdownMenu` **DEVE** adotar o mesmo realce de alto contraste para itens em foco/hover.
- **RF-004** — O realce **DEVE** preservar contraste legível no tema escuro (realce claro sobre fundo escuro).
- **RF-005** — A mudança **DEVE** vir de tokens dedicados (`--select-active`/`--select-active-foreground`), sem alterar
  o significado do token `accent` usado em outros componentes.
- **RF-006** — O texto da opção realçada **DEVE** atingir contraste mínimo AA (≥ 4.5:1) em ambos os temas.
- **RF-007** — A correção **DEVERIA** aplicar-se a todas as caixinhas existentes sem necessidade de alterar cada uso
  individual (via componentes compartilhados).

## 7. Requisitos não-funcionais

- **Acessibilidade**: contraste AA (WCAG 2.1) para o item realçado e o selecionado, claro e escuro.
- **Consistência**: aparência uniforme entre `Select` e `DropdownMenu`.
- **Não-regressão**: o estado disabled (`data-[disabled]:opacity-50`) e o layout (paddings/check) permanecem.
- **Performance**: sem custo (apenas classes utilitárias/tokens).

## 8. Edge cases técnicos

1. **Tema escuro**: realce não pode ficar "preto sobre escuro" — usar variante clara no `.dark` (token específico).
2. **Item desabilitado** em foco → mantém `opacity-50`, sem aplicar o realce de seleção (não confunde com habilitado).
3. **Opção longa** (texto que quebra/`line-clamp`) → o realce cobre toda a linha, sem cortar o check à direita.
4. **Select sem valor selecionado** (placeholder) → nenhum item marcado como selecionado; só hover realça.
5. **Hover + selecionado simultâneos** (passar o mouse sobre a opção já escolhida) → realce de hover prevalece
   visualmente sem perder a indicação de "selecionado".
6. **Daltonismo**: a distinção não depende só de cor — peso de fonte + check garantem indicação redundante.

## 9. Estratégia de testes

- Visual/manual: abrir cada caixinha (tipo de lançamento, categoria, navegação de mês, ativo) nos temas claro e escuro
  e confirmar realce de hover e destaque do selecionado.
- Acessibilidade: medir contraste do par realce/texto (ferramenta de contraste) em ambos os temas (≥ 4.5:1).
- Regressão: itens disabled mantêm aparência atenuada; layout do check preservado.

## 10. Breakdown de tarefas

**Frontend — tokens e tema**
- [x] T1 — Adicionar `--select-active` e `--select-active-foreground` em `globals.css` (`:root` e `.dark`) com contraste AA. *(—)*
- [x] T2 — Mapear as cores `select-active`/`select-active-foreground` no `tailwind.config`. *(T1)*

**Frontend — componentes**
- [x] T3 — `ui/select.tsx` (`SelectItem`): trocar `focus:bg-accent` pelo realce de alto contraste + destaque do
  `data-[state=checked]`. *(T2)*
- [x] T4 — `ui/dropdown-menu.tsx`: aplicar o mesmo realce nos itens de menu. *(T2)*

**Verificação**
- [x] T5 — Conferência visual + de contraste (claro/escuro) em todas as caixinhas e ajuste fino dos tokens. *(T3,T4)*

## 11. Decisões e premissas

- **D1** — Interpretação do pedido "cor preta para selecionar": o problema é **baixo contraste do realce** das caixinhas;
  a solução dá um realce de alto contraste ao item em foco e destaque persistente ao selecionado. *(Revisar com o usuário
  se ele preferir literalmente fundo preto fixo em vez de realce por token.)*
- **D2** — Usar **tokens dedicados** (`--select-active*`) em vez de redefinir `accent`, evitando efeitos colaterais em
  botões/badges que também usam `accent`.
- **D3** — Distinção **não depende só de cor** (peso de fonte + check) para acessibilidade e daltonismo.
- **D4** — Mudança concentrada nos **componentes compartilhados** (`Select`, `DropdownMenu`) para cobrir todas as telas
  de uma vez.
