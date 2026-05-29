# Módulo: shared (pacote `@financas-pessoais/shared`)

> Caminho: `shared/`

## Objetivo do módulo

Centralizar os **contratos e tipos compartilhados** entre frontend e backend, evitando divergência de contrato
entre cliente e servidor.

## Responsabilidade principal

- **É competência deste pacote**: tipos de transporte da API (DTOs de resposta), enums/uniões de domínio
  reutilizáveis e utilitários puros sem dependência de framework.
- **Não é competência deste pacote**: regra de negócio, acesso a banco, componentes de UI.

## Funcionalidades existentes

Exporta (via `shared/src/types/index.ts`):

- `ApiResponse<T>` — envelope genérico de resposta.
- `TipoLancamento` — união `'RECEITA' | 'DESPESA'`.
- `LancamentoDTO` — representação de um lançamento exposto pela API.

## Dependências internas

- Nenhuma. É a base do grafo de dependências; os outros pacotes dependem dele.

## Dependências externas

- Nenhuma em runtime. Apenas TypeScript para build de tipos.

## Módulos relacionados

- **`backend`** consome os tipos nos DTOs de aplicação e no contrato dos controllers.
- **`frontend`** consome os mesmos tipos ao chamar a API (`transpilePackages` no `next.config.mjs`).

## Pontos de entrada (entry points)

- `shared/src/index.ts` → reexporta `./types`.

## Arquivos críticos

- `shared/src/types/index.ts` — fonte única dos contratos.

## Observações técnicas e débitos

- Resolvido via `paths` do TypeScript (`@financas-pessoais/shared`) em `tsconfig.base.json` e nos tsconfigs de
  `frontend`/`backend`. Em produção, o frontend transpila o pacote (`transpilePackages`).
- Convenção: **declarar o tipo aqui antes** de implementar os dois lados de uma nova feature.
