import { MigrationInterface, QueryRunner } from "typeorm";

export class FormacaoTurmaCampos1792610550843 implements MigrationInterface {
    name = 'FormacaoTurmaCampos1792610550843'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."turmas_estado_enum" AS ENUM('PENDENTE', 'EM_CURSO', 'ENCERRADO', 'CANCELADA')`);

        // ---- TURMAS: novos campos
        await queryRunner.query(`ALTER TABLE "turmas" ADD "tipo_id" uuid`);
        await queryRunner.query(`ALTER TABLE "turmas" ADD "formato_id" uuid`);
        await queryRunner.query(`ALTER TABLE "turmas" ADD "acesso_certificado" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "turmas" ADD "carga_diaria" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "turmas" ADD "local" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "turmas" ADD "estado" "public"."turmas_estado_enum" NOT NULL DEFAULT 'PENDENTE'`);

        // Backfill a partir da formação associada
        await queryRunner.query(`
            UPDATE "turmas" t SET
                "tipo_id" = (SELECT tp.id FROM "tipos" tp JOIN "formacoes" f ON lower(f.tipo) = lower(tp.nome) WHERE f.id = t.formacao_id LIMIT 1),
                "formato_id" = (SELECT ft.id FROM "formatos" ft JOIN "formacoes" f ON lower(f.formato) = lower(ft.nome) WHERE f.id = t.formacao_id LIMIT 1),
                "acesso_certificado" = (SELECT f.acesso_certificado FROM "formacoes" f WHERE f.id = t.formacao_id),
                "local" = (SELECT f.local FROM "formacoes" f WHERE f.id = t.formacao_id)
        `);

        await queryRunner.query(`
            UPDATE "turmas" SET "estado" = (CASE
                WHEN "cancelada" = true THEN 'CANCELADA'
                WHEN "data_fim" IS NOT NULL AND "data_fim" < now() THEN 'ENCERRADO'
                WHEN "data_inicio" IS NOT NULL AND "data_inicio" <= now() THEN 'EM_CURSO'
                ELSE 'PENDENTE' END)::"public"."turmas_estado_enum"
        `);

        await queryRunner.query(`ALTER TABLE "turmas" ADD CONSTRAINT "FK_turmas_tipo" FOREIGN KEY ("tipo_id") REFERENCES "tipos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "turmas" ADD CONSTRAINT "FK_turmas_formato" FOREIGN KEY ("formato_id") REFERENCES "formatos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "turmas" DROP COLUMN "cancelada"`);

        // ---- FORMACAO: simplificar (carga horária total em horas + remover campos movidos para a turma)
        await queryRunner.query(`ALTER TABLE "formacoes" ADD COLUMN "carga_horaria_total" integer`);
        await queryRunner.query(`
            UPDATE "formacoes" SET "carga_horaria_total" =
                COALESCE(split_part("carga_horaria", ':', 1)::int, 0)
                + COALESCE(round(split_part("carga_horaria", ':', 2)::numeric / 60), 0)
        `);
        await queryRunner.query(`ALTER TABLE "formacoes" DROP COLUMN "carga_horaria"`);
        await queryRunner.query(`ALTER TABLE "formacoes" RENAME COLUMN "carga_horaria_total" TO "carga_horaria"`);
        await queryRunner.query(`ALTER TABLE "formacoes" ALTER COLUMN "carga_horaria" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "formacoes" ALTER COLUMN "carga_horaria" SET DEFAULT '0'`);

        await queryRunner.query(`ALTER TABLE "formacoes" DROP COLUMN "tipo"`);
        await queryRunner.query(`ALTER TABLE "formacoes" DROP COLUMN "formato"`);
        await queryRunner.query(`ALTER TABLE "formacoes" DROP COLUMN "acesso_certificado"`);
        await queryRunner.query(`ALTER TABLE "formacoes" DROP COLUMN "inicio"`);
        await queryRunner.query(`ALTER TABLE "formacoes" DROP COLUMN "local"`);
        await queryRunner.query(`ALTER TABLE "formacoes" DROP COLUMN "carga_horaria_anual"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "formacoes" ADD "carga_horaria_anual" integer`);
        await queryRunner.query(`ALTER TABLE "formacoes" ADD "local" character varying(150)`);
        await queryRunner.query(`ALTER TABLE "formacoes" ADD "inicio" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "formacoes" ADD "acesso_certificado" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "formacoes" ADD "formato" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "formacoes" ADD "tipo" character varying(100)`);

        await queryRunner.query(`ALTER TABLE "turmas" ADD "cancelada" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "turmas" DROP CONSTRAINT "FK_turmas_formato"`);
        await queryRunner.query(`ALTER TABLE "turmas" DROP CONSTRAINT "FK_turmas_tipo"`);
        await queryRunner.query(`ALTER TABLE "turmas" DROP COLUMN "estado"`);
        await queryRunner.query(`ALTER TABLE "turmas" DROP COLUMN "local"`);
        await queryRunner.query(`ALTER TABLE "turmas" DROP COLUMN "carga_diaria"`);
        await queryRunner.query(`ALTER TABLE "turmas" DROP COLUMN "acesso_certificado"`);
        await queryRunner.query(`ALTER TABLE "turmas" DROP COLUMN "formato_id"`);
        await queryRunner.query(`ALTER TABLE "turmas" DROP COLUMN "tipo_id"`);
        await queryRunner.query(`DROP TYPE "public"."turmas_estado_enum"`);
    }
}
