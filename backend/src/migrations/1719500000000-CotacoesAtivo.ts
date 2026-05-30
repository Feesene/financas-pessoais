import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria a tabela `cotacao_ativo`: snapshot do preço/valor de um ativo por competência.
 * Único por (ativoId, competencia), índice por ativoId e FK com ON DELETE CASCADE —
 * excluir um ativo remove suas cotações automaticamente (diferente dos movimentos).
 */
export class CotacoesAtivo1719500000000 implements MigrationInterface {
  name = 'CotacoesAtivo1719500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "cotacao_ativo" (
        "id" uuid PRIMARY KEY,
        "ativoId" uuid NOT NULL,
        "competencia" varchar(7) NOT NULL,
        "valorUnitario" numeric(12,2),
        "valorBruto" numeric(12,2)
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_cotacao_ativo_ativo_competencia" ON "cotacao_ativo" ("ativoId", "competencia")`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_cotacao_ativo_ativo" ON "cotacao_ativo" ("ativoId")`,
    );
    await queryRunner.query(`
      ALTER TABLE "cotacao_ativo"
      ADD CONSTRAINT "fk_cotacao_ativo_ativo"
      FOREIGN KEY ("ativoId") REFERENCES "ativos" ("id") ON DELETE CASCADE
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "cotacao_ativo" DROP CONSTRAINT IF EXISTS "fk_cotacao_ativo_ativo"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_cotacao_ativo_ativo"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_cotacao_ativo_ativo_competencia"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "cotacao_ativo"`);
  }
}
