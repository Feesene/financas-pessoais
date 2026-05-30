import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria as tabelas `ativos` (carteira de investimentos) e `movimentos_carteira`
 * (entradas/saídas/rendimentos), com índice de leitura (ativoId, competencia) e
 * FK com ON DELETE RESTRICT — a exclusão de ativo com movimentos é barrada na aplicação.
 */
export class Investimentos1718500000000 implements MigrationInterface {
  name = 'Investimentos1718500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ativos" (
        "id" uuid PRIMARY KEY,
        "tipo" varchar(10) NOT NULL,
        "descricao" varchar(80) NOT NULL,
        "quantidade" numeric(18,6),
        "valorUnitario" numeric(12,2),
        "valorBruto" numeric(12,2) NOT NULL,
        "rendimento" numeric(12,2) NOT NULL DEFAULT 0
      )
    `);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "movimentos_carteira" (
        "id" uuid PRIMARY KEY,
        "ativoId" uuid NOT NULL,
        "tipo" varchar(10) NOT NULL,
        "valor" numeric(12,2) NOT NULL,
        "competencia" varchar(7) NOT NULL,
        "descricao" varchar(255)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_movimentos_carteira_ativo_competencia" ON "movimentos_carteira" ("ativoId", "competencia")`,
    );
    await queryRunner.query(`
      ALTER TABLE "movimentos_carteira"
      ADD CONSTRAINT "fk_movimentos_carteira_ativo"
      FOREIGN KEY ("ativoId") REFERENCES "ativos" ("id") ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "movimentos_carteira" DROP CONSTRAINT IF EXISTS "fk_movimentos_carteira_ativo"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "idx_movimentos_carteira_ativo_competencia"`,
    );
    await queryRunner.query(`DROP TABLE IF EXISTS "movimentos_carteira"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ativos"`);
  }
}
