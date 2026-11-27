# Task 3.0: Backend Unit/Integration Test Isolation and Playwright E2E Migration to PostgreSQL

## Overview

Establish deterministic test isolation between fast database-free service unit tests and PostgreSQL-backed integration and Playwright E2E tests targeting `next_binge_watch_test`, ensuring ≥ 80% coverage across both applications and zero mutations to the local development database.

<skills>
### Skill compliance

- No implementation skills in `.agents/skills/` apply (test infrastructure and E2E configuration only; frontend React code is not modified, only regression-verified).
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- Follow the FIRST principle and testing pyramid: fast, isolated unit tests with repository doubles; real PostgreSQL integration tests on `next_binge_watch_test`; Playwright E2E tests under root `e2e/` (`tests.md`, `folder-structure.md`).
- Enforce Vitest ≥ 80% coverage on lines, branches, functions, and statements in both `backend/` and `frontend/` (`tests.md`).
- Keep all test helper files clean, typed without `any`, and within `code-standards.md` limits.
- Run `npm test` and `npm run build` in `backend/`, `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` in `frontend/`, and `npx playwright test` in `e2e/` (`AGENTS.md`).
</rules>

<requirements>
- **FR11, FR15:** Isolate backend integration tests on `next_binge_watch_test` via `TEST_DATABASE_URL` with clean table truncation between cases, while keeping service unit tests fast and isolated via repository test doubles, never mutating `next_binge_watch`.
- **FR13:** Wire `backend/package.json` `test` script (`npm run migrate:test:up && vitest run --coverage`) so test migrations are always applied before running integration tests.
- **FR16:** Update `e2e/playwright.config.ts` and `e2e/.gitignore` to run migrations and reset `next_binge_watch_test` before launching the backend on port `3051` instead of manipulating SQLite `.db` files.
</requirements>

## Subtasks

- [x] 3.1 Create `backend/src/data/testDatabase.ts` (`getTestDatabaseUrl`, `resetTestDatabase`) and update `backend/vitest.config.ts` (`fileParallelism: false`, exclude test helpers from coverage) and `backend/package.json` `test` script.
- [x] 3.2 Create lightweight in-memory repository test doubles (`backend/src/services/inMemoryRepositories.ts`) and migrate `watchlistService.test.ts`, `recommendationService.test.ts`, and `recommendationResilience.test.ts` off SQLite `:memory:` (`UT-04`, `UT-05`).
- [x] 3.3 Update HTTP route integration suites (`catalogRoutes.test.ts`, `healthAndError.test.ts`, `trackingAndRecommendationRoutes.test.ts`) to run against `next_binge_watch_test` with `resetTestDatabase` (`IT-03`, `IT-04`, `IT-05`), and verify dev-DB non-mutation (`IT-06`) plus backend `npm test` (≥ 80% coverage) and `npm run build`.
- [x] 3.4 Update `e2e/playwright.config.ts` and `e2e/.gitignore` for PostgreSQL `TEST_DATABASE_URL` setup, verify frontend regression suite (`UT-06`: `npm test`, `lint`, `typecheck`, `build`), and run all Playwright E2E specs (`E2E-01`, `E2E-02`, `E2E-03`) against the PostgreSQL-backed stack.

## Implementation details

Follow `tasks/prd-postgresql-migration/techspec.md` sections:
- **System architecture → Component overview** (`testDatabase.ts`, `inMemoryRepositories.ts`, `vitest.config.ts`, `e2e/playwright.config.ts`)
- **Integration points** (Playwright E2E `webServer` command targeting `TEST_DATABASE_URL`)
- **Testing approach** (`UT-04`–`UT-06`, `IT-03`–`IT-06`, `E2E-01`–`E2E-03`)

## Related acceptance criteria

- AC-04
- AC-05
- AC-07
- AC-08
- AC-11

## Task tests

### Unit tests (if applicable)

- [x] UT-04 - `WatchlistService` & `EpisodeTrackingService` with in-memory repository doubles
- [x] UT-05 - `RecommendationService` & resilience with in-memory repository doubles
- [x] UT-06 - Frontend Vitest suite (`npm test`, `lint`, `typecheck`, `build`)

### Integration tests (if applicable)

- [x] IT-03 - Catalog routes integration (`GET /api/search`, `/series/:id`, `/people/:id`)
- [x] IT-04 - Watchlist, episode/season, recommendations & preferences HTTP integration
- [x] IT-05 - `GET /health` returns 200 when PG reachable and 503 when pool closed
- [x] IT-06 - Dev database non-mutation isolation

### E2E tests (if applicable)

- [x] E2E-01 - Discovery & Series ↔ Person navigation against PostgreSQL-backed backend
- [x] E2E-02 - Watchlist persistence, episode/season tracking & Next Binge recommendations
- [x] E2E-03 - Locale detection/persistence, health banner, retry & keyboard a11y on PostgreSQL

## Relevant files

- `backend/src/data/testDatabase.ts`
- `backend/src/services/inMemoryRepositories.ts`
- `backend/src/services/watchlistService.test.ts`
- `backend/src/services/recommendationService.test.ts`
- `backend/src/services/recommendationResilience.test.ts`
- `backend/src/routes/catalogRoutes.test.ts`
- `backend/src/routes/healthAndError.test.ts`
- `backend/src/routes/trackingAndRecommendationRoutes.test.ts`
- `backend/vitest.config.ts`
- `backend/package.json`
- `e2e/playwright.config.ts`
- `e2e/.gitignore`
- `e2e/discovery-navigation.spec.ts`
- `e2e/watchlist-recommendations.spec.ts`
- `e2e/i18n-resilience-a11y.spec.ts`
