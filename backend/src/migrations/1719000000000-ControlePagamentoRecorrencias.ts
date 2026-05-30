import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Adiciona o controle de pagamento de ocorrências recorrentes em `lancamentos`:
 * `pago` (default false retroativo) e `valorPago` (null = ainda não pago / manual).
 */
export class ControlePagamentoRecorrencias1719000000000 implements MigrationInterface {
  name = 'ControlePagamentoRecorrencias1719000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lancamentos" ADD COLUMN IF NOT EXISTS "pago" boolean NOT NULL DEFAULT false`,
    );
    await queryRunner.query(
      `ALTER TABLE "lancamentos" ADD COLUMN IF NOT EXISTS "valorPago" numeric(12,2)`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lancamentos" DROP COLUMN IF EXISTS "valorPago"`);
    await queryRunner.query(`ALTER TABLE "lancamentos" DROP COLUMN IF EXISTS "pago"`);
  }
}
