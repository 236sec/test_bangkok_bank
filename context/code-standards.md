# Code Standards

## General

- Keep modules small and single-purpose. One NestJS module per domain (collections, bookmarks, users).
- Fix root causes; do not layer workarounds.
- Do not mix unrelated concerns in one component, handler, or use case.
- Every domain operation must be independently testable.

## TypeScript

- Strict mode is required everywhere (`/frontend` and `/backend`). No exceptions.
- Avoid `any` — use explicit interfaces, `unknown` with type guards, or narrowly scoped generics.
- Validate unknown external input at system boundaries before trusting it. Backend uses class-validator DTOs with NestJS `ValidationPipe`; frontend validates form input.
- Prefer `const` over `let`; never use `var`.
- Use async/await exclusively — no raw Promise chains.

## NestJS (Backend)

- One module per domain: `CollectionsModule`, `BookmarksModule`, `UsersModule` (`/me`).
- Controllers are thin — they parse/validate input and delegate to services. No business logic in controllers.
- Services own business logic and Prisma access. Every service method that touches `Collection` or `Bookmark` must scope by `ownerId`.
- Always apply the global auth guard. The only route exempt from auth is the health check.
- Use DTOs with `class-validator` decorators for all request bodies.
- Return consistent response shapes — entities are transformed through a presenter/serializer, never returned raw with sensitive fields.

## React (Frontend)

- Functional components only. No class components.
- Use the `@auth0/auth0-react` `useAuth0` hook for all auth state. Never read tokens manually.
- Route guards wrap any page that requires a user; unauthenticated users redirect to Auth0 login.
- Colocate API calls in a `src/api/` module per resource (e.g. `src/api/collections.ts`) so pages stay declarative.
- Prefer MUI components over custom HTML; customize via the themed palette only.

## Styling

- Use the CSS custom property tokens defined in `ui-tokens.md` via the MUI theme. No hardcoded hex or oklch values in component code.
- Follow the border radius scale from `ui-tokens.md`.
- Light mode only in v1 — do not add dark-mode branches or `.dark` toggling.

## API Routes

- Validate and parse request input before any logic runs (NestJS `ValidationPipe`).
- Enforce auth and ownership before any mutation — the auth guard provides `ownerId`; services never trust client-supplied `ownerId`.
- Return consistent, predictable response shapes (entity → presentable DTO).
- Backend routes: `/collections`, `/bookmarks`, `/me`, `GET /collections/:id/bookmarks`.

## Data and Storage

- All domain data (collections, bookmarks) → PostgreSQL via Prisma.
- No cache layer in v1.
- `ownerId` is a non-nullable column on `Collection` and `Bookmark`, always derived from the validated JWT `sub`.
- Prisma migrations are committed and run in CI; never mutate the schema by hand in dev.

## File Organization

- `/frontend/src/pages/` — Route components (`CollectionsPage`, `BookmarksPage`, `AllPage`, `LoginPage`).
- `/frontend/src/api/` — Per-resource API client modules.
- `/frontend/src/theme/` — MUI theme and CSS variable tokens.
- `/frontend/src/components/` — Shared presentational components.
- `/frontend/src/auth/` — Auth0 provider config and route guards.
- `/backend/src/collections/` — Collection module (controller, service, DTOs).
- `/backend/src/bookmarks/` — Bookmark module (controller, service, DTOs).
- `/backend/src/users/` — Users module (`/me`).
- `/backend/src/auth/` — JWT validation guard and Auth0 JWKS config.
- `/backend/prisma/` — Prisma schema and migrations.
- `context/` — AI development context files. Not part of the running application.