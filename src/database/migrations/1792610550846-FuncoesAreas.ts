import { MigrationInterface, QueryRunner } from "typeorm";

export class FuncoesAreas1792610550846 implements MigrationInterface {
    name = 'FuncoesAreas1792610550846'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "funcoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(150) NOT NULL, "activo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_funcoes_nome" UNIQUE ("nome"), CONSTRAINT "PK_funcoes_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "areas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(150) NOT NULL, "activo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_areas_nome" UNIQUE ("nome"), CONSTRAINT "PK_areas_id" PRIMARY KEY ("id"))`);

        // Seed a partir dos valores distintos existentes nos formandos
        await queryRunner.query(`INSERT INTO "funcoes" ("nome") SELECT DISTINCT "funcao" FROM "formandos" WHERE "funcao" IS NOT NULL AND "funcao" <> '' ON CONFLICT DO NOTHING`);
        await queryRunner.query(`INSERT INTO "areas" ("nome") SELECT DISTINCT "area_direcao" FROM "formandos" WHERE "area_direcao" IS NOT NULL AND "area_direcao" <> '' ON CONFLICT DO NOTHING`);

        await queryRunner.query(`ALTER TABLE "formandos" ADD "funcao_id" uuid`);
        await queryRunner.query(`ALTER TABLE "formandos" ADD "area_id" uuid`);

        await queryRunner.query(`UPDATE "formandos" SET "funcao_id" = (SELECT id FROM "funcoes" WHERE nome = "formandos"."funcao" LIMIT 1) WHERE "funcao" IS NOT NULL`);
        await queryRunner.query(`UPDATE "formandos" SET "area_id" = (SELECT id FROM "areas" WHERE nome = "formandos"."area_direcao" LIMIT 1) WHERE "area_direcao" IS NOT NULL`);

        await queryRunner.query(`ALTER TABLE "formandos" ADD CONSTRAINT "FK_formandos_funcao" FOREIGN KEY ("funcao_id") REFERENCES "funcoes"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "formandos" ADD CONSTRAINT "FK_formandos_area" FOREIGN KEY ("area_id") REFERENCES "areas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        await queryRunner.query(`ALTER TABLE "formandos" DROP COLUMN "funcao"`);
        await queryRunner.query(`ALTER TABLE "formandos" DROP COLUMN "area_direcao"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "formandos" ADD "area_direcao" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "formandos" ADD "funcao" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "formandos" DROP CONSTRAINT "FK_formandos_area"`);
        await queryRunner.query(`ALTER TABLE "formandos" DROP CONSTRAINT "FK_formandos_funcao"`);
        await queryRunner.query(`ALTER TABLE "formandos" DROP COLUMN "area_id"`);
        await queryRunner.query(`ALTER TABLE "formandos" DROP COLUMN "funcao_id"`);
        await queryRunner.query(`DROP TABLE "areas"`);
        await queryRunner.query(`DROP TABLE "funcoes"`);
    }
}
