import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adiciona `criadoEm` (timestamp ISO de registro) a `movimentos_reserva`.
 * Linhas pré-existentes não têm data histórica real, então recebem o 1º dia da
 * sua competência como melhor proxy — mesmo fallback aplicado pelo mapper ao ler
 * linhas null. A coluna permanece nullable para casar com o schema (synchronize).
 */
export class MovimentoReservaCriadoEm1720000000000 implements MigrationInterface {
  name = 'MovimentoReservaCriadoEm1720000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "movimentos_reserva" ADD COLUMN IF NOT EXISTS "criadoEm" varchar(30)`,
    );
    await queryRunner.query(
      `UPDATE "movimentos_reserva"
       SET "criadoEm" = "competencia" || '-01T00:00:00.000Z'
       WHERE "criadoEm" IS NULL`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "movimentos_reserva" DROP COLUMN IF EXISTS "criadoEm"`,
    );
  }
}
