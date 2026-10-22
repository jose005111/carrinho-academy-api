import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1792610550838 implements MigrationInterface {
    name = 'InitialSchema1792610550838'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "perfil" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "foto" character varying(255), "nome" character varying(150) NOT NULL, CONSTRAINT "PK_814c50101bf1675e1f691aad2c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."users_cargo_enum" AS ENUM('admin', 'gestor', 'utilizador')`);
        await queryRunner.query(`CREATE TABLE "users" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying(150) NOT NULL, "cargo" "public"."users_cargo_enum" NOT NULL DEFAULT 'utilizador', "password" character varying(255) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "perfil_id" uuid, CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "REL_8d16d3b029701db73376beff0c" UNIQUE ("perfil_id"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "empresas" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(150) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ce7b122b37c6499bfd6520873e1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "enderecos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "provincia" character varying(150) NOT NULL, "municipio" character varying(150) NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_208b05002dcdf7bfbad378dcac1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "formadores" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(150) NOT NULL, "bi" character varying(150) NOT NULL, "contacto" character varying(50), "sexo" character varying NOT NULL DEFAULT 'homem', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_17ebf9d84f28061ae69afff33e6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "formador_formacao" ("formador_id" uuid NOT NULL, "formacao_id" uuid NOT NULL, "supervisor" boolean NOT NULL DEFAULT false, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b85a6ce4a6b7e731bfea99c0d85" PRIMARY KEY ("formador_id", "formacao_id"))`);
        await queryRunner.query(`CREATE TABLE "formacoes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(150) NOT NULL, "tipo" character varying(100) NOT NULL, "formato" character varying(100) NOT NULL, "descricao" text, "nota" character varying, "carga_horaria" character varying NOT NULL, "carga_horaria_anual" integer, "local" character varying(150), "acesso_certificado" character varying(100), "inicio" TIMESTAMP, "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_90c98e25faee41bf2d95a94f780" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "formando_formacao" ("formando_id" uuid NOT NULL, "formacao_id" uuid NOT NULL, "created_at" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_ef08490eaaaa5610a160eec989c" PRIMARY KEY ("formando_id", "formacao_id"))`);
        await queryRunner.query(`CREATE TABLE "formandos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "nome" character varying(150) NOT NULL, "sexo" character varying(20) NOT NULL, "bi" character varying(30) NOT NULL, "matricula" character varying(30) NOT NULL, "funcao" character varying(150), "area_direcao" character varying(150), "tot_formacoes" integer NOT NULL DEFAULT '0', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "empresa_id" uuid NOT NULL, "endereco_id" uuid, CONSTRAINT "UQ_787ae7881facf10d7e6371bc27e" UNIQUE ("bi"), CONSTRAINT "UQ_5c5b7ac1baead85395438cf930e" UNIQUE ("matricula"), CONSTRAINT "PK_e36a4c58aea52b709d13e6c3cd2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_8d16d3b029701db73376beff0c3" FOREIGN KEY ("perfil_id") REFERENCES "perfil"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "formador_formacao" ADD CONSTRAINT "FK_7b825abf56b4a41d9d263959e11" FOREIGN KEY ("formador_id") REFERENCES "formadores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "formador_formacao" ADD CONSTRAINT "FK_70169af315c8468dbc16d767484" FOREIGN KEY ("formacao_id") REFERENCES "formacoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "formando_formacao" ADD CONSTRAINT "FK_e676323f350ffb7f480e5be793d" FOREIGN KEY ("formando_id") REFERENCES "formandos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "formando_formacao" ADD CONSTRAINT "FK_7fe778561a670e7cb34a7331c27" FOREIGN KEY ("formacao_id") REFERENCES "formacoes"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "formandos" ADD CONSTRAINT "FK_ab17ffa351fe9b7a2acfc52fdef" FOREIGN KEY ("empresa_id") REFERENCES "empresas"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "formandos" ADD CONSTRAINT "FK_153f4c8e337fe4a7821b981740f" FOREIGN KEY ("endereco_id") REFERENCES "enderecos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "formandos" DROP CONSTRAINT "FK_153f4c8e337fe4a7821b981740f"`);
        await queryRunner.query(`ALTER TABLE "formandos" DROP CONSTRAINT "FK_ab17ffa351fe9b7a2acfc52fdef"`);
        await queryRunner.query(`ALTER TABLE "formando_formacao" DROP CONSTRAINT "FK_7fe778561a670e7cb34a7331c27"`);
        await queryRunner.query(`ALTER TABLE "formando_formacao" DROP CONSTRAINT "FK_e676323f350ffb7f480e5be793d"`);
        await queryRunner.query(`ALTER TABLE "formador_formacao" DROP CONSTRAINT "FK_70169af315c8468dbc16d767484"`);
        await queryRunner.query(`ALTER TABLE "formador_formacao" DROP CONSTRAINT "FK_7b825abf56b4a41d9d263959e11"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_8d16d3b029701db73376beff0c3"`);
        await queryRunner.query(`DROP TABLE "formandos"`);
        await queryRunner.query(`DROP TABLE "formando_formacao"`);
        await queryRunner.query(`DROP TABLE "formacoes"`);
        await queryRunner.query(`DROP TABLE "formador_formacao"`);
        await queryRunner.query(`DROP TABLE "formadores"`);
        await queryRunner.query(`DROP TABLE "enderecos"`);
        await queryRunner.query(`DROP TABLE "empresas"`);
        await queryRunner.query(`DROP TABLE "users"`);
        await queryRunner.query(`DROP TYPE "public"."users_cargo_enum"`);
        await queryRunner.query(`DROP TABLE "perfil"`);
    }

}
