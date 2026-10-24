# Carrinho Academy — API

API de gestão de associados, formações, turmas e formandos. Construída com NestJS, JWT, TypeORM e PostgreSQL (Neon).

## Modelo

- `users`: id, email, cargo, password, `perfil_id`, `perfil_acesso_id` (RBAC), `token_version`, `activo`
- `perfil`: id, foto, nome (dados de exibição do utilizador — nome/foto)
- `empresas`, `enderecos`, `formandos`, `formadores`, `formacoes`, `formando_formacao`, `formador_formacao`
- `turmas`: id, formacao_id, ano, data_inicio, data_fim, lotacao, cancelada, codigo
- `inscricoes`: turma_id, associado_id, estado, origem, data_inscricao, data_conclusao
- `configuracoes`: chave/valor tipados + auditoria
- RBAC: `permissoes`, `perfis`, `perfil_permissoes`, `utilizador_permissoes`
- `auditoria`: registo de acções sensíveis

## Variáveis de ambiente

| Variável        | Descrição                                          | Exemplo                                |
| --------------- | -------------------------------------------------- | -------------------------------------- |
| `APP_PORT`      | Porta da API                                       | `3000`                                 |
| `NODE_ENV`      | Ambiente (`development`/`production`)              | `development`                          |
| `DB_HOST`       | Host do PostgreSQL                                 | `ep-...neon.tech`                      |
| `DB_PORT`       | Porta do PostgreSQL                                | `5432`                                 |
| `DB_USERNAME`   | Utilizador da base de dados                        | `neondb_owner`                         |
| `DB_PASSWORD`   | Password da base de dados                          | `****`                                 |
| `DB_DATABASE`   | Nome da base de dados                              | `carrinho_db`                          |
| `DB_SSL`        | `true` quando o provider exige TLS (Neon)          | `true`                                 |
| `JWT_SECRET`    | Segredo para assinar tokens JWT                    | `****`                                 |
| `JWT_EXPIRES_IN`| Validade do token                                  | `1d`                                   |

## Como rodar

1. Copie o `.env.example` para `.env` e preencha.
2. Instale dependências e aplique migrações + seed:

```bash
npm install
npm run migration:run   # cria o schema (migrations em src/database/migrations)
npm run seed            # dados iniciais (admin, empresas, formações, ...)
```

3. Arranque a API:

```bash
npm run start:dev
```

## Migrações e Seed

O schema é gerido por migrations do TypeORM (`synchronize` desligado):

```bash
npm run migration:generate -- src/database/migrations/Nome   # gera a partir das entities
npm run migration:run       # aplica as migrations pendentes
npm run migration:revert    # reverte a última migration
npm run migration:show      # lista o status das migrations
npm run seed                # popula a base (ignorado se já tiver dados)
```

Migrations existentes:
- `InitialSchema…` — schema base
- `Configuracoes…` — tabela `configuracoes` + seed
- `TurmasInscricoes…` — turmas, inscrições, género e migração dos dados de `formando_formacao`
- `Rbac…` — permissões, perfis, relações e atribuição de perfis por cargo

## Testes

```bash
npm test          # testes unitários (lógica de permissões e de candidatos)
npm run test:e2e  # testes e2e (requer base de dados + migrations + seed)
```

## RBAC (permissões)

- Catálogo de permissões definido em código (`src/permissoes/permissoes.catalogo.ts`), sincronizado para a BD no arranque.
- Permissões efectivas = (perfil ∪ ALLOW activos) − DENY activos; **DENY prevalece**; Super Admin ignora a verificação.
- `@RequirePermissions('modulo:accao')` + `PermissionsGuard` (aplicado a seguir ao `JwtAuthGuard`).
- Endpoints principais: `/perfis`, `/permissoes`, `/utilizadores`, `/auditoria`.

## Endpoints principais

- `POST /auth/register`, `POST /auth/login`, `GET /auth/me` (devolve utilizador + permissões efectivas)
- `GET/PATCH /configuracoes`, `GET /configuracoes/publicas`
- `GET/POST/PATCH /turmas`, `GET /turmas/:id/candidatos`, `POST /turmas/:id/inscricoes/bulk`
- `GET/POST/PATCH/DELETE /perfis`, `PUT /perfis/:id/permissoes`, `GET /permissoes`
- `GET/POST/PATCH /utilizadores`, `PATCH /utilizadores/:id/ativar|desativar`, `POST /utilizadores/:id/reset-password`, `GET/PUT /utilizadores/:id/permissoes-extra`
- `GET /auditoria`

## Notas

- `password` nunca aparece nas respostas (`@Exclude` + `ClassSerializerInterceptor`).
- O frontend espera `baseURL` em `VITE_API_URL` (ex: `http://localhost:3000/api`).
