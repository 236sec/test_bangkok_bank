# Private Bookmark Manager

## Overview

Private bookmark manager — a personal read-later app. A signed-in person saves links, organizes them into collections, and nobody else can see any of it. There is no public content, no shared feed, no "browse other users." If user A can see, edit, or even learn of the existence of user B's data, the app is broken. Everything in this app is private to the person who created it.

## Goals

1. A signed-in user can save a link with auto-fetched metadata (title, favicon, description) and edit it.
2. A signed-in user can organize bookmarks into collections and view them grouped or filtered.
3. Every piece of data is strictly scoped to its owner — no cross-user visibility is ever possible through the API or UI.
4. The app runs locally via `docker compose up` and passes lint + type-check + tests in CI.

## Core User Flow

1. User lands on the app → sees the sign-in screen (no public content is ever shown).
2. User signs in via Auth0 (OIDC, Authorization Code flow with PKCE S256) → the SPA receives an access token.
3. User lands on their personal dashboard showing their collections and recent bookmarks.
4. User saves a link → pastes a URL, the app fetches metadata (title, favicon, description), the user optionally edits the title/notes and picks a collection.
5. User creates and manages collections on the `/collections` page — create, view one, list all, delete.
6. User browses saved links on the `/bookmarks` page — list, view detail, delete, filter by collection.
7. User opens the `/all` page to see collections with their bookmarks nested inside them.
8. User signs out → nothing persistable remains on the client beyond the session.

## Features

### Auth & Core Data (Phase 1)

- Auth0 OIDC login (Authorization Code + PKCE S256) on the frontend.
- JWT access token validation on every backend request (except health check).
- `/me` endpoint returning the authenticated user's profile.
- Prisma schema and migrations for `Collection` and `Bookmark` models.
- User identity (`ownerId`) extracted from the validated token and used to scope every query.

### Collections CRUD (Phase 2)

- `/collections` page: list the current user's collections.
- Create a new collection (name).
- View a single collection.
- Delete a collection.

### Bookmarks CRUD (Phase 3)

- `/bookmarks` page: list the current user's bookmarks.
- Create a bookmark from a URL — backend fetches metadata (title, favicon, description).
- View bookmark detail.
- Delete a bookmark.
- Filter bookmarks by collection.

### All View (Phase 4)

- `/all` page: collections with their bookmarks nested inside them, rather than two lists side by side.

### Infrastructure (Phase 0)

- Monorepo structure with `/frontend` and `/backend`.
- Dockerfile + `docker-compose.yml` for frontend, backend, and PostgreSQL.
- CI pipeline running lint + type-check + tests on push.

## Scope

### In Scope

- Sign-in via Auth0 (OIDC, PKCE S256).
- Collections: create, list, view one, delete.
- Bookmarks: create (with URL metadata fetch), list, view detail, delete, filter by collection.
- `/all` page showing collections with nested bookmarks.
- `favicon` stored on the Bookmark model.
- Backend routes: `/collections`, `/bookmarks`, `/me`, `GET /collections/:id/bookmarks`.
- Docker Compose local dev + CI pipeline.
- Strict per-owner data isolation.

### Out of Scope

- Read/unread status tracking.
- Archiving or soft-delete.
- Sharing or any multi-user visibility.
- Tags (collections are the only organizing primitive).
- Bulk operations (import/export, batch delete).
- Browser extension.
- Public API.
- Dark mode (light mode only for v1).

## Success Criteria

1. A signed-in user can create a collection, view it, and delete it.
2. A signed-in user can save a bookmark from a URL and see its auto-fetched title and favicon.
3. A signed-in user can filter bookmarks by collection and view a bookmark's detail.
4. `docker compose up` starts the frontend, backend, and PostgreSQL with no manual steps.
5. No API route (except health check) responds successfully without a valid token, and no route ever returns data owned by another user.