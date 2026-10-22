# Nest Auth App

API de autenticacao construida com NestJS, JWT, TypeORM e PostgreSQL (via Docker).

## Modelo (baseado no diagrama)

- `users`: id, email, cargo, password
- `perfil`: id, foto, nome
- Relacao 1:1 obrigatoria entre `users` e `perfil` (cada user tem exatamente um perfil)

## Como rodar

1. Copie o `.env.example` para `.env` (ja incluido neste pacote) e ajuste se necessario.
2. Suba os containers:

```bash
docker compose up --build
```

Isto sobe dois servicos:
- `db`: PostgreSQL 16 na porta 5432
- `api`: API Nest na porta 3000, com hot-reload (`npm run start:dev`)

## Endpoints

### POST /auth/register
Cria o utilizador e o perfil associado numa unica chamada.

```json
{
  "email": "jose@example.com",
  "password": "senha123",
  "cargo": "utilizador",
  "perfil": {
    "nome": "Jose Silva",
    "foto": "https://.../foto.png"
  }
}
```

Retorna `access_token` + dados do utilizador.

### POST /auth/login
```json
{
  "email": "jose@example.com",
  "password": "senha123"
}
```

### GET /auth/me
Requer header `Authorization: Bearer <token>`. Retorna o utilizador autenticado.

### GET /users, GET /users/:id
Protegidas por JWT.

### GET /perfil/:id, PATCH /perfil/:id
Protegidas por JWT.

## Migrations

O schema e gerido por migrations do TypeORM (`synchronize` esta desligado). Comandos:

```bash
npm run migration:generate -- src/database/migrations/NomeDaMigracao  # gera a partir das entities
npm run migration:run       # aplica as migrations pendentes
npm run migration:revert    # reverte a ultima migration
npm run migration:show      # lista o status das migrations
```

## Notas

- O schema e criado via migrations (ver secao acima), nao mais por `synchronize`.
- `password` nunca aparece nas respostas (`@Exclude` + `ClassSerializerInterceptor`).
- Existe tambem `RolesGuard` + `@Roles(...)` prontos em `src/common` para restringir rotas por `cargo`, caso precise no futuro.
