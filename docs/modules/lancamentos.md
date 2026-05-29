# Módulo: lancamentos (backend)

> Caminho: `backend/src/modules/lancamentos/`

## Objetivo do módulo

Gerenciar os **lançamentos financeiros** — receitas e despesas — que formam a base do orçamento mensal (P1). É
o **módulo de referência** do projeto: todos os demais módulos de domínio (P2–P7) devem seguir a mesma
estrutura de quatro camadas.

## Responsabilidade principal

- **É competência deste módulo**: criar e listar lançamentos, garantindo as invariantes do domínio (valor > 0,
  categoria preenchida, competência no formato `AAAA-MM`) e expor o valor com sinal (receita positiva, despesa
  negativa).
- **Não é competência deste módulo**: cálculo de metas/orçamento por categoria (P2), recorrências (P3),
  relatórios consolidados (P5). Esses serão módulos próprios que podem consumir os dados de lançamentos.

## Funcionalidades existentes

- `POST /lancamentos` — cria um lançamento (`CriarLancamentoUseCase`).
- `GET /lancamentos?competencia=AAAA-MM` — lista os lançamentos de um mês (`ListarLancamentosUseCase`).

## Estrutura (quatro camadas)

```
lancamentos/
├── domain/
│   ├── entities/lancamento.ts                 # entidade + invariantes (TS puro)
│   ├── repositories/lancamento.repository.ts  # interface + token LANCAMENTO_REPOSITORY
│   └── errors/lancamento-invalido.error.ts
├── application/
│   ├── dtos/criar-lancamento.dto.ts
│   └── use-cases/{criar-lancamento,listar-lancamentos}.use-case.ts
├── infrastructure/persistence/
│   ├── entities/lancamento.schema.ts          # @Entity TypeORM
│   ├── mappers/lancamento.mapper.ts           # domínio ↔ persistência
│   └── repositories/typeorm-lancamento.repository.ts
├── presentation/
│   ├── controllers/lancamentos.controller.ts
│   └── dtos/criar-lancamento.request.ts       # class-validator
└── lancamentos.module.ts                      # wiring de DI
```

## Dependências internas

- `backend/src/shared/domain/domain-error.ts` — base de `LancamentoInvalidoError`.
- `@financas-pessoais/shared` — tipos `TipoLancamento` e `LancamentoDTO` (contrato da API).

## Dependências externas

- `@nestjs/common`, `@nestjs/typeorm`, `typeorm` — DI, persistência.
- `class-validator` — validação do DTO de request.
- `node:crypto` (`randomUUID`) — geração de id.

## Módulos relacionados

- **Quem dependerá deste módulo** *(planejado)*: P2 (metas por categoria), P5 (histórico/relatórios) e a
  agregação de saldo do mês consumirão lançamentos. **[Hipótese]** — ainda não implementado.

## Pontos de entrada (entry points)

- HTTP: `LancamentosController` (`backend/src/modules/lancamentos/presentation/controllers/lancamentos.controller.ts`).
- Registro no app: `LancamentosModule` importado em `backend/src/app.module.ts`.

## Fluxos importantes

**Criar lançamento**
1. `LancamentosController.criar` recebe `CriarLancamentoRequest` (validado pelo `ValidationPipe` global).
2. Chama `CriarLancamentoUseCase.execute`.
3. O caso de uso constrói `Lancamento.criar(...)` (valida invariantes) e persiste via `LancamentoRepository`.
4. `TypeOrmLancamentoRepository` mapeia para `LancamentoSchema` e salva no Postgres.
5. Retorna `LancamentoDTO`.

## Arquivos críticos

- `domain/entities/lancamento.ts` — coração das regras de negócio.
- `lancamentos.module.ts` — liga a interface `LANCAMENTO_REPOSITORY` à implementação TypeORM.
- `infrastructure/persistence/mappers/lancamento.mapper.ts` — fronteira entre domínio e ORM.

## Observações técnicas e débitos

- Ainda **não há** casos de uso de edição/exclusão de lançamento — adicionar conforme a Spec de P1 evoluir.
- Valor monetário trafega como `number` no domínio e `numeric(12,2)` no banco; atenção a arredondamento.
- Sem testes automatizados ainda; o domínio é projetado para ser testável sem banco/HTTP.
