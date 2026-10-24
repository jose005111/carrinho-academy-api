import { MigrationInterface, QueryRunner } from "typeorm";

const MODULOS_CRUD = ["turmas", "formandos", "formacoes", "formadores", "empresas"];
const ACOES_PADRAO = ["ver", "criar", "editar", "eliminar", "exportar", "importar"];

function codigosBase(): string[] {
  const lista: string[] = [];
  for (const modulo of MODULOS_CRUD) {
    for (const accao of ACOES_PADRAO) {
      lista.push(`${modulo}:${accao}`);
    }
  }
  return lista;
}

const CODIGOS_ESPECIFICOS = [
  "atribuicoes:ver",
  "atribuicoes:inscrever",
  "configuracoes:ver",
  "configuracoes:editar",
  "perfis:ver",
  "perfis:criar",
  "perfis:editar",
  "perfis:eliminar",
  "perfis:gerir",
  "utilizadores:ver",
  "utilizadores:criar",
  "utilizadores:editar",
  "utilizadores:eliminar",
  "utilizadores:gerir",
  "auditoria:ver",
  "dashboard:ver",
];

export class Rbac1792610550841 implements MigrationInterface {
    name = 'Rbac1792610550841'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."utilizador_permissoes_efeito_enum" AS ENUM('ALLOW', 'DENY')`);
        await queryRunner.query(`CREATE TABLE "permissoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "codigo" character varying(100) NOT NULL, "modulo" character varying(100) NOT NULL, "accao" character varying(100) NOT NULL, "descricao" text, CONSTRAINT "UQ_permissoes_codigo" UNIQUE ("codigo"), CONSTRAINT "PK_permissoes_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "perfis" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(150) NOT NULL, "descricao" text, "activo" boolean NOT NULL DEFAULT true, "sistema" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_perfis_nome" UNIQUE ("nome"), CONSTRAINT "PK_perfis_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "perfil_permissoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "perfil_id" uuid NOT NULL, "permissao_id" uuid NOT NULL, CONSTRAINT "UQ_perfil_permissoes" UNIQUE ("perfil_id", "permissao_id"), CONSTRAINT "PK_perfil_permissoes_id" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "utilizador_permissoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "utilizador_id" uuid NOT NULL, "permissao_id" uuid NOT NULL, "efeito" "public"."utilizador_permissoes_efeito_enum" NOT NULL DEFAULT 'ALLOW', "expira_em" TIMESTAMP, "concedido_por" uuid, "motivo" text, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_utilizador_permissoes_id" PRIMARY KEY ("id"))`);

        await queryRunner.query(`ALTER TABLE "users" ADD "perfil_acesso_id" uuid`);
        await queryRunner.query(`ALTER TABLE "users" ADD "token_version" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "activo" boolean NOT NULL DEFAULT true`);

        await queryRunner.query(`ALTER TABLE "perfil_permissoes" ADD CONSTRAINT "FK_perfil_permissoes_perfil" FOREIGN KEY ("perfil_id") REFERENCES "perfis"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "perfil_permissoes" ADD CONSTRAINT "FK_perfil_permissoes_permissao" FOREIGN KEY ("permissao_id") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "utilizador_permissoes" ADD CONSTRAINT "FK_utilizador_permissoes_utilizador" FOREIGN KEY ("utilizador_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "utilizador_permissoes" ADD CONSTRAINT "FK_utilizador_permissoes_permissao" FOREIGN KEY ("permissao_id") REFERENCES "permissoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_perfil_acesso" FOREIGN KEY ("perfil_acesso_id") REFERENCES "perfis"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

        const todosCodigos = [...codigosBase(), ...CODIGOS_ESPECIFICOS];

        // 1) Catálogo de permissões
        for (const codigo of todosCodigos) {
            const [modulo, accao] = codigo.split(':');
            await queryRunner.query(
                `INSERT INTO "permissoes" ("codigo", "modulo", "accao") VALUES ($1, $2, $3)`,
                [codigo, modulo, accao],
            );
        }

        // 2) Perfis
        const perfis: Record<string, { descricao: string; sistema?: boolean; codigos: string[] }> = {
            'Super Admin': { descricao: 'Acesso total ao sistema', sistema: true, codigos: todosCodigos },
            'Administrador': { descricao: 'Gestão geral (sem perfis)', codigos: todosCodigos.filter((c) => !c.startsWith('perfis:') && c !== 'utilizadores:gerir') },
            'Gestor de Formações': {
                descricao: 'Turmas, atribuições e formandos',
                codigos: todosCodigos.filter((c) =>
                    c.startsWith('turmas:') ||
                    c.startsWith('formandos:') ||
                    c.startsWith('formacoes:') ||
                    c.startsWith('atribuicoes:') ||
                    c === 'dashboard:ver',
                ),
            },
            'Operador': {
                descricao: 'Criar/editar sem eliminar',
                codigos: todosCodigos.filter((c) =>
                    ['turmas:ver', 'turmas:criar', 'turmas:editar', 'formandos:ver', 'formandos:criar', 'formandos:editar', 'formacoes:ver', 'atribuicoes:ver', 'atribuicoes:inscrever', 'dashboard:ver'].includes(c),
                ),
            },
            'Consulta': {
                descricao: 'Apenas visualização e exportação',
                codigos: todosCodigos.filter((c) =>
                    c.endsWith(':ver') || c.endsWith(':exportar') || c === 'dashboard:ver',
                ),
            },
        };

        const perfilIdPorNome = new Map<string, string>();
        for (const [nome, dados] of Object.entries(perfis)) {
            const [perfil] = await queryRunner.query(
                `INSERT INTO "perfis" ("nome", "descricao", "sistema") VALUES ($1, $2, $3) RETURNING "id"`,
                [nome, dados.descricao, dados.sistema ?? false],
            );
            perfilIdPorNome.set(nome, perfil.id);
        }

        // 3) perfil_permissoes
        for (const [nome, dados] of Object.entries(perfis)) {
            const perfilId = perfilIdPorNome.get(nome)!;
            for (const codigo of dados.codigos) {
                await queryRunner.query(
                    `INSERT INTO "perfil_permissoes" ("perfil_id", "permissao_id")
                     SELECT $1, id FROM "permissoes" WHERE "codigo" = $2`,
                    [perfilId, codigo],
                );
            }
        }

        // 4) Atribuir perfil de acesso aos utilizadores existentes por cargo
        const superAdminId = perfilIdPorNome.get('Super Admin')!;
        const gestorId = perfilIdPorNome.get('Gestor de Formações')!;
        const consultaId = perfilIdPorNome.get('Consulta')!;
        await queryRunner.query(`UPDATE "users" SET "perfil_acesso_id" = $1 WHERE "cargo" = 'admin'`, [superAdminId]);
        await queryRunner.query(`UPDATE "users" SET "perfil_acesso_id" = $1 WHERE "cargo" = 'gestor'`, [gestorId]);
        await queryRunner.query(`UPDATE "users" SET "perfil_acesso_id" = $1 WHERE "cargo" = 'utilizador'`, [consultaId]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_perfil_acesso"`);
        await queryRunner.query(`ALTER TABLE "utilizador_permissoes" DROP CONSTRAINT "FK_utilizador_permissoes_permissao"`);
        await queryRunner.query(`ALTER TABLE "utilizador_permissoes" DROP CONSTRAINT "FK_utilizador_permissoes_utilizador"`);
        await queryRunner.query(`ALTER TABLE "perfil_permissoes" DROP CONSTRAINT "FK_perfil_permissoes_permissao"`);
        await queryRunner.query(`ALTER TABLE "perfil_permissoes" DROP CONSTRAINT "FK_perfil_permissoes_perfil"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "activo"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "token_version"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "perfil_acesso_id"`);
        await queryRunner.query(`DROP TABLE "utilizador_permissoes"`);
        await queryRunner.query(`DROP TABLE "perfil_permissoes"`);
        await queryRunner.query(`DROP TABLE "perfis"`);
        await queryRunner.query(`DROP TABLE "permissoes"`);
        await queryRunner.query(`DROP TYPE "public"."utilizador_permissoes_efeito_enum"`);
    }
}
