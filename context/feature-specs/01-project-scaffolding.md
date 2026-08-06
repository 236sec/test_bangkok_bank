# Project Scaffolding

## Implementation

- setup linting and formatting tools for `backend` and `frontend` with `eslint` and `prettier`
- setup `husky` and `lint-staged` to run linting and formatting on pre-commit
- create a `Dockerfile` for the `backend` and `frontend` and setup `docker-compose` to run both services
  with postgres database
- setup `jest` for unit testing in `backend` and `vitest` for unit testing in `frontend`
- setup `cypress` for end-to-end testing in `frontend`
- setup `@t3-oss/env-core` with `zod` for environment variable validation in `frontend` only
- create a `Jenkinsfile` to run linting, formatting, unit testing and end-to-end testing in CI/CD pipeline without building a docker image
- add `prisma` to the `backend` and setup a `prisma` schema with `Collection` and `Bookmark` models
- `prisma migrate dev` to create the initial database schema and commit the migration files
- add connection to the postgres database in `backend` using `prisma` and `@nestjs/config`
- setup `@mui/material` >= v9, `@mui/icons-material`, and `@emotion/react`, `@emotion/styled` in `frontend` with a centralized theme at `src/theme/` referencing the CSS tokens from `ui-tokens.md`
- setup `react-router` >= v8 in `frontend` with initial route structure (`/collections`, `/bookmarks`, `/all`)

## Success Criteria

- able to run `docker-compose up` and see both services and the database running
- able to run `npm run lint` in both `backend` and `frontend` without any errors
- able to run `npm run test` in both `backend` and `frontend` without any errors
- able to connect to the postgres database in `backend` using `prisma` and `@nestjs/config`
- able to run `prisma migrate dev` and see the initial database schema created in the postgres database
- able to run `npm run cypress` in `frontend` and see the end-to-end tests passing
- able to run `npm run build` in both `backend` and `frontend` without any errors
- able to build a docker image for both `backend` and `frontend` using the `Dockerfile`
- codebase is well structured and follows best practices for both `backend` and `frontend`

## Human Check

- setup jenkins pipeline to run linting, formatting, unit testing and end-to-end testing in CI/CD pipeline without building a docker image
