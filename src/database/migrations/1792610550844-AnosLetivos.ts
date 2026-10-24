import { MigrationInterface, QueryRunner } from "typeorm";

export class AnosLetivos1792610550844 implements MigrationInterface {
    name = 'AnosLetivos1792610550844'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "anos_letivos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "ano" integer NOT NULL, "activo" boolean NOT NULL DEFAULT true, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_anos_letivos_ano" UNIQUE ("ano"), CONSTRAINT "PK_anos_letivos_id" PRIMARY KEY ("id"))`);

        const anoAtual = new Date().getFullYear();
        const anos = [anoAtual - 1, anoAtual, anoAtual + 1];
        for (const ano of anos) {
            await queryRunner.query(
                `INSERT INTO "anos_letivos" ("ano") VALUES ($1) ON CONFLICT DO NOTHING`,
                [ano],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "anos_letivos"`);
    }
}
