# Task 1.0: Docker Compose PostgreSQL 18.7 Setup, Dependencies, Environment Validation, and Initial `node-pg-migrate` Migration

## Overview

Provision the local PostgreSQL 18.7 Docker Compose environment with both development (`next_binge_watch`) and test (`next_binge_watch_test`) databases, swap SQLite (`@libsql/client`) for `pg` and `node-pg-migrate` in `backend/`, update `backend/package.json` scripts and environment validation, and create the initial reversible TypeScript schema migration.

<skills>
### Skill compliance

- No implementation skills in `.agents/skills/` apply (backend infrastructure and configuration only; `react` skill is not applicable).
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- Preserve independent `backend/` and `frontend/` directories with no root `package.json`; update `backend/package-lock.json` via `npm`.
- Validate required `DATABASE_URL` at startup via `dotenv` with zero hardcoded production credentials (`node.md`, `code-standards.md`).
- Keep all `.ts` files ≤ 100 lines, functions ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero unnecessary comments, and zero `any` (`code-standards.md`, `javascript-typescript.md`).
- Maintain ≥ 80% test coverage and verify the migration lifecycle against PostgreSQL 18.7 (`tests.md`).
</rules>

<requirements>
- **FR1:** Remove `@libsql/client` and SQLite defaults from `backend/`.
- **FR5, FR6, FR7, FR8:** Manage all schema definitions exclusively through reversible `node-pg-migrate` TypeScript migrations (`up`, `down`, `redo`, `create`).
- **FR9, FR10, FR12:** Provide `backend/compose.yaml` running PostgreSQL 18.7 only with persistent named volume (`/var/lib/postgresql`), readiness health check, and init script creating `next_binge_watch_test`.
- **FR13, FR14:** Add standardized `migrate:*` and `db:*` scripts in `backend/package.json` and update `backend/.env.example` and `backend/.gitignore`.
</requirements>

## Subtasks

- [x] 1.1 Create `backend/compose.yaml` (`postgres:18.7`, named volume mounted at `/var/lib/postgresql`, `pg_isready` health check) and `backend/docker/postgres/init/01-create-test-db.sql` creating `next_binge_watch_test`, and verify the container boots healthy with both databases available.
- [x] 1.2 Remove `@libsql/client` and install `pg`, `@types/pg`, and `node-pg-migrate` in `backend/`; update `backend/package.json` with `migrate:up`, `migrate:down`, `migrate:redo`, `migrate:create`, `migrate:test:up`, `migrate:test:down`, `db:up`, `db:down`, and `db:reset` scripts; clean up `backend/.gitignore` and stale local `.db` files under `backend/data/`.
- [x] 1.3 Update `backend/.env.example` with PostgreSQL `DATABASE_URL` and `TEST_DATABASE_URL`, and update `backend/src/config/env.ts` (and `backend/src/config/env.test.ts`) to require a valid `postgres://` or `postgresql://` `DATABASE_URL` at startup.
- [x] 1.4 Author the initial reversible TypeScript migration `backend/migrations/<timestamp>_initial-schema.ts` defining `watchlist_items`, `watched_episodes`, `user_preferences`, constraints, and indexes, and verify `migrate:test:up`, `migrate:test:down`, `migrate:test:up`, and `migrate:create` end-to-end against PostgreSQL 18.7.

## Implementation details

Follow `tasks/prd-postgresql-migration/techspec.md` sections:
- **System architecture → Component overview** (`docker-compose.yml`, init script, `backend/migrations/`)
- **Implementation design → Data models** (`watchlist_items`, `watched_episodes`, `user_preferences`, `AppEnv`, `backend/package.json` scripts specification)
- **Integration points** (Docker Compose PostgreSQL 18.7 mount path `/var/lib/postgresql` and `node-pg-migrate` CLI execution via `tsx`)

## Related acceptance criteria

- AC-01
- AC-02
- AC-03
- AC-09

## Task tests

### Unit tests (if applicable)

- [x] UT-01 - `loadEnv` requires valid PostgreSQL `DATABASE_URL` and rejects missing/invalid

### Integration tests (if applicable)

- [x] IT-01 - Migration lifecycle (`up` → `down` → `up`) on `next_binge_watch_test`

### E2E tests (if applicable)

Not applicable for this task (covered in Task 3.0).

## Relevant files

- `backend/compose.yaml`
- `backend/docker/postgres/init/01-create-test-db.sql`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/.env.example`
- `backend/.gitignore`
- `backend/src/config/env.ts`
- `backend/src/config/env.test.ts`
- `backend/migrations/<timestamp>_initial-schema.ts`
