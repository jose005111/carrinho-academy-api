import { MigrationInterface, QueryRunner } from "typeorm";

export class TiposFormatos1792610550842 implements MigrationInterface {
    name = 'TiposFormatos1792610550842'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tipos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(100) NOT NULL, "activo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_tipos_nome" UNIQUE ("nome"), CONSTRAINT "PK_tipos_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "formatos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(100) NOT NULL, "activo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_formatos_nome" UNIQUE ("nome"), CONSTRAINT "PK_formatos_id" PRIMARY KEY ("id"))`);

        // Seed com valores base + valores distintos já existentes nas formações
        await queryRunner.query(`INSERT INTO "tipos" ("nome") VALUES ('Formação'), ('Curso') ON CONFLICT DO NOTHING`);
        await queryRunner.query(`INSERT INTO "formatos" ("nome") VALUES ('Presencial'), ('Online'), ('Híbrido') ON CONFLICT DO NOTHING`);

        await queryRunner.query(`INSERT INTO "tipos" ("nome") SELECT DISTINCT "tipo" FROM "formacoes" WHERE "tipo" IS NOT NULL AND "tipo" <> '' ON CONFLICT DO NOTHING`);
        await queryRunner.query(`INSERT INTO "formatos" ("nome") SELECT DISTINCT "formato" FROM "formacoes" WHERE "formato" IS NOT NULL AND "formato" <> '' ON CONFLICT DO NOTHING`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "formatos"`);
        await queryRunner.query(`DROP TABLE "tipos"`);
    }
}
