# UI / Frontend — Convenções de Design

Referência canônica para a camada de interface. Toda feature nova (P2–P7) e qualquer refatoração de tela
**DEVE** seguir este documento. O módulo **Orçamento Mensal** (`frontend/src/components/orcamento`) é a
implementação de referência.

## Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Next.js 14 (App Router) + React 18, TypeScript |
| Estilização | Tailwind CSS (config em `tailwind.config.ts`) |
| Componentes | **shadcn/ui** (style `new-york`) sobre Radix UI — código vive em `src/components/ui` |
| Ícones | `lucide-react` |
| Toasts / avisos | `sonner` (`<Toaster />` montado no `app/layout.tsx`) |
| Gráficos | `recharts` |
| Utilitário de classes | `cn()` em `src/lib/utils.ts` (`clsx` + `tailwind-merge`) |

Alias de import: `@/*` → `frontend/src/*` (configurado em `tsconfig.json`, `baseUrl: "."`).

## Organização de arquivos

```
src/
  app/                  páginas (App Router) + globals.css com os tokens de tema
  components/
    ui/                 primitivos shadcn (button, card, dialog, alert-dialog, input,
                        label, select, sonner, badge, skeleton, …)
    <feature>/          componentes da feature (ex.: orcamento/)
  lib/                  utils (cn), api/, formatadores, helpers de domínio do front
```

Novos primitivos: adicionar via `npx shadcn@latest add <componente>` (ou copiar a fonte no mesmo estilo).
Componentes de feature **compõem** primitivos; não reescrevem estilos base.

## Tema e tokens

- Tema **dark** por padrão (`<html className="dark">`). Cores definidas como variáveis HSL em
  `app/globals.css` e expostas como tokens Tailwind (`bg-background`, `text-muted-foreground`, `border`,
  `bg-primary`, `bg-destructive`, `bg-success`, etc.).
- **Nunca** usar cores hex soltas no JSX — sempre os tokens. Isso mantém o tema único e tematizável.
- Semântica monetária: **receita** = `text-success` (verde), **despesa**/**saldo negativo** =
  `text-destructive` (vermelho). Valores sempre via `formatarReais()` e com `tabular-nums`.

## Convenções de interação (obrigatórias)

1. **Criar / editar registro → `Dialog` (modal).** Quando criar e editar compartilham os mesmos campos,
   use **um único** componente de formulário com modo condicional (ver `LancamentoFormDialog`). Nada de
   formulário cru fixo na página.
2. **Ação destrutiva (excluir, resetar) → `AlertDialog` de confirmação.** Nunca executar exclusão sem
   confirmação explícita. O botão de confirmação usa a variante `destructive`.
3. **Feedback de mutação → toast (`sonner`)**, nunca uma barra de erro fixa:
   - sucesso: `toast.success(...)`;
   - falha: `toast.error(mensagem da API)`;
   - estado divergente (ex.: 404 em recurso já removido): `toast.warning(...)` + recarregar.
4. **Erro de carregamento inicial → estado de erro na própria área** com ícone e botão
   **"Tentar novamente"** (não usar toast como único canal para falha de fetch da tela).
5. **Loading → `Skeleton`** com a forma do conteúdo final. Evitar o texto "Carregando…".
6. **Estado vazio → `Card`** (borda tracejada) com ícone, mensagem curta e CTA para a ação principal.
7. **Após qualquer mutação, reconsultar o servidor** (lista + agregados) — fonte de verdade no backend
   (alinhado à decisão D3 das specs).

## Formulários

- Campos com `Label` associado (`htmlFor`/`id`); inputs via primitivos `Input` / `Select`.
- Botão de submit desabilitado enquanto inválido ou em envio; texto muda para "Salvando…".
- Validação de borda no front (campos obrigatórios, valor > 0); invariantes de negócio permanecem no backend.

## Gráficos (Recharts)

- Envolver em `ResponsiveContainer`; cores derivadas dos tokens de tema.
- Tooltips e labels em pt-BR; valores monetários via `formatarReais`.
- Usado nas features com visualização (relatórios, reservas, carteira, projeções).

## Acessibilidade

- Botões somente-ícone **DEVEM** ter `aria-label` (e `title`).
- Foco, `Esc` e travamento de scroll em modais são geridos pelo Radix — não reimplementar.
- Contraste mínimo garantido pelos tokens; não reduzir opacidade de texto abaixo de `muted-foreground`.

## Checklist de PR de frontend

- [ ] Usa primitivos de `components/ui` (sem CSS solto/strings de cor hex).
- [ ] Criação/edição em `Dialog`; exclusão com `AlertDialog`.
- [ ] Sucesso/erro de mutação via `toast`.
- [ ] Estados de loading (skeleton), vazio e erro tratados.
- [ ] Botões de ícone com `aria-label`; valores em R$ com `formatarReais`.
