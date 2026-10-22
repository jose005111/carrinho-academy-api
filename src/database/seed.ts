import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { Cargo } from '../common/enums/cargo.enum';
import { User } from '../users/entities/user.entity';
import { Perfil } from '../perfil/entities/perfil.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Endereco } from '../endereco/entities/endereco.entity';
import { Formando } from '../formandos/entities/formando.entity';
import { Formador } from '../formadores/entities/formador.entity';
import { Formacao } from '../formacoes/entities/formacao.entity';
import { FormandoFormacao } from '../formando-formacao/entities/formando-formacao.entity';
import { FormadorFormacao } from '../formador-formacao/entities/formador-formacao.entity';

async function seed() {
  await AppDataSource.initialize();

  const queryRunner = AppDataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  try {
    const userRepo = queryRunner.manager.getRepository(User);
    const totalUsuarios = await userRepo.count();
    if (totalUsuarios > 0) {
      console.log('Base de dados ja possui dados. Seed ignorado.');
      await queryRunner.rollbackTransaction();
      return;
    }
    const empresaRepo = queryRunner.manager.getRepository(Empresa);
    const enderecoRepo = queryRunner.manager.getRepository(Endereco);
    const formandoRepo = queryRunner.manager.getRepository(Formando);
    const formadorRepo = queryRunner.manager.getRepository(Formador);
    const formacaoRepo = queryRunner.manager.getRepository(Formacao);
    const formandoFormacaoRepo =
      queryRunner.manager.getRepository(FormandoFormacao);
    const formadorFormacaoRepo =
      queryRunner.manager.getRepository(FormadorFormacao);

    // ---------------------------------------------------------------- usuarios
    const admin = await userRepo.save(
      userRepo.create({
        id: '11111111-1111-4111-8111-111111111111',
        email: 'admin@academy.ao',
        password: await bcrypt.hash('admin123', 10),
        cargo: Cargo.ADMIN,
        perfil: { nome: 'Administrador', foto: null },
      }),
    );
    const gestor = await userRepo.save(
      userRepo.create({
        id: '22222222-2222-4222-8222-222222222222',
        email: 'gestor@academy.ao',
        password: await bcrypt.hash('gestor123', 10),
        cargo: Cargo.GESTOR,
        perfil: { nome: 'Gestor de Formacao', foto: null },
      }),
    );
    await userRepo.save(
      userRepo.create({
        id: '33333333-3333-4333-8333-333333333333',
        email: 'utilizador@academy.ao',
        password: await bcrypt.hash('user123', 10),
        cargo: Cargo.UTILIZADOR,
        perfil: { nome: 'Utilizador Comum', foto: null },
      }),
    );

    // --------------------------------------------------------------- empresas
    const sonangol = await empresaRepo.save(
      empresaRepo.create({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
        nome: 'Sonangol E.P.',
      }),
    );
    const endiama = await empresaRepo.save(
      empresaRepo.create({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
        nome: 'Endiama E.P.',
      }),
    );
    const taag = await empresaRepo.save(
      empresaRepo.create({
        id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa3',
        nome: 'TAAG Linhas Aereas de Angola',
      }),
    );

    // -------------------------------------------------------------- enderecos
    const luanda = await enderecoRepo.save(
      enderecoRepo.create({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
        provincia: 'Luanda',
        municipio: 'Luanda',
      }),
    );
    const benguela = await enderecoRepo.save(
      enderecoRepo.create({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
        provincia: 'Benguela',
        municipio: 'Benguela',
      }),
    );
    const lubango = await enderecoRepo.save(
      enderecoRepo.create({
        id: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb3',
        provincia: 'Huila',
        municipio: 'Lubango',
      }),
    );

    // -------------------------------------------------------------- formandos
    const jose = await formandoRepo.save(
      formandoRepo.create({
        id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
        nome: 'Jose Silva',
        sexo: 'homem',
        bi: '001234567LA041',
        matricula: 'F0001',
        funcao: 'Tecnico de Operacoes',
        areaDirecao: 'Direccao de Operacoes',
        totFormacoes: 1,
        empresa: sonangol,
        endereco: luanda,
      }),
    );
    const maria = await formandoRepo.save(
      formandoRepo.create({
        id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
        nome: 'Maria Domingos',
        sexo: 'mulher',
        bi: '002345678LA042',
        matricula: 'F0002',
        funcao: 'Engenheira',
        areaDirecao: 'Direccao Tecnica',
        totFormacoes: 1,
        empresa: endiama,
        endereco: benguela,
      }),
    );
    const paulo = await formandoRepo.save(
      formandoRepo.create({
        id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
        nome: 'Paulo Kiala',
        sexo: 'homem',
        bi: '003456789LA043',
        matricula: 'F0003',
        funcao: 'Supervisor de Manutencao',
        areaDirecao: 'Direccao de Manutencao',
        totFormacoes: 1,
        empresa: taag,
        endereco: lubango,
      }),
    );

    // -------------------------------------------------------------- formadores
    const carlos = await formadorRepo.save(
      formadorRepo.create({
        id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd1',
        nome: 'Eng. Carlos Neto',
        bi: '100000001LA041',
        contacto: '+244 923 000 001',
        sexo: 'homem',
      }),
    );
    const ana = await formadorRepo.save(
      formadorRepo.create({
        id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
        nome: 'Dra. Ana Lopes',
        bi: '100000002LA042',
        contacto: '+244 923 000 002',
        sexo: 'mulher',
      }),
    );

    // -------------------------------------------------------------- formacoes
    const seguranca = await formacaoRepo.save(
      formacaoRepo.create({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
        nome: 'Seguranca no Trabalho',
        tipo: 'Tecnica',
        formato: 'Presencial',
        descricao: 'Normas e boas praticas de seguranca no ambiente laboral.',
        carga_horaria: '08:00',
        carga_horaria_anual: 40,
        local: 'Luanda',
        acesso_certificado: 'sim',
        inicio: new Date('2026-03-02T08:00:00'),
      }),
    );
    const gestaoProjetos = await formacaoRepo.save(
      formacaoRepo.create({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
        nome: 'Gestao de Projectos',
        tipo: 'Gestao',
        formato: 'Online',
        descricao: 'Metodologias ageis e tradicionais de gestao de projectos.',
        carga_horaria: '12:00',
        carga_horaria_anual: 60,
        acesso_certificado: 'nao',
        inicio: new Date('2026-04-01T09:00:00'),
      }),
    );
    const primeirosSocorros = await formacaoRepo.save(
      formacaoRepo.create({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
        nome: 'Primeiros Socorros',
        tipo: 'Saude',
        formato: 'Presencial',
        descricao: 'Tecnicas basicas de primeiros socorros.',
        carga_horaria: '04:00',
        carga_horaria_anual: 20,
        local: 'Lubango',
        acesso_certificado: 'sim',
        inicio: new Date('2026-05-04T08:00:00'),
      }),
    );

    // -------------------------------------------- formando <-> formacao (N:M)
    await formandoFormacaoRepo.save([
      formandoFormacaoRepo.create({
        formandoId: jose.id,
        formacaoId: seguranca.id,
      }),
      formandoFormacaoRepo.create({
        formandoId: maria.id,
        formacaoId: gestaoProjetos.id,
      }),
      formandoFormacaoRepo.create({
        formandoId: paulo.id,
        formacaoId: primeirosSocorros.id,
      }),
    ]);

    // -------------------------------------------- formador <-> formacao (N:M)
    await formadorFormacaoRepo.save([
      formadorFormacaoRepo.create({
        formadorId: carlos.id,
        formacaoId: seguranca.id,
        supervisor: true,
      }),
      formadorFormacaoRepo.create({
        formadorId: ana.id,
        formacaoId: gestaoProjetos.id,
        supervisor: true,
      }),
    ]);

    await queryRunner.commitTransaction();

    console.log('Seed concluido com sucesso!');
    console.log('Usuarios criados:');
    console.log('  admin@academy.ao / admin123 (admin)');
    console.log('  gestor@academy.ao / gestor123 (gestor)');
    console.log('  utilizador@academy.ao / user123 (utilizador)');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Erro ao executar o seed:', error);
    process.exitCode = 1;
  } finally {
    await queryRunner.release();
    await AppDataSource.destroy();
  }
}

seed();
