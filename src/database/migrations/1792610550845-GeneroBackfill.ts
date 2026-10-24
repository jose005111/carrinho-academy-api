import { MigrationInterface, QueryRunner } from "typeorm";

export class GeneroBackfill1792610550845 implements MigrationInterface {
    name = 'GeneroBackfill1792610550845'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Preenche o genero (enum M/F/OUTRO) a partir do sexo existente
        await queryRunner.query(`
            UPDATE "formandos" SET "genero" = (CASE
                WHEN lower("sexo") IN ('homem', 'masculino', 'm') THEN 'M'
                WHEN lower("sexo") IN ('mulher', 'feminino', 'f') THEN 'F'
                ELSE 'OUTRO' END)::"formandos_genero_enum"
            WHERE "genero" IS NULL
        `);

        // Normaliza o sexo para "Masculino"/"Feminino" (em vez de homem/mulher)
        await queryRunner.query(`
            UPDATE "formandos" SET "sexo" = CASE
                WHEN lower("sexo") IN ('homem', 'masculino', 'm') THEN 'Masculino'
                WHEN lower("sexo") IN ('mulher', 'feminino', 'f') THEN 'Feminino'
                ELSE "sexo" END
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`UPDATE "formandos" SET "genero" = NULL`);
    }
}
