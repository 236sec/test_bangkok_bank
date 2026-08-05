# Architecture Context

## Stack

| Layer             | Technology                          | Role                                                          |
| ----------------- | ----------------------------------- | ------------------------------------------------------------- |
| Frontend          | Vite + React 19 + TypeScript        | SPA hosting all three pages and the OIDC client               |
| UI                | MUI v6 + MUI Icons                  | Component library, theming, icons                              |
| Routing           | React Router                        | Client-side routing for `/collections`, `/bookmarks`, `/all`   |
| Auth (frontend)   | `@auth0/auth0-react`                | PKCE S256 code flow, token storage, silent refresh             |
| Backend           | NestJS 11 + TypeScript              | REST API: `/collections`, `/bookmarks`, `/me`                 |
| ORM               | Prisma                              | Schema, migrations, typed queries against PostgreSQL           |
| Database          | PostgreSQL                          | Persistent storage for collections and bookmarks               |
| Auth (backend)    | Auth0 JWKS JWT validation (guard)   | Validates the access token on every request                   |
| CI/CD             | GitHub Actions                      | Lint + type-check + tests on push                              |
| Containerization  | Docker + Docker Compose             | Local dev for frontend, backend, and PostgreSQL                |

## System Boundaries

- `/frontend` — Owns the entire SPA: pages (`/collections`, `/bookmarks`, `/all`), routing, MUI theming, Auth0 SDK integration, and all API calls. Knows nothing about Prisma or the database. Received data only ever belongs to the current user.
- `/backend` — Owns the REST API, JWT validation against Auth0 JWKS, Prisma data access, and the ownership model. Every controller/service scopes data to the `ownerId` extracted from the validated token. Owns URL metadata fetching.
- `/frontend` and `/backend` do not share runtime code. Shared API response shapes are duplicated as Typed DTOs on each side until a shared package is introduced.
- `/postgres` (via Compose) — Owns durable storage only. No app logic lives in the database.

## Storage Model

- **PostgreSQL**: All domain data — `Collection` rows (`id`, `name`, `ownerId`, `createdAt`, `updatedAt`) and `Bookmark` rows (`id`, `url`, `title`, `favicon`, `notes?`, `collectionId?`, `ownerId`, `createdAt`, `updatedAt`). Both tables carry an `ownerId` column that is never nullable and always derived from the validated JWT `sub` claim.
- **Cache**: None in v1. No Redis.
- **File/Blob storage**: Favicons are fetched by the backend at bookmark-create time and stored as a URL string (or cached bytes) on the Bookmark row — no separate blob store in v1.

## Auth and Access Model

- Authentication uses Auth0 OIDC with the **Authorization Code flow + PKCE (S256)**. No implicit flow is ever used.
- The frontend SPA uses `@auth0/auth0-react`, which performs the PKCE code challenge, handles the redirect, exchanges the code for tokens, and silently refreshes.
- The backend accepts the **access token** (not the ID token) as the `Authorization: Bearer <token>` credential on every request.
- The backend validates the access token's signature against the Auth0 tenant's **JWKS endpoint** and checks the audience/issuer before any controller handler runs. This happens in a NestJS auth guard applied globally (the only unauthenticated route is the health check).
- The `sub` claim of the validated token is the sole source of `ownerId`. A unique identifier is extracted from the token to identify the user; if a unique field can be reliably extracted, it is used as `ownerId`.
- Sessions are managed entirely by the Auth0 SDK on the frontend. The backend is stateless — no session store.

## Invariants

1. **Every query scoped to `ownerId`** — No Prisma query for collections or bookmarks ever runs without a `WHERE ownerId = <currentUser>` filter. No unscoped `findMany` exists.
2. **`ownerId` comes only from the validated token** — Never from a request body, query param, or route param. The `sub` claim from the validated JWT is the only source of truth.
3. **No cross-owner data paths** — No endpoint takes another user's ID, no admin override, no "view as." The concept of other users does not exist in the API surface.
4. **Tokens validated on every request** — No unauthenticated routes except the health check. The NestJS auth guard runs before any controller handler.
5. **Frontend never exposes other users' data** — No client-side routing can display another user's data. The API simply never returns it, so the frontend cannot leak what it never receives.