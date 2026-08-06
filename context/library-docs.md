# Library Docs

Project-specific usage rules for third-party libraries. Before using any library listed here, read its section for conventions and constraints.

## @auth0/auth0-react (Frontend)

The sole auth integration on the frontend. Wraps the app in an `Auth0Provider` configured with the Auth0 tenant's domain, client id, and API audience.

- official docs: https://auth0.com/llms.txt
- Uses the **Authorization Code flow with PKCE (S256)**. Never enable the implicit flow.
- `useAuth0()` is the only way to read auth state or tokens. Never parse/store tokens manually.
- `getAccessTokenSilently()` is used to attach `Authorization: Bearer <token>` to every API call; wrap fetch in an authenticated client that calls it.
- Configure the provider with `authorizationParams: { response_type: "code" }` and ensure PKCE is enabled (default in the SDK).
- Redirect URIs must be allowlisted in the Auth0 tenant; use env vars (`VITE_AUTH0_DOMAIN`, `VITE_AUTH0_CLIENT_ID`, `VITE_AUTH0_AUDIENCE`).

## Auth0 JWKS JWT validation (Backend)

The backend validates the access token — not the ID token — against the Auth0 tenant's JWKS endpoint inside a NestJS guard.

- `JwtAuthGuard` (extends `AuthGuard('jwt')`) is applied **per-route** with `@UseGuards(JwtAuthGuard)`; the only exempt route is the health check (`GET /health`).
- Validate `iss` and `aud` against env-configured values (`AUTH0_ISSUER`, `AUTH0_AUDIENCE`).
- Extract the `sub` claim as `ownerId` — the unique identifier for the user. Never accept `ownerId` from the request.
- Use a library that supports JWKS caching/rotation (e.g. `passport-jwt` or `jwks-rsa`).

## Prisma (Backend)

**Version: Prisma 7.x** (`prisma@7`, `@prisma/client@7`) with `@prisma/adapter-pg` + `pg` driver adapter.

The only ORM. All database access goes through Prisma.

- **Generator**: `prisma-client` (not `prisma-client-js`) with `moduleFormat = "cjs"` (NestJS is CommonJS). Generated client lives in `backend/generated/prisma/` (gitignored).
- **Config**: `backend/prisma.config.ts` manages the datasource URL via `env('DATABASE_URL')`. Schema in `backend/prisma/schema.prisma` — no `url` field in the datasource block.
- **Driver adapter**: `@prisma/adapter-pg` with `pg.Pool` for PostgreSQL connections. `PrismaService` injects `ConfigService` to read `DATABASE_URL`, creates the pool, and passes `new PrismaPg(pool)` as adapter to `PrismaClient`.
- **Lifecycle**: `PrismaService.onModuleInit()` calls `$connect()` with retry logic (5 attempts, 2s delay). `onModuleDestroy()` calls `$disconnect()` then `pool.end()`.
- Every `Collection` and `Bookmark` query includes a `where: { ownerId }` clause. Add a lint/test guard if feasible.
- Migrations are committed and run via `prisma migrate deploy` in the Docker entrypoint and CI.
- The `ownerId` column is non-nullable on both models.

## MUI >= v9 + @mui/icons-material (Frontend)

The UI component library and icon set.

- Theme is centralized in `/frontend/src/theme/`; override MUI palette to reference the `ui-tokens.md` CSS variables. No raw MUI default color imports.
- Icons come only from `@mui/icons-material`. Use `fontSize="small"` for inline/nav, `medium` for buttons/headers.
- Light mode only in v1 — no dark theme setup.

## React Router >= v8

Client-side routing for the three pages and auth redirect.

- Routes: `/collections`, `/bookmarks`, `/all`. Root `/` redirects to `/collections` (or login if unauthenticated).
- Use a layout route for the authenticated shell (sidebar + outlet).
- Use loader/action patterns or guard components to enforce auth before rendering protected pages.

---

_This file grows as libraries are added. When installing a new third-party library, add its section here with project-specific usage rules._
