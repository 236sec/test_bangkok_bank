# Build Plan

Big picture only. Detailed implementation steps for each feature live in `context/feature-specs/`. This file defines phases, feature names, and dependencies — not how to build each feature.

## Core Principle

Infrastructure and CI land before any feature work. Auth and the data model land before any CRUD UI. Every phase builds strictly on the previous one. All work follows TDD (red-green-refactor).

---

## Phase 0 — Infrastructure

### 0.1 Monorepo & Docker

Monorepo structure with `/frontend` and `/backend`. Dockerfiles for each service plus `docker-compose.yml` for frontend, backend, and PostgreSQL.

### 0.2 CI Pipeline

GitHub Actions workflow that runs lint, type-check, and tests on every push for both frontend and backend.

**Depends on**: nothing.

---

## Phase 1 — Auth & Core Data

### 1.1 Auth0 Frontend Login

Wire `@auth0/auth0-react` into the SPA with the Authorization Code + PKCE S256 flow. Login surface and token handling. No protected pages yet.

### 1.2 Backend JWT Guard

NestJS global auth guard validating the access token against Auth0 JWKS. Extract `sub` as `ownerId`. Health check is the only exempt route. Unauthenticated requests return 401.

### 1.3 `/me` Endpoint

Returns the authenticated user's profile derived from the validated token. Confirms the auth pipeline end to end.

### 1.4 Prisma Schema & Migrations

`Collection` and `Bookmark` models with non-nullable `ownerId`, plus `createdAt`/`updatedAt` and `favicon` on `Bookmark`. Migrations committed.

**Depends on**: Phase 0.

---

## Phase 2 — Collections CRUD

### 2.1 Collections API

`/collections` endpoints: list, view one, create, delete — all scoped to `ownerId`.

### 2.2 Collections Page

`/collections` page: list collections, view one, create via dialog, delete.

**Depends on**: Phase 1 (auth + data model).

---

## Phase 3 — Bookmarks CRUD

### 3.1 Bookmarks API

`/bookmarks` endpoints: list, view detail, create (with backend URL metadata fetch — title, favicon, description), delete. Plus `GET /collections/:id/bookmarks` for filtering by collection. All scoped to `ownerId`.

### 3.2 Bookmarks Page

`/bookmarks` page: list, view detail, create, delete, filter by collection.

**Depends on**: Phase 2 (collections must exist for bookmarks to reference).

---

## Phase 4 — All View

### 4.1 All Page

`/all` page showing collections with their bookmarks nested inside them — a single grouped view rather than two side-by-side lists.

**Depends on**: Phase 3 (both collections and bookmarks must be implemented).

---

## Feature Count

| Phase                    | Features |
| ------------------------ | -------- |
| Phase 0 — Infrastructure | 2        |
| Phase 1 — Auth & Data    | 4        |
| Phase 2 — Collections    | 2        |
| Phase 3 — Bookmarks      | 2        |
| Phase 4 — All View       | 1        |
| **Total**                | **11**   |