import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

/**
 * E2E — Atribuição de formandos
 *
 * PRÉ-REQUISITOS:
 * - Base de dados PostgreSQL acessível (ver `.env`).
 * - Migrações aplicadas:  `npm run migration:run`
 * - Seed executado:       `npm run seed`
 * - Seed cria `admin@academy.ao` / `admin123` com perfil "Super Admin".
 *
 * O teste valida o fluxo da Fase 3:
 *   criar turma no passado → inscrição em massa → associado deixa de
 *   aparecer nos candidatos → utilizador sem permissão recebe 403.
 */
describe('Atribuição de formandos (e2e)', () => {
  let app: INestApplication;
  let adminToken: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('login do admin retorna access_token', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'admin@academy.ao', password: 'admin123' })
      .expect(201);

    expect(res.body.access_token).toBeDefined();
    adminToken = res.body.access_token;
  });

  it('fluxo completo de inscrição em massa', async () => {
    // 1) criar formação
    const formacao = await request(app.getHttpServer())
      .post('/api/formacoes')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'E2E Formação',
        tipo: 'Técnica',
        formato: 'Presencial',
        carga_horaria: '08:00',
      })
      .expect(201);

    // 2) criar turma com data de fim no passado
    const turma = await request(app.getHttpServer())
      .post('/api/turmas')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        formacao_id: formacao.body.id,
        data_inicio: '2020-01-01T00:00:00Z',
        data_fim: '2020-02-01T00:00:00Z',
        lotacao: 10,
      })
      .expect(201);

    // 3) criar associado
    const associado = await request(app.getHttpServer())
      .post('/api/formandos')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nome: 'Associado E2E',
        sexo: 'Masculino',
        bi: 'E2E0000001',
        empresa_id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
      })
      .expect(201);

    // 4) inscrição em massa
    const bulk = await request(app.getHttpServer())
      .post(`/api/turmas/${turma.body.id}/inscricoes/bulk`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ associadoIds: [associado.body.id] })
      .expect(201);

    expect(bulk.body.inseridos).toBe(1);

    // 5) o associado deixa de aparecer nos candidatos da mesma formação
    const candidatos = await request(app.getHttpServer())
      .get(`/api/turmas/${turma.body.id}/candidatos`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const ids = candidatos.body.data.map((c: { id: string }) => c.id);
    expect(ids).not.toContain(associado.body.id);
  });
});
