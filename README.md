# Bookmark Manager

Private bookmark manager — a personal read-later app. Save links, organize them into collections. Everything is private to the signed-in user.

## Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Frontend      | Vite + React 19 + TypeScript                |
| UI            | MUI >= v9 + MUI Icons                       |
| Routing       | React Router >= v8                          |
| Backend       | NestJS 11 + TypeScript                      |
| ORM           | Prisma 7 + @prisma/adapter-pg               |
| Database      | PostgreSQL 16                               |
| Auth          | Auth0 OIDC (PKCE S256)                      |
| Testing       | vitest (frontend), Jest (backend), Cypress  |
| CI/CD         | Jenkins                                     |
| Containers    | Docker + Docker Compose (dev mode)          |

## Prerequisites

- **Node.js** >= 22
- **npm** >= 10
- **Docker** + Docker Compose
- **Auth0 account** (for Phase 1+)

## Quick Start

```bash
# 1. Clone and install dependencies
git clone <repo-url> && cd test_bangkok_bank
cd backend && npm install && cd ..
cd frontend && npm install && cd ..
npm install  # root (husky)

# 2. Start all services (PostgreSQL + backend + frontend)
docker compose up

# 3. Run database migrations (first time only)
cd backend && npx prisma migrate dev --name init

# 4. Open the app
open http://localhost:5173
```

## Project Structure

```
├── frontend/                  # Vite + React 19 SPA
│   ├── src/
│   │   ├── theme/             # MUI theme + CSS tokens (ui-tokens.md)
│   │   ├── router.tsx         # React Router layout routes
│   │   ├── env.ts             # @t3-oss/env-core validation
│   │   ├── App.tsx            # Layout shell (sidebar + Outlet)
│   │   └── test/setup.ts      # vitest + Testing Library setup
│   ├── cypress/               # E2E tests
│   ├── Dockerfile             # Dev container
│   ├── vitest.config.ts
│   └── cypress.config.ts
├── backend/                   # NestJS 11 REST API
│   ├── src/
│   │   └── prisma/            # PrismaModule + PrismaService
│   ├── prisma/
│   │   └── schema.prisma      # Collection + Bookmark models
│   ├── prisma.config.ts       # Prisma 7 datasource config
│   ├── Dockerfile             # Dev container
│   └── .env.example           # Required environment variables
├── docker-compose.yml         # PostgreSQL + backend + frontend
├── Jenkinsfile                # CI pipeline (lint + test + e2e)
├── .husky/pre-commit          # lint-staged on pre-commit
└── context/                   # AI development context (specs, plans, registry)
```

## Available Commands

### Root

| Command        | Description                      |
| -------------- | -------------------------------- |
| `npm install`  | Install husky git hooks          |

### Frontend (`cd frontend`)

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `npm run dev`       | Start Vite dev server (5173)  |
| `npm run build`     | Type-check + production build |
| `npm run lint`      | ESLint                        |
| `npm run test`      | vitest (unit tests)           |
| `npm run test:watch`| vitest watch mode             |
| `npm run cypress`   | Open Cypress UI               |
| `npm run cypress:run`| Run Cypress headless         |

### Backend (`cd backend`)

| Command             | Description                   |
| ------------------- | ----------------------------- |
| `npm run start:dev` | NestJS watch mode (3000)      |
| `npm run build`     | Production build              |
| `npm run start:prod`| Run production build          |
| `npm run lint`      | ESLint + Prettier             |
| `npm run format`    | Prettier (write)              |
| `npm run test`      | Jest (unit tests)             |
| `npm run test:e2e`  | Jest E2E (needs Postgres)     |

### Prisma (`cd backend`)

| Command                    | Description                  |
| -------------------------- | ---------------------------- |
| `npx prisma generate`      | Generate Prisma client       |
| `npx prisma migrate dev`   | Create + apply migration     |
| `npx prisma studio`        | Visual database browser      |
| `npx prisma validate`      | Validate schema              |

## Environment Variables

### Backend (`backend/.env`)

| Variable       | Description                          | Default                                          |
| -------------- | ------------------------------------ | ------------------------------------------------ |
| `DATABASE_URL` | PostgreSQL connection string         | `postgresql://postgres:postgres@localhost:5432/bookmarks` |

### Frontend (`frontend/.env`)

| Variable               | Description          | Default                  |
| ---------------------- | -------------------- | ------------------------ |
| `VITE_AUTH0_DOMAIN`    | Auth0 tenant domain  | —                        |
| `VITE_AUTH0_CLIENT_ID` | Auth0 SPA client ID  | —                        |
| `VITE_AUTH0_AUDIENCE`  | Auth0 API audience   | —                        |
| `VITE_API_URL`         | Backend API base URL | `http://localhost:3000`  |

## Docker Services

| Service    | Port  | Description              |
| ---------- | ----- | ------------------------ |
| `postgres` | 5432  | PostgreSQL 16 (Alpine)   |
| `backend`  | 3000  | NestJS API (watch mode)  |
| `frontend` | 5173  | Vite dev server           |

Source directories are mounted as volumes — changes reflect immediately without rebuilding.

## CI Pipeline

Jenkins declarative pipeline (`Jenkinsfile`) runs on push:

- **Backend**: install → lint → unit tests → build
- **Frontend**: install → lint → unit tests → build → E2E (Cypress)

No Docker image builds in CI — tests run directly on the agent.

## Design System

All colors, typography, and spacing use CSS custom properties defined in [`context/ui-tokens.md`](context/ui-tokens.md). Component patterns are tracked in [`context/ui-registry.md`](context/ui-registry.md). No hardcoded hex or oklch values in component code.
