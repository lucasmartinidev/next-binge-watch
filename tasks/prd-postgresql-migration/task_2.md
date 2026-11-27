# Task 2.0: PostgreSQL Connection Pool Adapter and Repository Layer Migration

## Overview

Replace the `@libsql/client` database adapter and SQLite queries across the backend data layer with a `pg.Pool` adapter and parameterized PostgreSQL repositories while preserving 100% behavioral parity for watchlist items, watched episodes, user preferences, `/health`, and graceful shutdown.

<skills>
### Skill compliance

- No implementation skills in `.agents/skills/` apply (backend data-access layer only; `react` skill is not applicable).
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- Pure `async/await` PostgreSQL queries via `pg.Pool`; zero synchronous I/O or event-loop blocking (`node.md`).
- Attach `pool.on('error')` logging via centralized `logger.ts` without leaking credentials or `DATABASE_URL` (`node.md`, `code-standards.md`).
- Keep `data/` unidirectional with zero imports from `routes/` or `services/` (`folder-structure.md`, `node.md`).
- Enforce ≤ 100 lines per file, ≤ 30 lines per function, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, and zero `any` (`code-standards.md`, `javascript-typescript.md`).
- Maintain ≥ 80% coverage across all metrics (`tests.md`).
</rules>

<requirements>
- **FR1:** Eliminate all remaining SQLite code (`createClient`, file directory setup, `PRAGMA`, SQLite SQL syntax).
- **FR2:** Persist watchlist items, watched episodes (with cascade deletion on series removal), and user preferences in PostgreSQL 18.7 with identical domain contracts.
- **FR3:** Verify live PostgreSQL connectivity via `pingDatabase` (`SELECT 1`) powering `GET /health`.
- **FR4:** Close active `pg.Pool` connections cleanly on `closeDatabase` during `SIGTERM`/`SIGINT` shutdown.
</requirements>

## Subtasks

- [x] 2.1 Rewrite `backend/src/data/database.ts` to create a bounded `pg.Pool`, verify connectivity (`SELECT 1`) on `createDatabase`, log idle pool errors via `logger.ts`, implement `pingDatabase` (`SELECT 1` returning boolean), and close cleanly via `pool.end()`.
- [x] 2.2 Migrate `backend/src/data/watchlistRepository.ts` and `backend/src/data/watchlistRowMapper.ts` to parameterized PostgreSQL SQL (`$1..$n`, `ON CONFLICT (series_id) DO UPDATE`, `rowCount ?? 0`) and safe normalization of PostgreSQL `JSONB` (`string[]`) and `TIMESTAMPTZ` (`Date` → ISO-8601 string).
- [x] 2.3 Migrate `backend/src/data/watchedEpisodeRepository.ts` and `backend/src/data/preferencesRepository.ts` to parameterized PostgreSQL SQL (`ON CONFLICT (series_id, episode_id) DO NOTHING`, `ANY($2::int[])` batch unmark, `ON CONFLICT (key) DO UPDATE`, and `TIMESTAMPTZ` normalization).
- [x] 2.4 Add unit tests for `mapWatchlistRow` (`UT-02`) and `database.ts` lifecycle (`UT-03`), and update `backend/src/data/repositories.test.ts` to verify CRUD, upsert, cascade delete, and `JSONB`/`TIMESTAMPTZ` behavior against `next_binge_watch_test` (`IT-02`).

## Implementation details

Follow `tasks/prd-postgresql-migration/techspec.md` sections:
- **Implementation design → Primary interfaces** (`DatabaseClient`, `WatchlistRepository`, `WatchedEpisodeRepository`, `PreferencesRepository`)
- **Implementation design → Data models** (Legacy SQLite to PostgreSQL column & behavior mapping)
- **Integration points** (`pg.Pool` timeouts, error listener, and clean shutdown)
- **Monitoring and observability** (sanitized logging and `/health` probe)

## Related acceptance criteria

- AC-01
- AC-04
- AC-05
- AC-06

## Task tests

### Unit tests (if applicable)

- [x] UT-02 - `mapWatchlistRow` normalizes PostgreSQL `JSONB`, `TIMESTAMPTZ`, and `NULL`s
- [x] UT-03 - `database.ts` pool lifecycle (`createDatabase`, `pingDatabase`, `closeDatabase`)

### Integration tests (if applicable)

- [x] IT-02 - PostgreSQL repositories CRUD, upsert, cascade delete, and `JSONB` handling

### E2E tests (if applicable)

Not applicable for this task (covered in Task 3.0).

## Relevant files

- `backend/src/data/database.ts`
- `backend/src/data/database.test.ts`
- `backend/src/data/watchlistRepository.ts`
- `backend/src/data/watchlistRowMapper.ts`
- `backend/src/data/watchlistRowMapper.test.ts`
- `backend/src/data/watchedEpisodeRepository.ts`
- `backend/src/data/preferencesRepository.ts`
- `backend/src/data/repositories.test.ts`
- `backend/src/index.ts`
- `backend/src/routes/healthRoutes.ts`
