import { MigrationInterface, QueryRunner } from "typeorm";

export class TurmasInscricoes1792610550840 implements MigrationInterface {
    name = 'TurmasInscricoes1792610550840'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."formandos_genero_enum" AS ENUM('M', 'F', 'OUTRO')`);
        await queryRunner.query(`CREATE TYPE "public"."inscricoes_estado_enum" AS ENUM('INSCRITO', 'CONCLUIDO', 'DESISTIU', 'REPROVADO', 'CANCELADO')`);
        await queryRunner.query(`CREATE TYPE "public"."inscricoes_origem_enum" AS ENUM('MANUAL', 'RETROATIVA', 'IMPORTACAO')`);

        await queryRunner.query(`CREATE TABLE "turmas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "formacao_id" uuid NOT NULL, "ano" integer NOT NULL, "data_inicio" TIMESTAMP, "data_fim" TIMESTAMP, "lotacao" integer NOT NULL DEFAULT '0', "cancelada" boolean NOT NULL DEFAULT false, "codigo" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_turmas_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_turmas_formacao_id" ON "turmas" ("formacao_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_turmas_ano" ON "turmas" ("ano")`);

        await queryRunner.query(`CREATE TABLE "inscricoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "turma_id" uuid NOT NULL, "associado_id" uuid NOT NULL, "estado" "public"."inscricoes_estado_enum" NOT NULL DEFAULT 'INSCRITO', "origem" "public"."inscricoes_origem_enum" NOT NULL DEFAULT 'MANUAL', "data_inscricao" TIMESTAMP NOT NULL DEFAULT now(), "data_conclusao" TIMESTAMP, "criado_por" uuid, "observacao" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_inscricoes_turma_associado" UNIQUE ("turma_id", "associado_id"), CONSTRAINT "PK_inscricoes_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_inscricoes_associado_id" ON "inscricoes" ("associado_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_inscricoes_turma_estado" ON "inscricoes" ("turma_id", "estado")`);

        await queryRunner.query(`ALTER TABLE "formandos" ADD "genero" "public"."formandos_genero_enum"`);

        await queryRunner.query(`ALTER TABLE "turmas" ADD CONSTRAINT "FK_turmas_formacao" FOREIGN KEY ("formacao_id") REFERENCES "formacoes"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscricoes" ADD CONSTRAINT "FK_inscricoes_turma" FOREIGN KEY ("turma_id") REFERENCES "turmas"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inscricoes" ADD CONSTRAINT "FK_inscricoes_associado" FOREIGN KEY ("associado_id") REFERENCES "formandos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

        // Backfill do género a partir do sexo existente (homem/masculino -> M, mulher/feminino -> F)
        await queryRunner.query(
            `UPDATE "formandos" SET "genero" = (CASE
                WHEN lower("sexo") IN ('homem', 'masculino', 'm') THEN 'M'
                WHEN lower("sexo") IN ('mulher', 'feminino', 'f') THEN 'F'
                ELSE 'OUTRO' END)::"formandos_genero_enum"`
        );

        // Migração dos dados de formando_formacao -> turmas + inscricoes (turma implícita por formação)
        const formacoesComFormandos: Array<{ id: string; inicio: Date | null }> =
            await queryRunner.query(
                `SELECT DISTINCT ff.formacao_id AS id, f.inicio FROM formando_formacao ff JOIN formacoes f ON f.id = ff.formacao_id`
            );

        const mapaTurmaPorFormacao = new Map<string, string>();
        let sequencia = 0;
        for (const formacao of formacoesComFormandos) {
            const ano = formacao.inicio
                ? new Date(formacao.inicio).getFullYear()
                : new Date().getFullYear();
            const codigo = `TRM-${ano}-MIG${String(++sequencia).padStart(3, '0')}`;
            const [turma] = await queryRunner.query(
                `INSERT INTO "turmas" ("formacao_id", "ano", "data_inicio", "data_fim", "lotacao", "cancelada", "codigo") VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING "id"`,
                [formacao.id, ano, formacao.inicio ?? null, null, 0, false, codigo],
            );
            mapaTurmaPorFormacao.set(formacao.id, turma.id);
        }

        const associacoes: Array<{
            formando_id: string;
            formacao_id: string;
            created_at: Date;
        }> = await queryRunner.query(
            `SELECT formando_id, formacao_id, created_at FROM formando_formacao`
        );

        for (const associacao of associacoes) {
            const turmaId = mapaTurmaPorFormacao.get(associacao.formacao_id);
            if (!turmaId) continue;
            await queryRunner.query(
                `INSERT INTO "inscricoes" ("turma_id", "associado_id", "estado", "origem", "data_inscricao", "data_conclusao") VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING`,
                [
                    turmaId,
                    associacao.formando_id,
                    'CONCLUIDO',
                    'RETROATIVA',
                    associacao.created_at ?? new Date(),
                    associacao.created_at ?? new Date(),
                ],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inscricoes" DROP CONSTRAINT "FK_inscricoes_associado"`);
        await queryRunner.query(`ALTER TABLE "inscricoes" DROP CONSTRAINT "FK_inscricoes_turma"`);
        await queryRunner.query(`ALTER TABLE "turmas" DROP CONSTRAINT "FK_turmas_formacao"`);
        await queryRunner.query(`ALTER TABLE "formandos" DROP COLUMN "genero"`);
        await queryRunner.query(`DROP TABLE "inscricoes"`);
        await queryRunner.query(`DROP TABLE "turmas"`);
        await queryRunner.query(`DROP TYPE "public"."inscricoes_origem_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inscricoes_estado_enum"`);
        await queryRunner.query(`DROP TYPE "public"."formandos_genero_enum"`);
    }
}
