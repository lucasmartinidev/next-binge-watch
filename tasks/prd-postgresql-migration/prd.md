# Product Requirements Document (PRD)

## Overview

**NEXT BINGE WATCH** currently stores user watchlist items, watched episode progress, and language preferences in an embedded local SQLite file (`@libsql/client`) initialized via inline startup statements. While sufficient for an initial prototype, embedded file-based storage creates friction for concurrent access, lacks disciplined versioned schema evolution, and diverges from production-grade relational database workflows.

This initiative replaces SQLite completely with **PostgreSQL 18.7**, introduces versioned and reversible database schema migrations managed by **`node-pg-migrate`**, provisions a reproducible local **Docker Compose** environment for PostgreSQL 18.7 development and testing, updates **`package.json` scripts** and environment templates, and refreshes **all project documentation** (including a new root `README.md` and updated `AGENTS.md`). Developers and QA engineers gain a realistic, repeatable relational database workflow, while end-user viewers continue using every feature of NEXT BINGE WATCH seamlessly with zero API or UI regressions.

## Objectives

### Business and Developer Experience Goals
- Standardize backend persistence on **PostgreSQL 18.7** across local development, integration testing, and end-to-end testing, removing all SQLite dependencies and local `.db` file artifacts.
- Establish disciplined, version-controlled, reversible schema management using **`node-pg-migrate`** so schema changes are auditable and repeatable across environments.
- Provide a single-command **Docker Compose** workflow for running PostgreSQL 18.7 locally while keeping `backend/` and `frontend/` running natively on the host.
- Equip developers with clear `backend/package.json` scripts and complete, accurate documentation so any contributor can go from clone to running application and passing tests without guesswork.

### Success Criteria and Key Metrics
- **Complete Technology Cutover:** 100% of SQLite packages, connection logic, local `.db` configuration defaults, and SQLite references in active operational documentation are removed and replaced with PostgreSQL 18.7.
- **Reproducible Local Provisioning:** A developer with Docker installed can start a healthy PostgreSQL 18.7 instance and apply all schema migrations to a fresh database in under 30 seconds using documented commands.
- **Reversible Schema Lifecycle:** 100% of database tables, constraints, and indexes are created through `node-pg-migrate` migrations that succeed cleanly on forward execution (`up`), rollback (`down`), and re-application (`up`) on an empty database.
- **Zero End-User Regression:** 100% of existing REST API endpoints, bilingual (`en` and `pt-BR`) responses/error payloads, watchlist workflows, episode/season tracking, recommendations, and `/health` checks preserve identical observable behavior.
- **Automated Quality & Isolation:** 100% of backend unit/integration tests, frontend tests, linters, builds, and Playwright E2E tests pass against the new architecture with ≥ 80% test coverage across all metrics in both applications and 0 mutations to the developer's local development database.
- **Documentation Completeness:** 100% of setup prerequisites, Docker Compose usage, environment variables, migration scripts, and test commands are accurately documented in root `README.md`, `AGENTS.md`, and `backend/.env.example`.

## User stories

- **US1 (Local PostgreSQL Provisioning):** As a developer, I want to start a PostgreSQL 18.7 database locally with Docker Compose while continuing to run the backend and frontend natively on my machine so that I have a fast, consistent development loop without manually installing PostgreSQL.
- **US2 (Versioned Schema Migrations):** As a developer, I want to run, roll back, and generate database migrations via `backend/package.json` scripts powered by `node-pg-migrate` so that schema changes are versioned, reviewable, and repeatable across every environment.
- **US3 (Seamless Viewer Continuity):** As a NEXT BINGE WATCH viewer, I want my watchlist, episode/season progress, language preference, and "Next Binge Watch" recommendations to persist reliably across page refreshes and server restarts with no change to how the app looks or behaves.
- **US4 (Isolated Automated Testing):** As a developer or QA engineer, I want backend integration tests and Playwright E2E tests to run against a dedicated PostgreSQL test database—while unit tests remain fast and isolated—so that running test suites never wipes or corrupts my local development data.
- **US5 (Accurate Health & Failure Feedback):** As a developer or operator, I want the backend `/health` endpoint and startup logs to accurately report PostgreSQL connectivity and fail clearly when the database is unavailable or unconfigured so that connection issues are immediately diagnosable.
- **US6 (Self-Serve Onboarding Documentation):** As a new contributor, I want a comprehensive root `README.md`, updated `AGENTS.md`, and accurate `backend/.env.example` so that I can install dependencies, launch PostgreSQL 18.7, run migrations, start both apps, and execute all test suites on the first try.

## Core features

### 1. PostgreSQL 18.7 Persistence Replacement
Replaces the embedded SQLite storage layer with PostgreSQL 18.7 as the sole persistent datastore for the backend, eliminating all SQLite dependencies and file-based database assumptions while preserving full feature parity.

At a high level, the backend connects to PostgreSQL using the configured connection string, executes all watchlist, watched-episode, and user-preference reads and writes against PostgreSQL, enforces referential integrity (including cascading deletion of watched episodes when a series is removed from the watchlist), reports live PostgreSQL health on `GET /health`, and releases database connections cleanly on shutdown.

- **FR1:** All SQLite dependencies (`@libsql/client`) and file-based database provisioning logic must be completely removed from the backend.
- **FR2:** Watchlist items, watched episode records, and user preferences must be persisted in PostgreSQL 18.7 with full behavioral parity to existing API contracts (including status validation, cascade deletes on series removal, progress counts, and localized fields).
- **FR3:** `GET /health` must verify live connectivity to PostgreSQL and return a healthy status when reachable or an unhealthy status when PostgreSQL is down or unreachable.
- **FR4:** Backend shutdown (`SIGTERM`/`SIGINT`) must close active PostgreSQL connections cleanly so the server exits promptly without hanging.

### 2. Versioned Schema Migrations with `node-pg-migrate`
Replaces ad-hoc schema initialization at server startup with explicit, versioned, and reversible database migrations managed by `node-pg-migrate`.

At a high level, the initial database schema (watchlist items, watched episodes, user preferences, constraints, and supporting indexes) is defined in a versioned migration. Developers apply migrations before running or testing against a fresh database, can roll back migrations cleanly, and can scaffold new migrations for future changes.

- **FR5:** All database schema definitions must be managed via `node-pg-migrate` migrations rather than implicit DDL execution inside application startup code.
- **FR6:** Running the forward migration command (`up`) against an empty PostgreSQL 18.7 database must create the complete schema and record migration state cleanly.
- **FR7:** Running the rollback migration command (`down`) must cleanly revert the applied migration(s) without leaving orphaned tables or constraints, and re-running `up` must restore the schema cleanly.
- **FR8:** Developers must have a script to scaffold new timestamped migrations using `node-pg-migrate`.

### 3. Docker Compose Environment for Local Development and Testing
Provides a standardized Docker Compose configuration pinned to PostgreSQL 18.7 so developers and E2E runners can provision local databases identically across machines without containerizing the Node/React apps.

At a high level, Docker Compose defines the PostgreSQL 18.7 service with persistent named volume storage for local development data, standard local credentials matching `.env.example`, a container health check, and clean provisioning of an isolated test database so automated integration and E2E suites never interfere with local development records.

- **FR9:** A root Docker Compose configuration must provision **PostgreSQL 18.7** only, allowing developers to run `backend` and `frontend` locally via `npm run dev`.
- **FR10:** The PostgreSQL 18.7 development service must persist data across container stops and restarts via a named volume and expose a health check confirming readiness to accept connections.
- **FR11:** The Docker Compose / local database setup must provide a dedicated test database (distinct from the development database) for running backend integration tests and Playwright E2E tests in isolation.
- **FR12:** Starting, stopping, and resetting the local PostgreSQL container must require no manual SQL commands beyond the documented commands/scripts.

### 4. Updated `package.json` Scripts and Test Configuration
Exposes clear, ergonomic scripts in `backend/package.json` (while preserving the repository rule of having no root `package.json`) and updates test/E2E configurations to run reliably against PostgreSQL 18.7.

At a high level, `backend/package.json` includes migration scripts (up, down, create) and database-related test/dev workflows, `backend/.env.example` documents PostgreSQL connection variables for development and testing, backend unit tests remain fast and isolated from live database dependencies where appropriate, backend integration tests target the dedicated test PostgreSQL database, and `e2e/playwright.config.ts` prepares and runs against the isolated test PostgreSQL database instead of deleting local `.db` files.

- **FR13:** `backend/package.json` must provide clearly named scripts for running `node-pg-migrate` migrations (`up`, `down`, `create`) and any required test-database migration/setup steps, while preserving existing `dev`, `build`, `start`, `test`, and `test:watch` commands.
- **FR14:** `backend/.env.example` must be updated to provide valid PostgreSQL 18.7 connection defaults matching the Docker Compose development configuration (and document the test database connection variable).
- **FR15:** Backend automated tests must separate fast isolated unit tests from PostgreSQL-backed integration tests using a dedicated test database (configured via environment variable such as `TEST_DATABASE_URL`), resetting test state between runs without touching development data.
- **FR16:** The Playwright E2E test configuration (`e2e/`) must run migrations and execute against the isolated test PostgreSQL database rather than referencing SQLite files.

### 5. Comprehensive Documentation Update
Brings all active repository documentation into full alignment with PostgreSQL 18.7, `node-pg-migrate`, and Docker Compose, and introduces a clear root `README.md`.

At a high level, contributors have a single entry-point `README.md` at the repository root covering architecture, prerequisites, Docker Compose database startup, environment setup, migration commands, running frontend/backend, and running unit/integration/E2E tests. `AGENTS.md` is updated to match the new backend technology stack, prerequisites, and workflow commands.

- **FR17:** A root `README.md` must be created documenting project overview, prerequisites (Node.js, npm, Docker / Docker Compose), environment configuration, starting PostgreSQL 18.7, running and rolling back migrations, starting backend and frontend in development, and running all test suites (backend, frontend, and Playwright E2E).
- **FR18:** `AGENTS.md` must be updated to accurately reflect PostgreSQL 18.7, `node-pg-migrate`, Docker Compose as a prerequisite for local development/testing, and all updated `backend/package.json` scripts while preserving the separation between `frontend/` and `backend/` (no root `package.json`).
- **FR19:** Active operational configuration and documentation files (`backend/.env.example`, `AGENTS.md`, root `README.md`, and `frontend/README.md` if applicable) must contain zero outdated SQLite setup instructions.

## Acceptance criteria

- **AC-01 (FR1, US3):** Given the updated `backend/` application, when inspecting project dependencies and source files, then `@libsql/client` and all SQLite file-handling logic are completely removed and PostgreSQL 18.7 is the sole database engine.
- **AC-02 (FR9, FR10, US1):** Given Docker is running on a developer's machine, when the developer starts the Docker Compose stack, then a PostgreSQL 18.7 container starts, passes its readiness health check, accepts connections on the documented port, and retains saved records across container restarts.
- **AC-03 (FR5, FR6, FR7, FR8, US2):** Given a fresh PostgreSQL 18.7 database, when a developer runs the `backend/package.json` migration `up` script, then all required tables and constraints are created cleanly; when the developer runs the migration `down` script and then `up` again, then the rollback and re-application both succeed with zero errors; and when the create-migration script is invoked, a new timestamped migration file is generated.
- **AC-04 (FR2, US3):** Given a migrated PostgreSQL 18.7 database and running backend, when a user adds/updates/removes watchlist series, toggles individual episodes or entire seasons, switches language (`en`/`pt-BR`), and requests "Next Binge Watch" recommendations, then all changes persist in PostgreSQL across backend restarts, removing a series cascades to its watched episodes, and all HTTP responses match existing API contracts.
- **AC-05 (FR3, US5):** Given the backend is running, when PostgreSQL 18.7 is reachable, then `GET /health` returns HTTP `200` with a healthy database status; when PostgreSQL is stopped or unreachable, then `GET /health` returns HTTP `503` with an unhealthy database status and the frontend connectivity indicator reflects the degraded state.
- **AC-06 (FR4, US5):** Given the backend is running and connected to PostgreSQL, when the process receives `SIGINT` or `SIGTERM`, then active database connections close cleanly and the server exits with code `0`.
- **AC-07 (FR11, FR15, US4):** Given records exist in the local development PostgreSQL database, when a developer runs `npm test` in `backend/`, then all unit and integration tests pass with ≥ 80% coverage on lines, branches, functions, and statements, and existing development database records remain untouched.
- **AC-08 (FR16, US4):** Given the isolated test PostgreSQL database is available, when a developer runs the Playwright E2E suite in `e2e/`, then all E2E specs pass end-to-end without referencing any SQLite files and without modifying the development database.
- **AC-09 (FR13, FR14, US2, US6):** Given a clean checkout, when a developer copies `backend/.env.example` to `backend/.env`, starts Docker Compose, and runs the documented `backend/package.json` scripts, then migrations, `npm run dev`, `npm run build`, and `npm test` succeed without manual edits to connection strings.
- **AC-10 (FR17, FR18, FR19, US6):** Given the updated repository, when reviewing root `README.md`, `AGENTS.md`, and `backend/.env.example`, then all three accurately document PostgreSQL 18.7, Docker Compose usage, `node-pg-migrate` commands, test setup, and preserve the no-root-`package.json` rule with zero stale SQLite instructions.
- **AC-11 (US3):** Given the completed migration, when running `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` in `frontend/`, then all checks pass with 0 errors, 0 warnings, and ≥ 80% coverage without requiring breaking changes to frontend user flows.

## User experience

### User Profiles and Needs
- **Developers & Contributors:** Need a fast, predictable onboarding and daily development workflow: bring up PostgreSQL 18.7 in one Docker Compose command, apply/rollback migrations via `npm` scripts, run backend and frontend locally with hot reload, and run tests without corrupting dev data.
- **QA Engineers & Automated Pipelines:** Need isolated, repeatable database state for backend integration tests and Playwright E2E tests, plus clear health and error diagnostics when PostgreSQL is unavailable.
- **End-User Viewers:** Expect zero disruption—watchlist items, episode/season progress, bilingual (`en` and `pt-BR`) UI and error copy, "Next Binge Watch" recommendations, and the Cyber-Neon UI must continue working identically.

### Main Flows and Interactions
1. **First-Time Developer Setup:** Clone repo → follow root `README.md` → copy `backend/.env.example` to `backend/.env` → install dependencies in `backend/` and `frontend/` → start PostgreSQL 18.7 via Docker Compose → run migration `up` script in `backend/` → run `npm run dev` in `backend/` and `frontend/`.
2. **Schema Evolution Flow:** Create a new migration via `backend/package.json` script → edit migration file → run migration `up` → verify behavior → optionally test `down` rollback and re-apply `up`.
3. **Testing Flow:** Run `npm test` in `backend/` (unit tests + isolated PostgreSQL test-DB integration tests), `npm test` in `frontend/`, and `npx playwright test` in `e2e/` (isolated test DB), leaving local dev data intact.
4. **End-User Flow:** Identical to existing NEXT BINGE WATCH journeys; if PostgreSQL becomes unavailable while the backend is running, `/health` reports unhealthy and the header status indicator communicates the connectivity state cleanly in the active language (`en` or `pt-BR`).

### UI/UX and Accessibility Requirements
- Zero visual, interactive, or WCAG 2.1 Level AA accessibility regressions across all existing views on desktop and mobile viewports.
- Backend API error responses when database operations fail must remain localized (`en` and `pt-BR`) and free of raw database stack traces or credentials.

## High-level technical constraints

- **Non-Negotiable Technologies:**
  - Database engine: **PostgreSQL 18.7** (official PostgreSQL 18.7 container image in Docker Compose).
  - Migration tool: **`node-pg-migrate`**.
  - Local database orchestration: **Docker Compose** (database service(s) only; `backend` and `frontend` run natively on the host).
  - Existing application stack: Node.js, Express 5, TypeScript, Vitest (`backend/`); React 19, TypeScript, Vite, Tailwind CSS, Vitest (`frontend/`); Playwright (`e2e/`).
- **Repository Separation:** Must preserve independent `backend/` and `frontend/` applications with separate `package.json` and `package-lock.json` files and **no root `package.json`**.
- **Backend Exclusivity & API Stability:** The frontend must continue communicating exclusively with the backend; all existing REST API routes, request/response shapes, and bilingual error schemas must remain backwards-compatible.
- **Performance Targets:** Under local PostgreSQL 18.7, 95% of watchlist and episode-tracking API writes must complete within 300 ms, and `GET /health` must respond promptly (failing fast rather than hanging when PostgreSQL is offline).
- **Security & Data Hygiene:**
  - All database queries must use parameterized inputs (zero string-interpolated user values).
  - Database credentials must be supplied via environment variables (`DATABASE_URL` / `TEST_DATABASE_URL`), never hardcoded in source code, and `.env` files must remain gitignored.
  - No raw SQL errors, connection strings, or credentials may be exposed in HTTP API responses.
- **Code & Testing Standards:** All changes must adhere to `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`), maintaining ≥ 80% coverage across lines, branches, functions, and statements in both `backend/` and `frontend/`.

## Out of scope

- **SQLite-to-PostgreSQL Data Transfer:** No one-time export/import script to migrate existing local SQLite `.db` data into PostgreSQL (explicitly a fresh start with PostgreSQL initialized via `node-pg-migrate`).
- **Full-Stack Containerization:** Running `backend` or `frontend` inside Docker containers or adding Dockerfiles for the Node/React apps.
- **Database Admin UIs:** Adding pgAdmin, Adminer, or other third-party database web interfaces to Docker Compose.
- **Root `package.json` / Monorepo Tooling:** Adding a root `package.json`, npm workspaces, Turborepo, or Nx.
- **Production Infrastructure & Operations:** Cloud PostgreSQL provisioning (RDS, Cloud SQL, Supabase, Neon), Terraform/Kubernetes manifests, replication/HA, automated backup/restore pipelines, or external connection poolers (e.g., PgBouncer).
- **Product Feature Changes:** Multi-user authentication, new watchlist/recommendation features, frontend redesigns, or changes to the TVmaze integration.
