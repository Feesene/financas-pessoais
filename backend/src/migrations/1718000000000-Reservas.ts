import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria as tabelas `baldes` (objetivos de reserva) e `movimentos_reserva`
 * (aportes/retiradas), com índice de leitura (baldeId, competencia) e FK
 * com ON DELETE RESTRICT — a exclusão de balde com movimentos é barrada na aplicação.
 */
export class Reservas1718000000000 implements MigrationInterface {
  name = 'Reservas1718000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "baldes" (
        "id" uuid PRIMARY KEY,
        "nome" varchar(80) NOT NULL,
        "saldoInicial" numeric(12,2) NOT NULL DEFAULT 0,
        "cor" varchar(7)
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_baldes_nome" ON "baldes" ("nome")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "movimentos_reserva" (
        "id" uuid PRIMARY KEY,
        "baldeId" uuid NOT NULL,
        "tipo" varchar(10) NOT NULL,
        "valor" numeric(12,2) NOT NULL,
        "competencia" varchar(7) NOT NULL,
        "descricao" varchar(255)
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_movimentos_balde_competencia" ON "movimentos_reserva" ("baldeId", "competencia")`,
    );
    await queryRunner.query(`
      ALTER TABLE "movimentos_reserva"
      ADD CONSTRAINT "fk_movimentos_balde"
      FOREIGN KEY ("baldeId") REFERENCES "baldes" ("id") ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "movimentos_reserva" DROP CONSTRAINT IF EXISTS "fk_movimentos_balde"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_movimentos_balde_competencia"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "movimentos_reserva"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_baldes_nome"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "baldes"`);
  }
}
