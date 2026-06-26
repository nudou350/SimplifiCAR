# SimplifiCAR — Backend (NestJS)

API REST (porta **3012**) que faz **lookup** de dados pré-calculados no PostGIS.
Geo pesado roda offline no pipeline; aqui só se lê. Contrato autoritativo:
`docs/07_contrato_mvp.md`.

## Run

```bash
cd backend
npm install
npm run start:dev        # dev com watch — http://localhost:3012
# ou
npm run build && npm run start:prod
```

Config via `.env` (defaults já no `.env.example`):

```
DATABASE_URL=postgresql://hacarthon_user:hacarthon_pass@localhost:5433/hacarthon
PORT=3012
CORS_ORIGIN=http://localhost:4200
```

O banco (PostGIS na 5433) é provisionado pelo time de DB (`db/docker-compose.yml`,
`db/schema.sql`, seed). A API sobe mesmo sem banco; endpoints que dependem do DB
respondem 404 quando o registro não existe.

## Endpoints (contrato §4)

| Método | Rota | Fase |
|---|---|---|
| POST | `/auth/govbr/mock` | BASE (sem DB) |
| GET | `/propriedades/:codImovel` | BASE |
| GET | `/diagnosticos/:propriedadeId` | BASE |
| GET | `/marketplace/ofertas?tipo=&bioma=` | CEREJA |
| POST | `/marketplace/ofertas` | CEREJA |
| POST | `/marketplace/match` | CEREJA |
| POST | `/propriedades/upload` (multipart `file` = `.RET`) | CEREJA |
| POST | `/diagnosticos/:id/retificacao` | CEREJA |

## Arquitetura

- `database/` — `DatabaseService` (pool `pg` + `withTransaction`); SQL puro parametrizado.
- `auth/` — `AuthModule` com `IdentityProvider` (interface) + `MockGovBrProvider`,
  injetado pelo token `IDENTITY_PROVIDER` (trocar por OIDC sem mexer nos callers).
- `propriedades/` — Consulta Rápida + upload `.RET` (`ret-parser.ts`, via `adm-zip`).
- `diagnosticos/` — leitura + minuta de retificação (texto templated dos números, sem LLM).
- `marketplace/` — ofertas + match.
- `common/mappers.ts` — snake_case→camelCase, `tipo` canônico do geo (§5), fórmula do score (§6).
