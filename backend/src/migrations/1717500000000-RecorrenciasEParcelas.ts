import type { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cria a tabela `regras_recorrentes` e o registro `ocorrencias_excluidas`,
 * e estende `lancamentos` com o vínculo de origem (`origemRegraId`,
 * `ocorrenciaIndice`) + índice único que garante idempotência da materialização.
 */
export class RecorrenciasEParcelas1717500000000 implements MigrationInterface {
  name = 'RecorrenciasEParcelas1717500000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "regras_recorrentes" (
        "id" uuid PRIMARY KEY,
        "tipo" varchar(10) NOT NULL,
        "categoriaId" uuid NOT NULL,
        "descricao" varchar(255),
        "valorBase" numeric(12,2) NOT NULL,
        "frequencia" varchar(10) NOT NULL,
        "competenciaInicio" varchar(7) NOT NULL,
        "competenciaFim" varchar(7),
        "numeroParcelas" int,
        "ativa" boolean NOT NULL DEFAULT true,
        CONSTRAINT "fk_regras_categoria"
          FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_regras_ativa_inicio" ON "regras_recorrentes" ("ativa", "competenciaInicio")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "ocorrencias_excluidas" (
        "origemRegraId" uuid NOT NULL,
        "ocorrenciaIndice" int NOT NULL,
        PRIMARY KEY ("origemRegraId", "ocorrenciaIndice")
      )
    `);

    await queryRunner.query(
      `ALTER TABLE "lancamentos" ADD COLUMN IF NOT EXISTS "origemRegraId" uuid`,
    );
    await queryRunner.query(
      `ALTER TABLE "lancamentos" ADD COLUMN IF NOT EXISTS "ocorrenciaIndice" int`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_lancamentos_origem_ocorrencia" ON "lancamentos" ("origemRegraId", "ocorrenciaIndice")`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "uq_lancamentos_origem_ocorrencia"`);
    await queryRunner.query(
      `ALTER TABLE "lancamentos" DROP COLUMN IF EXISTS "ocorrenciaIndice"`,
    );
    await queryRunner.query(`ALTER TABLE "lancamentos" DROP COLUMN IF EXISTS "origemRegraId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "ocorrencias_excluidas"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "regras_recorrentes"`);
  }
}
