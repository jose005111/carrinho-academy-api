import { MigrationInterface, QueryRunner } from "typeorm";

export class Configuracoes1792610550839 implements MigrationInterface {
    name = 'Configuracoes1792610550839'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."configuracoes_tipo_enum" AS ENUM('string', 'number', 'boolean', 'json', 'date')`);
        await queryRunner.query(`CREATE TABLE "configuracoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "chave" character varying(100) NOT NULL, "valor" text NOT NULL, "tipo" "public"."configuracoes_tipo_enum" NOT NULL DEFAULT 'string', "grupo" character varying(100) NOT NULL DEFAULT 'geral', "descricao" text, "editavel" boolean NOT NULL DEFAULT true, "updated_by" uuid, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_5b1f4c4e9e9c4f8d8a1e0c7d7e" UNIQUE ("chave"), CONSTRAINT "PK_0f3a1a1f3c4b5e6d7e8f9a0b1c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "auditoria" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "utilizador_id" uuid, "accao" character varying(100) NOT NULL, "entidade" character varying(100) NOT NULL, "entidade_id" uuid, "antes" jsonb, "depois" jsonb, "ip" character varying(50), "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_9d9c0f0e0a1b2c3d4e5f6a7b8c" PRIMARY KEY ("id"))`);

        const ano = new Date().getFullYear();
        const seed = [
            ["ano_vigente", String(ano), "number", "turmas", "Ano vigente usado como pré-filtro de turmas e dashboard"],
            ["permitir_turma_passado", "true", "boolean", "turmas", "Permite criar turmas com data de fim no passado"],
            ["max_formandos_por_turma", "0", "number", "turmas", "Limite de formandos por turma (0 = sem limite)"],
            ["incluir_desistentes_nas_sugestoes", "true", "boolean", "atribuicoes", "Inclui desistentes na sugestão de candidatos"],
            ["itens_por_pagina", "20", "number", "geral", "Número de itens por página nas listagens"],
            ["nome_organizacao", "Carinho Academy", "string", "geral", "Nome da organização"],
            ["prefixo_codigo_turma", "TRM", "string", "turmas", "Prefixo do código gerado para as turmas"],
        ] as const;

        for (const [chave, valor, tipo, grupo, descricao] of seed) {
            await queryRunner.query(
                `INSERT INTO "configuracoes" ("chave", "valor", "tipo", "grupo", "descricao") VALUES ($1, $2, $3, $4, $5)`,
                [chave, valor, tipo, grupo, descricao],
            );
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "auditoria"`);
        await queryRunner.query(`DROP TABLE "configuracoes"`);
        await queryRunner.query(`DROP TYPE "public"."configuracoes_tipo_enum"`);
    }
}
