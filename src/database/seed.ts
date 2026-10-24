import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import { AppDataSource } from './data-source';
import { Cargo } from '../common/enums/cargo.enum';
import { Genero } from '../common/enums/genero.enum';
import { User } from '../users/entities/user.entity';
import { Perfil } from '../perfil/entities/perfil.entity';
import { Empresa } from '../empresas/entities/empresa.entity';
import { Endereco } from '../endereco/entities/endereco.entity';
import { Formando } from '../formandos/entities/formando.entity';
import { Formador } from '../formadores/entities/formador.entity';
import { Formacao } from '../formacoes/entities/formacao.entity';
import { FormandoFormacao } from '../formando-formacao/entities/formando-formacao.entity';
import { FormadorFormacao } from '../formador-formacao/entities/formador-formacao.entity';
import { PerfilAcesso } from '../perfis/entities/perfil-acesso.entity';
import { Turma } from '../turmas/entities/turma.entity';
import { Inscricao } from '../inscricoes/entities/inscricao.entity';
import { InscricaoEstado } from '../inscricoes/enums/inscricao-estado.enum';
import { InscricaoOrigem } from '../inscricoes/enums/inscricao-origem.enum';
import { TurmaEstado } from '../turmas/enums/turma-estado.enum';
import { Tipo } from '../catalogos/entities/tipo.entity';
import { Formato } from '../catalogos/entities/formato.entity';
import { Funcao } from '../catalogos/entities/funcao.entity';
import { Area } from '../catalogos/entities/area.entity';

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
    const turmaRepo = queryRunner.manager.getRepository(Turma);
    const inscricaoRepo = queryRunner.manager.getRepository(Inscricao);
    const tipoRepo = queryRunner.manager.getRepository(Tipo);
    const formatoRepo = queryRunner.manager.getRepository(Formato);
    const funcaoRepo = queryRunner.manager.getRepository(Funcao);
    const areaRepo = queryRunner.manager.getRepository(Area);

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
    const utilizador = await userRepo.save(
      userRepo.create({
        id: '33333333-3333-4333-8333-333333333333',
        email: 'utilizador@academy.ao',
        password: await bcrypt.hash('user123', 10),
        cargo: Cargo.UTILIZADOR,
        perfil: { nome: 'Utilizador Comum', foto: null },
      }),
    );

    // Associa o perfil de acesso (RBAC) correspondente a cada cargo
    const perfilAcessoRepo = queryRunner.manager.getRepository(PerfilAcesso);
    const perfisAcesso = await perfilAcessoRepo.find();
    const porNome = new Map(perfisAcesso.map((p) => [p.nome, p.id]));
    admin.perfilAcessoId = porNome.get('Super Admin') ?? null;
    gestor.perfilAcessoId = porNome.get('Gestor de Formações') ?? null;
    utilizador.perfilAcessoId = porNome.get('Consulta') ?? null;
    await userRepo.save([admin, gestor, utilizador]);

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
    const funcaoOperacoes = await funcaoRepo.save(
      funcaoRepo.create({ nome: 'Tecnico de Operacoes' }),
    );
    const funcaoEngenharia = await funcaoRepo.save(
      funcaoRepo.create({ nome: 'Engenheira' }),
    );
    const funcaoManutencao = await funcaoRepo.save(
      funcaoRepo.create({ nome: 'Supervisor de Manutencao' }),
    );
    const areaOperacoes = await areaRepo.save(
      areaRepo.create({ nome: 'Direccao de Operacoes' }),
    );
    const areaTecnica = await areaRepo.save(
      areaRepo.create({ nome: 'Direccao Tecnica' }),
    );
    const areaManutencao = await areaRepo.save(
      areaRepo.create({ nome: 'Direccao de Manutencao' }),
    );

    const jose = await formandoRepo.save(
      formandoRepo.create({
        id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc1',
        nome: 'Jose Silva',
        sexo: 'Masculino',
        genero: Genero.M,
        bi: '001234567LA041',
        matricula: 'F0001',
        funcaoId: funcaoOperacoes.id,
        areaId: areaOperacoes.id,
        totFormacoes: 1,
        empresa: sonangol,
        endereco: luanda,
      }),
    );
    const maria = await formandoRepo.save(
      formandoRepo.create({
        id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc2',
        nome: 'Maria Domingos',
        sexo: 'Feminino',
        genero: Genero.F,
        bi: '002345678LA042',
        matricula: 'F0002',
        funcaoId: funcaoEngenharia.id,
        areaId: areaTecnica.id,
        totFormacoes: 1,
        empresa: endiama,
        endereco: benguela,
      }),
    );
    const paulo = await formandoRepo.save(
      formandoRepo.create({
        id: 'cccccccc-cccc-4ccc-8ccc-ccccccccccc3',
        nome: 'Paulo Kiala',
        sexo: 'Masculino',
        genero: Genero.M,
        bi: '003456789LA043',
        matricula: 'F0003',
        funcaoId: funcaoManutencao.id,
        areaId: areaManutencao.id,
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
        sexo: 'Masculino',
      }),
    );
    const ana = await formadorRepo.save(
      formadorRepo.create({
        id: 'dddddddd-dddd-4ddd-8ddd-ddddddddddd2',
        nome: 'Dra. Ana Lopes',
        bi: '100000002LA042',
        contacto: '+244 923 000 002',
        sexo: 'Feminino',
      }),
    );

    // -------------------------------------------------------------- formacoes
    const seguranca = await formacaoRepo.save(
      formacaoRepo.create({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
        nome: 'Seguranca no Trabalho',
        descricao: 'Normas e boas praticas de seguranca no ambiente laboral.',
        carga_horaria: 40,
      }),
    );
    const gestaoProjetos = await formacaoRepo.save(
      formacaoRepo.create({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee2',
        nome: 'Gestao de Projectos',
        descricao: 'Metodologias ageis e tradicionais de gestao de projectos.',
        carga_horaria: 60,
      }),
    );
    const primeirosSocorros = await formacaoRepo.save(
      formacaoRepo.create({
        id: 'eeeeeeee-eeee-4eee-8eee-eeeeeeeeeee3',
        nome: 'Primeiros Socorros',
        descricao: 'Tecnicas basicas de primeiros socorros.',
        carga_horaria: 20,
      }),
    );

    // ------------------------------------------------- turmas + inscricoes (N:M)
    const tipos = await tipoRepo.find();
    const formatos = await formatoRepo.find();
    const tipoCurso = tipos.find((t) => t.nome.toLowerCase() === 'curso') ?? tipos[0];
    const formatoPresencial =
      formatos.find((f) => f.nome.toLowerCase() === 'presencial') ?? formatos[0];

    const turmaSeguranca = await turmaRepo.save(
      turmaRepo.create({
        formacaoId: seguranca.id,
        tipoId: tipoCurso?.id ?? null,
        formatoId: formatoPresencial?.id ?? null,
        acessoCertificado: 'sim',
        cargaDiaria: 8,
        local: 'Luanda',
        ano: 2026,
        dataInicio: new Date('2026-03-02T08:00:00'),
        dataFim: new Date('2026-03-06T17:00:00'),
        lotacao: 20,
        estado: TurmaEstado.EM_CURSO,
        codigo: 'TRM-2026-0001',
      }),
    );
    const turmaGestao = await turmaRepo.save(
      turmaRepo.create({
        formacaoId: gestaoProjetos.id,
        tipoId: tipoCurso?.id ?? null,
        formatoId:
          formatos.find((f) => f.nome.toLowerCase() === 'online')?.id ?? null,
        acessoCertificado: 'nao',
        cargaDiaria: 4,
        local: null,
        ano: 2026,
        dataInicio: new Date('2026-04-01T09:00:00'),
        dataFim: null,
        lotacao: 15,
        estado: TurmaEstado.PENDENTE,
        codigo: 'TRM-2026-0002',
      }),
    );
    const turmaSocorros = await turmaRepo.save(
      turmaRepo.create({
        formacaoId: primeirosSocorros.id,
        tipoId: tipoCurso?.id ?? null,
        formatoId: formatoPresencial?.id ?? null,
        acessoCertificado: 'sim',
        cargaDiaria: 4,
        local: 'Lubango',
        ano: 2026,
        dataInicio: new Date('2026-05-04T08:00:00'),
        dataFim: new Date('2026-05-05T17:00:00'),
        lotacao: 25,
        estado: TurmaEstado.ENCERRADO,
        codigo: 'TRM-2026-0003',
      }),
    );

    await inscricaoRepo.save([
      inscricaoRepo.create({
        turmaId: turmaSeguranca.id,
        associadoId: jose.id,
        estado: InscricaoEstado.INSCRITO,
        origem: InscricaoOrigem.MANUAL,
      }),
      inscricaoRepo.create({
        turmaId: turmaGestao.id,
        associadoId: maria.id,
        estado: InscricaoEstado.INSCRITO,
        origem: InscricaoOrigem.MANUAL,
      }),
      inscricaoRepo.create({
        turmaId: turmaSocorros.id,
        associadoId: paulo.id,
        estado: InscricaoEstado.CONCLUIDO,
        origem: InscricaoOrigem.RETROATIVA,
        dataConclusao: new Date('2026-05-05T17:00:00'),
      }),
    ]);

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
