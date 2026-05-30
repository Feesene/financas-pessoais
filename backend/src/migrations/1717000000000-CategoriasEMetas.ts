import type { MigrationInterface, QueryRunner } from 'typeorm';
import {
  planejarMigracaoCategorias,
  type CategoriaExistente,
  type LancamentoParaMigrar,
} from '../modules/categorias/application/migracao/planejar-migracao-categorias';

/**
 * Cria as tabelas `categorias` e `metas_mensais`, adiciona `categoriaId` aos
 * lançamentos e migra as categorias-texto (P1) para registros de categoria,
 * populando `categoriaId` e adicionando a FK com ON DELETE RESTRICT.
 */
export class CategoriasEMetas1717000000000 implements MigrationInterface {
  name = 'CategoriasEMetas1717000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "categorias" (
        "id" uuid PRIMARY KEY,
        "nome" varchar(80) NOT NULL,
        "tipo" varchar(10) NOT NULL,
        "cor" varchar(7)
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "uq_categorias_nome_tipo" ON "categorias" ("nome", "tipo")`,
    );

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "metas_mensais" (
        "id" uuid PRIMARY KEY,
        "categoriaId" uuid NOT NULL,
        "competencia" varchar(7) NOT NULL,
        "valor" numeric(12,2) NOT NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS "idx_metas_categoria_competencia" ON "metas_mensais" ("categoriaId", "competencia")`,
    );

    await queryRunner.query(
      `ALTER TABLE "lancamentos" ADD COLUMN IF NOT EXISTS "categoriaId" uuid`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "idx_lancamentos_categoria_competencia" ON "lancamentos" ("categoriaId", "competencia")`,
    );

    // Backfill: deriva categorias dos textos distintos e popula categoriaId.
    const lancamentos: LancamentoParaMigrar[] = await queryRunner.query(
      `SELECT "id", "categoria", "tipo", "categoriaId" FROM "lancamentos"`,
    );
    const categoriasExistentes: CategoriaExistente[] = await queryRunner.query(
      `SELECT "id", "nome", "tipo" FROM "categorias"`,
    );

    const plano = planejarMigracaoCategorias(lancamentos, categoriasExistentes);

    for (const categoria of plano.novasCategorias) {
      await queryRunner.query(
        `INSERT INTO "categorias" ("id", "nome", "tipo", "cor") VALUES ($1, $2, $3, NULL)`,
        [categoria.id, categoria.nome, categoria.tipo],
      );
    }
    for (const atribuicao of plano.atribuicoes) {
      await queryRunner.query(`UPDATE "lancamentos" SET "categoriaId" = $1 WHERE "id" = $2`, [
        atribuicao.categoriaId,
        atribuicao.lancamentoId,
      ]);
    }

    await queryRunner.query(`
      ALTER TABLE "lancamentos"
      ADD CONSTRAINT "fk_lancamentos_categoria"
      FOREIGN KEY ("categoriaId") REFERENCES "categorias" ("id") ON DELETE RESTRICT
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "lancamentos" DROP CONSTRAINT IF EXISTS "fk_lancamentos_categoria"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_lancamentos_categoria_competencia"`);
    await queryRunner.query(`ALTER TABLE "lancamentos" DROP COLUMN IF EXISTS "categoriaId"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "metas_mensais"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "categorias"`);
  }
}
