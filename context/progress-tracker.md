# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Phase 1 (Auth & Core Data) — Phases 1.1–1.3 complete (Auth0 frontend login, backend JWT guard, `/me` endpoint). Next: prisma migrate dev + Phase 2 (Collections CRUD).

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
- Phase 1.1 complete (feature-spec `02-auth-frontend`): `@auth0/auth0-react@2.23.0` installed; `src/auth/Auth0Provider.tsx` (PKCE, refresh tokens, localstorage cache, `onRedirectCallback` navigates to `appState.returnTo || /profile`); `src/auth/useAuthenticatedUser.ts` hook; `LoginButton` / `LogoutButton` / `AuthGuard` components (test-first via `vi.mock('@auth0/auth0-react')`); `src/pages/ProfilePage.tsx` (AuthGuard-wrapped, shows name/email/avatar + truncated access token); `/profile` route added; `src/auth/index.ts` barrel. 12 unit tests green, `npm run build` + `npm run lint` green. Note: `Auth0Provider` is mounted inside the router (root layout route element in `router.tsx`) — not wrapping `RouterProvider` in `main.tsx` — because its `onRedirectCallback` uses `useNavigate`, which react-router throws on outside Router context. `main.tsx` unchanged.
- Phase 1.2 complete (feature-spec `02-authentication`): backend JWT guard. `@nestjs/passport` + `passport` + `passport-jwt@4` + `jwks-rsa@4` + `@types/passport-jwt` installed. `src/auth/` added: `JwtStrategy` (extends `PassportStrategy(Strategy)`, reads `AUTH0_DOMAIN`/`AUTH0_AUDIENCE` via ConfigService — throws at construction if missing; validates RS256 signature against the tenant JWKS via `jwksRsa.passportJwtSecret({cache, rateLimit, jwksUri: https://<domain>/.well-known/jwks.json})`; verifies `iss` = `https://<domain>/` and `aud` = `AUTH0_AUDIENCE`; `validate(payload)` returns `{ sub: payload.sub }` as `req.user`), `JwtAuthGuard` (extends `AuthGuard('jwt')` — applied per-route with `@UseGuards`, NOT global; only `/health` is unauthenticated), `AuthModule` (imports `PassportModule.register({defaultStrategy: 'jwt'})`, provides/exports `JwtStrategy`). `AppController` now exposes `GET /health` → `{ status: 'ok' }`; the scaffold `GET /` `getHello()` and `AppService` were removed. `.env.example` gained `AUTH0_DOMAIN=` and `AUTH0_AUDIENCE=`. Tests: `src/auth/jwt.strategy.spec.ts` (6 tests) — mocks `jwks-rsa` with a fixed RSA keypair and asserts RS256-signed tokens pass with correct iss/aud, fail with 401 on wrong iss/aud, 401 with no token, `sub` extraction, and JWKS URI/cache wiring. Backend verification green: `npm run test` (9 tests), `npm run build`, `npm run lint`, `npx tsc --noEmit`.
- Phase 1.3 complete (feature-spec `02-authentication`): `/me` endpoint. `src/users/` added: `UsersController` (`@Controller('me')`, `@UseGuards(JwtAuthGuard)`, `GET` returns `req.user` = `{ sub }` from the validated token) and `UsersModule`. Wired into `AppModule`. Tests: `src/users/users.controller.spec.ts` (2 tests) — `GET /me` returns 200 `{ sub }` with a valid Bearer token and 401 without one (full strategy + guard + supertest). e2e updated: `test/app.e2e-spec.ts` now boots `AppModule` (with `process.env.AUTH0_*` seeded and `jwks-rsa` mocked) and asserts `GET /health` → `{ status: 'ok' }`; `test/jest-e2e.json` gained a `moduleNameMapper` (maps generated Prisma client's `.js` imports to `.ts`) + `testTimeout: 30000`, and `package.json` `test:e2e` now runs via `node --experimental-vm-modules` (required by Prisma 7's WASM query-compiler dynamic import under jest). `npm run test:e2e` green.
- Global error system (review follow-up): `src/error/` added — `ErrorContext.tsx` (provider with `error`/`showError`/`clearError` state), `useError.ts` (context hook with guard), `ErrorSnackbar.tsx` (MUI `Snackbar` + `Alert` severity="error" variant="filled", auto-hides after 8s, bottom-center), `index.ts` barrel. Wired into `router.tsx` root layout (wraps `<App />` and renders `<ErrorSnackbar />` inside `<ErrorProvider>`). `useAuthenticatedUser` updated to call `showError()` on token fetch failure instead of silently logging. Tests: `ErrorContext.spec.tsx` (4 tests — null start, show, clear, provider guard throw) + `ErrorSnackbar.spec.tsx` (4 tests — renders message, close button, nothing when null, clearError on close). All 20 frontend tests pass, build + lint green.

## In Progress

- None.

## Next Up

1. `docker compose up postgres` → `prisma migrate dev` — create initial migration from the already-written schema.
2. Phase 2 — Collections CRUD (API + page).
3. Phase 3 — Bookmarks CRUD (API + page, URL metadata fetch).
4. Phase 4 — `/all` page.

## Open Questions

- How the backend stores favicons — store the fetched favicon URL, or download bytes into the DB? Default: store the URL string on the `Bookmark.favicon` column unless testing shows otherwise.
- `/me` endpoint currently returns only `{ sub }` — access tokens don't carry `name`/`email`/`picture`. If future phases need richer user data from `/me` (preferences, stats), we'll need either an Auth0 Management API call or a `User` table. Flagged for Phase 2 planning.

## Architecture Decisions

- Postgres + Prisma chosen as the database + ORM (strong Prisma support, owner-scoped queries).
- Access token (not ID token) used as the backend Bearer credential — the OAuth2/OIDC-correct choice for resource server auth.
- `@auth0/auth0-react` handles the full PKCE S256 flow and token storage on the frontend; the backend stays stateless and validates via JWKS.
- Light mode only for v1 to keep scope tight.

## Resolved Questions

- Monorepo tooling: per-package scripts with a root `package.json` owning only husky. Each package has its own `lint-staged` config. No npm workspaces.
- Favicon storage: store the fetched favicon URL string on `Bookmark.favicon`. No blob storage in v1.
- `ownerId` is the raw `sub` claim from the validated JWT — no normalization. Confirmed in Phase 1.2; `JwtStrategy.validate` returns `{ sub: payload.sub }` and controllers read it from `req.user`.

## Session Notes

- 2026-08-05: Init project context generated. Stack: Vite+React+MUI+React Router frontend, NestJS+Prisma+PostgreSQL backend, Auth0 OIDC PKCE.
- 2026-08-06: Phase 0 complete — all scaffolding in place. Husky pre-commit, Dockerfiles + docker-compose (dev mode), Jenkinsfile (parallel stages), backend strict TS + Prisma 7 (`prisma-client` generator, `@prisma/adapter-pg` + `pg` driver adapter, `prisma.config.ts`) + PrismaService with retry logic and pool lifecycle, frontend vitest + Cypress 15 + MUI v9 (nativeColor CSS tokens) + React Router v8 + @t3-oss/env-core. `prisma migrate dev` deferred until Postgres is up. Review completed — 5 minor issues resolved. UI patterns imprinted to `ui-registry.md`.
- 2026-08-06 (later): Phase 1.1 — Auth0 frontend login implemented test-first (red → green): 4 specs (`LoginButton`, `LogoutButton`, `AuthGuard`, `ProfilePage`) written before implementations, all passing (12 tests total). `Auth0Provider` mounted inside the router per the SDK's React Router integration pattern (provider must be inside Router for `useNavigate`); `main.tsx` intentionally not wrapped to avoid a runtime `useNavigate() may be used only in the context of a <Router>` crash. `.env` still required at runtime for dev (`env.ts` throws without `VITE_AUTH0_*`) — copy `.env.example`.
- 2026-08-06 (evening): Phase 1.2 + 1.3 — backend JWT auth implemented test-first (red → green): `src/auth/` (JwtStrategy + JwtAuthGuard + AuthModule) and `src/users/` (`/me` controller + module), `GET /health` replaces scaffold `GET /`, `AppService` removed. Key decisions: per-route `@UseGuards(JwtAuthGuard)` (not a global guard); `ownerId` = raw `sub`; `jwksRsa.passportJwtSecret` (jwks-rsa 4.x) as the secret provider — NOT `expressJwtSecret`, whose 2/4-arg callback contract is for express-jwt and would hang passport-jwt's 3-arg call; `algorithms: ['RS256']`; strategy throws at construction if `AUTH0_DOMAIN`/`AUTH0_AUDIENCE` are unset (docker-compose/env must provide them before boot). e2e infrastructure fixed (pre-existing breakage): `moduleNameMapper` for the generated Prisma client's `.js` imports, `--experimental-vm-modules` for Prisma 7's WASM query compiler under jest, `testTimeout: 30000`, and `jwks-rsa` mocked in the e2e spec (avoids loading `jose` ESM inside jest's CJS runtime). `npm run test` (9), `test:e2e` (1), `build`, `lint`, `tsc --noEmit` all green.