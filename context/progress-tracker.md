# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 0 (Infrastructure) — complete. All scaffolding, tooling, Docker, CI pipeline, and Prisma schema are in place.

## Current Goal

- Phase 1 (Auth & Core Data) — Auth0 login, JWT guard, /me endpoint, and prisma migrate dev.

## Completed

- Project scaffolding exists: `/frontend` (Vite + React 19) and `/backend` (NestJS 11). Fresh, no feature code yet.
- Root `package.json` with `husky@9.1.7` (`prepare` script) + `.husky/pre-commit` hook running `npx lint-staged`.
- `frontend/Dockerfile` and `backend/Dockerfile` (node:22-alpine) — both pass `docker build --check`.
- `docker-compose.yml` — postgres:16-alpine (named volume), backend (port 3000, `DATABASE_URL`), frontend (port 5173, `VITE_API_URL`); dev mode with source volume mounts. Validated with `docker compose config`.
- `Jenkinsfile` — declarative pipeline (lint + unit tests + build for backend/frontend, frontend E2E via `cypress:run`; no Docker image build).
- Backend strict TypeScript: `strict`, `noImplicitAny`, `strictBindCallApply`, `noFallthroughCasesInSwitch` enabled in `backend/tsconfig.json`; existing scaffold code type-checks cleanly (`tsc --noEmit` passes).
- Backend dependencies: `@nestjs/config`, `prisma@7`, `@prisma/client@7`, `@prisma/adapter-pg`, `pg`, `dotenv`.
- Backend Prisma schema written (`Collection`, `Bookmark` with non-nullable `ownerId`, nullable `favicon`/`notes`, `Collection`→`Bookmark` relation) in `backend/prisma/schema.prisma`; client generated; `.env` + `.env.example` created with `DATABASE_URL`.
- `PrismaModule` (global) + `PrismaService` created in `backend/src/prisma/`, wired into `AppModule` alongside global `ConfigModule` (reads `.env`).
- `lint-staged` config added to `backend/package.json`.
- Backend verification green: `npm run lint`, `npm run build`, `npm run test`, `npm run format` all pass.
- Root `.gitignore` — `node_modules`, `dist`, `.env`, `*.log`.
- Frontend tooling scaffolded (feature-spec `01-project-scaffolding`, Phase 0.2): Prettier + `eslint-config-prettier`, `lint-staged` in `frontend/package.json`, Vitest + Testing Library + jsdom (smoke test green), Cypress 15 e2e (smoke test green, spec named `smoke.cy.ts` per Cypress 15 `*.cy.ts` default `specPattern`), `@t3-oss/env-core` + zod env validation (`src/env.ts`, `.env.example`), MUI v9 theme at `src/theme/` referencing `ui-tokens.md` CSS variables, React Router v8 layout routes (`/`, `/collections`, `/bookmarks`, `/all`), Inter/JetBrains Mono font links, Vite boilerplate (App.css, assets) removed, `src/index.css` minimal. `npm run lint` / `test` / `build` / `cypress:run` all pass.

## In Progress

- None.

## Next Up

1. `docker compose up postgres` → `prisma migrate dev` — create initial migration from the already-written schema.
2. Phase 1.1 — Auth0 frontend login (`@auth0/auth0-react`, PKCE S256).
3. Phase 1.2 — Backend JWT guard (Auth0 JWKS validation, extract `ownerId` from `sub`).
4. Phase 1.3 — `/me` endpoint.
5. Phase 2 — Collections CRUD (API + page).
6. Phase 3 — Bookmarks CRUD (API + page, URL metadata fetch).
7. Phase 4 — `/all` page.

## Open Questions

- Which unique field from the Auth0 token is used as `ownerId` — the `sub` claim directly, or a normalized version? Confirm during Phase 1.2 implementation.
- How the backend stores favicons — store the fetched favicon URL, or download bytes into the DB? Default: store the URL string on the `Bookmark.favicon` column unless testing shows otherwise.

## Architecture Decisions

- Postgres + Prisma chosen as the database + ORM (strong Prisma support, owner-scoped queries).
- Access token (not ID token) used as the backend Bearer credential — the OAuth2/OIDC-correct choice for resource server auth.
- `@auth0/auth0-react` handles the full PKCE S256 flow and token storage on the frontend; the backend stays stateless and validates via JWKS.
- Light mode only for v1 to keep scope tight.

## Resolved Questions

- Monorepo tooling: per-package scripts with a root `package.json` owning only husky. Each package has its own `lint-staged` config. No npm workspaces.
- Favicon storage: store the fetched favicon URL string on `Bookmark.favicon`. No blob storage in v1.

## Session Notes

- 2026-08-05: Init project context generated. Stack: Vite+React+MUI+React Router frontend, NestJS+Prisma+PostgreSQL backend, Auth0 OIDC PKCE.
- 2026-08-06: Phase 0 complete — all scaffolding in place. Husky pre-commit, Dockerfiles + docker-compose (dev mode), Jenkinsfile (parallel stages), backend strict TS + Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg` + `pg` driver adapter, `prisma.config.ts`) + PrismaService with retry logic and pool lifecycle, frontend vitest + Cypress 15 + MUI v9 (nativeColor CSS tokens) + React Router v8 + @t3-oss/env-core. `prisma migrate dev` deferred until Postgres is up. Review completed — 5 minor issues resolved. UI patterns imprinted to `ui-registry.md`.