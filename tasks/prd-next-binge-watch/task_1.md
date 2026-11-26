# Task 1.0: Backend Foundation, SQLite Persistence, and i18n Infrastructure

## Overview

Establish the backend runtime, testing, persistence, and localization foundation: install `@libsql/client`, Vitest (`@vitest/coverage-v8`), and Supertest; configure startup env validation, centralized JSON logging, in-memory TTL cache, local embedded SQLite schema and repositories, `en`/`pt-BR` message dictionaries, `/health` DB readiness check, centralized `errorMiddleware`, `app.ts` factory, and graceful `SIGTERM`/`SIGINT` shutdown.

<skills>
### Skill compliance

No frontend/React skills apply to this backend-only task.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules under `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- `code-standards.md`: Keep `.ts` files/classes ≤ 100 lines, functions ≤ 30 lines, ≤ 3 parameters, guard clauses, no blank lines inside functions, extracted constants, and no unnecessary comments.
- `javascript-typescript.md`: Use `const`, strict `===`/`!==`, zero `any`, explicit types and `Promise<T>`, and immutable updates.
- `node.md`: Pure `async/await` I/O (via `@libsql/client`), `dotenv` startup validation with `.env.example`, idempotent `SIGTERM`/`SIGINT` graceful shutdown closing HTTP server and SQLite, centralized logger adapter, `npm`-only lockfile hygiene, and acyclic module graph.
- `tests.md`: Configure Vitest in `backend/` with mandatory ≥ 80% coverage threshold (lines, branches, functions, statements) and FIRST-compliant tests.
- `folder-structure.md`: Follow `backend/src/{config,i18n,types,data,routes}` with one type concept per file under `types/`.
- Authorized deviation from `AGENTS.md`: Support `en` (default fallback) and `pt-BR` localized backend messages per PRD.
</rules>

<requirements>
- FR19: Support English (`en`) and Brazilian Portuguese (`pt-BR`), defaulting to `en` for unsupported locales.
- FR21: Return backend-generated validation, status, and error messages localized in the requested language (`lang` query param with `Accept-Language` fallback).
- FR23: Preserve and enhance the backend `/health` check to verify database readiness.
</requirements>

## Subtasks

- [x] 1.1 Install backend dependencies (`@libsql/client`, `vitest`, `@vitest/coverage-v8`, `supertest`, `@types/supertest`) via `npm`, configure `backend/vitest.config.ts` with 80% thresholds, update `backend/package.json` `test` script, and create `backend/.env.example` plus `.gitignore` rule for `backend/data/*.db*`.
- [x] 1.2 Implement `backend/src/config/env.ts` (startup env validation), `backend/src/config/logger.ts` (centralized JSON logger), and `backend/src/types/` per-concept contracts (`locale.ts`, `error.ts`, `search.ts`, `series.ts`, `person.ts`, `watchlist.ts`, `recommendation.ts`, `preferences.ts`, `tvmaze.ts`).
- [x] 1.3 Implement `backend/src/i18n/messages.ts` (`en` and `pt-BR` error/recommendation catalogs and locale resolver) and `backend/src/data/ttlCache.ts`.
- [x] 1.4 Implement `backend/src/data/database.ts` (`@libsql/client` async initialization, parent directory creation, `PRAGMA foreign_keys = ON`, DDL for `watchlist_items`, `watched_episodes`, `user_preferences`, health probe, and `closeDatabase()`), `backend/src/data/watchlistRepository.ts`, and `backend/src/data/preferencesRepository.ts`.
- [x] 1.5 Implement `backend/src/routes/healthRoutes.ts`, `backend/src/routes/errorMiddleware.ts`, `backend/src/app.ts`, and update `backend/src/index.ts` with idempotent `SIGTERM`/`SIGINT` graceful shutdown; verify `npm test` and `npm run build` in `backend/`.

## Implementation details

Refer to [techspec.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/techspec.md):
- **System architecture → Component overview (Backend)**
- **Implementation design → Data models (`ApiErrorResponse`, `UserPreferences`, Local SQLite database schema)**
- **Implementation design → API endpoints (`GET /health`)**
- **Monitoring and observability**

## Related acceptance criteria

- AC-10
- AC-11
- AC-13

## Task tests

### Unit tests

- [x] UT-09 - Backend `i18n/messages` resolves `lang` param, `Accept-Language`, and defaults to `en` for unsupported locales

### Integration tests

- [x] IT-07 - Upstream HTTP `429`/timeout/`500` scenarios map cleanly through `errorMiddleware` and `/health` reports DB status

### E2E tests

Not applicable for this task (covered in Task 8.0).

## Relevant files

- `backend/package.json`
- `backend/.env.example`
- `backend/vitest.config.ts`
- `backend/src/config/env.ts`
- `backend/src/config/logger.ts`
- `backend/src/i18n/messages.ts`
- `backend/src/types/*.ts`
- `backend/src/data/database.ts`
- `backend/src/data/ttlCache.ts`
- `backend/src/data/watchlistRepository.ts`
- `backend/src/data/preferencesRepository.ts`
- `backend/src/routes/healthRoutes.ts`
- `backend/src/routes/errorMiddleware.ts`
- `backend/src/app.ts`
- `backend/src/index.ts`
