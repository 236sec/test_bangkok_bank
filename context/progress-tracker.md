# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Not started — setup complete, ready to begin Phase 0 (Infrastructure).

## Current Goal

- Stand up the monorepo Docker setup and CI pipeline before any feature work (Phase 0).

## Completed

- Project scaffolding exists: `/frontend` (Vite + React 19) and `/backend` (NestJS 11). Fresh, no feature code yet.

## In Progress

- None yet.

## Next Up

1. Phase 0.1 — Monorepo & Docker (`docker-compose.yml` + Dockerfiles for frontend, backend, PostgreSQL).
2. Phase 0.2 — CI Pipeline (GitHub Actions: lint + type-check + tests).
3. Phase 1.1 — Auth0 frontend login (`@auth0/auth0-react`, PKCE S256).
4. Phase 1.2 — Backend JWT guard (Auth0 JWKS validation, extract `ownerId` from `sub`).
5. Phase 1.3 — `/me` endpoint.
6. Phase 1.4 — Prisma schema & migrations (Collection, Bookmark with `ownerId`).
7. Phase 2 — Collections CRUD (API + page).
8. Phase 3 — Bookmarks CRUD (API + page, URL metadata fetch).
9. Phase 4 — `/all` page.

## Open Questions

- Which unique field from the Auth0 token is used as `ownerId` — the `sub` claim directly, or a normalized version? Confirm during Phase 1.2 implementation.
- How the backend stores favicons — store the fetched favicon URL, or download bytes into the DB? Default: store the URL string on the `Bookmark.favicon` column unless testing shows otherwise.
- Monorepo tooling — plain npm scripts in each package, or a workspace manager (npm/pnpm workspaces)? Default: per-package scripts with a root `docker-compose.yml`; revisit if shared code is introduced.

## Architecture Decisions

- Postgres + Prisma chosen as the database + ORM (strong Prisma support, owner-scoped queries).
- Access token (not ID token) used as the backend Bearer credential — the OAuth2/OIDC-correct choice for resource server auth.
- `@auth0/auth0-react` handles the full PKCE S256 flow and token storage on the frontend; the backend stays stateless and validates via JWKS.
- Light mode only for v1 to keep scope tight.

## Session Notes

- 2026-08-05: Init project context generated. Stack confirmed: Vite+React+MUI+React Router frontend, NestJS+Prisma+PostgreSQL backend, Auth0 OIDC PKCE. Both packages are clean scaffolds. No feature work started.