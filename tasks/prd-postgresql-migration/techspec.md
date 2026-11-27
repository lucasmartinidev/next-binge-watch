# Technical Specification

## Summary

This specification defines the complete cutover of the **NEXT BINGE WATCH** backend persistence layer from embedded SQLite (`@libsql/client`) to **PostgreSQL 18.7** using `pg` (`node-postgres`) connection pooling, versioned TypeScript schema migrations managed by **`node-pg-migrate`** (executed via `tsx`), and a PostgreSQL-only **Docker Compose** setup for local development and isolated testing. All existing HTTP API contracts, bilingual (`en` and `pt-BR`) responses, and frontend views remain 100% backwards-compatible.

Schema initialization is removed from application boot and moved into reversible `node-pg-migrate` migrations under `backend/migrations/` using idiomatic PostgreSQL types (`JSONB`, `TIMESTAMPTZ`, `DOUBLE PRECISION`). A single PostgreSQL 18.7 container in the root `docker-compose.yml` provisions both the persistent development database (`next_binge_watch`) and an isolated test database (`next_binge_watch_test`). Backend unit tests remain fast and database-free through repository test doubles, while repository, HTTP route, and Playwright E2E tests execute against `next_binge_watch_test` with deterministic schema migration and table truncation between runs.

## System architecture

### Component overview

The repository preserves strict separation between `backend/`, `frontend/`, and `e2e/` with **no root `package.json`**. Data access remains unidirectional (`config → routes → services → data → types`).

```text
backend/compose.yaml (postgres:18.7)
  ├── DB: next_binge_watch       ◄── backend (npm run dev / migrate:up)
  └── DB: next_binge_watch_test  ◄── backend integration tests & e2e Playwright

HTTP Request ─► Express Routes ─► Domain Services ─► PG Repositories ─► pg Pool ─► PostgreSQL 18.7
```

**New components:**
- `backend/compose.yaml`: Defines the `postgres` service pinned to `postgres:18.7`, named volume mounted at `/var/lib/postgresql`, container health check (`pg_isready`), and init script mount.
- `backend/docker/postgres/init/01-create-test-db.sql`: PostgreSQL container initialization script executed on first volume creation to create the isolated `next_binge_watch_test` database alongside the default `next_binge_watch` database.
- `backend/migrations/<timestamp>_initial-schema.ts`: Initial `node-pg-migrate` TypeScript migration creating `watchlist_items`, `watched_episodes`, `user_preferences`, constraints, and indexes with a clean `down` rollback.
- `backend/src/data/testDatabase.ts`: Test-only helper for PostgreSQL integration suites that connects to `TEST_DATABASE_URL` and provides `resetTestDatabase(db)` via `TRUNCATE ... CASCADE`.
- `backend/src/services/inMemoryRepositories.ts` (test helper, or `.test`-scoped helper): Lightweight in-memory doubles for `WatchlistRepository` and `WatchedEpisodeRepository` so service unit tests (`watchlistService.test.ts`, `recommendationService.test.ts`, `recommendationResilience.test.ts`) run fast without requiring a live PostgreSQL server.
- `README.md` (repository root): Comprehensive onboarding, architecture, Docker Compose, migration, development, and testing guide.

**Modified components:**
- `backend/package.json` & `backend/package-lock.json`: Replace `@libsql/client` with `pg`, `@types/pg`, and `node-pg-migrate`; add `migrate:*`, `db:*`, and test-migration scripts.
- `backend/.env.example` & `backend/.gitignore`: Replace SQLite `file:` URL with PostgreSQL `DATABASE_URL` and `TEST_DATABASE_URL` placeholders; remove obsolete `data/*.db*` artifacts and defaults.
- `backend/src/config/env.ts` & `backend/src/config/env.test.ts`: Require `DATABASE_URL` explicitly at startup, validate it as a `postgres://` or `postgresql://` URL, and remove the SQLite default fallback.
- `backend/src/data/database.ts`: Replace `@libsql/client` with `pg.Pool`, verify live PostgreSQL connectivity on startup (`SELECT 1`), expose `DatabaseClient`, `createDatabase`, `pingDatabase`, and `closeDatabase`, and attach pool error logging via `logger`.
- `backend/src/data/watchlistRepository.ts`, `backend/src/data/watchlistRowMapper.ts`, `backend/src/data/watchedEpisodeRepository.ts`, `backend/src/data/preferencesRepository.ts`: Convert SQL placeholders (`?` → `$1..$n`), `INSERT OR IGNORE` → `ON CONFLICT ... DO NOTHING`, batch operations → PostgreSQL array/transaction queries, `result.rowsAffected` → `result.rowCount ?? 0`, and map native PostgreSQL `JSONB`/`TIMESTAMPTZ` values to existing domain types.
- `backend/src/data/repositories.test.ts`, `backend/src/routes/catalogRoutes.test.ts`, `backend/src/routes/healthAndError.test.ts`, `backend/src/routes/trackingAndRecommendationRoutes.test.ts`: Connect to `TEST_DATABASE_URL` via `testDatabase.ts` and reset tables cleanly before each test.
- `backend/src/services/watchlistService.test.ts`, `backend/src/services/recommendationService.test.ts`, `backend/src/services/recommendationResilience.test.ts`: Switch from SQLite `:memory:` to fast isolated in-memory repository doubles.
- `backend/vitest.config.ts`: Set `fileParallelism: false` so integration suites sharing `next_binge_watch_test` execute deterministically without table-truncation races, and exclude test-helper files from coverage thresholds.
- `e2e/playwright.config.ts` & `e2e/.gitignore`: Replace SQLite `.db` file deletion with test-database migration/reset against `TEST_DATABASE_URL` before launching the backend on port `3051`.
- `AGENTS.md`: Update backend stack, Docker Compose prerequisite, PostgreSQL 18.7 / `node-pg-migrate` workflows, and `backend/package.json` scripts while preserving the no-root-`package.json` rule.

**Removed components / artifacts:**
- `@libsql/client` dependency from `backend/package.json`.
- `backend/data/` local SQLite database files (if present) and SQLite directory-creation helpers in `backend/src/data/database.ts`.

## Implementation design

### Primary interfaces

```ts
// backend/src/data/database.ts
DatabaseClient = Pool

createDatabase(databaseUrl: string) -> Promise<DatabaseClient>
pingDatabase(client: DatabaseClient) -> Promise<boolean>
closeDatabase(client: DatabaseClient) -> Promise<void>
```

```ts
// backend/src/config/env.ts
AppEnv = {
  port: number
  databaseUrl: string
  tvmazeBaseUrl: string
  tvmazeTimeoutMs: number
}

loadEnv() -> AppEnv
```

```ts
// backend/src/data/watchlistRepository.ts
WatchlistRepository(db: DatabaseClient)
  listAll(status?: WatchStatus) -> Promise<StoredWatchlistRow[]>
  findBySeriesId(seriesId: number) -> Promise<StoredWatchlistRow | null>
  upsert(input: UpsertWatchlistInput) -> Promise<void>
  updateStatus(seriesId: number, status: WatchStatus) -> Promise<boolean>
  deleteBySeriesId(seriesId: number) -> Promise<boolean>
```

```ts
// backend/src/data/watchedEpisodeRepository.ts
WatchedEpisodeRepository(db: DatabaseClient)
  listBySeriesId(seriesId: number) -> Promise<StoredWatchedEpisode[]>
  listAllCounts() -> Promise<Map<number, number>>
  markEpisodes(episodes: EpisodeMarkInput[]) -> Promise<void>
  unmarkEpisodes(seriesId: number, episodeIds: number[]) -> Promise<void>
```

```ts
// backend/src/data/preferencesRepository.ts
PreferencesRepository(db: DatabaseClient)
  getPreferences() -> Promise<UserPreferences>
  setLocale(locale: Locale) -> Promise<UserPreferences>
```

```ts
// backend/src/data/testDatabase.ts (test helper)
getTestDatabaseUrl() -> string
resetTestDatabase(db: DatabaseClient) -> Promise<void>
```

### Data models

#### `watchlist_items` - PostgreSQL table for tracked TV series

| Field                  | Type               | Required | Description                                                                 |
| ---------------------- | ------------------ | -------- | --------------------------------------------------------------------------- |
| `series_id`            | `INTEGER` (PK)     | yes      | TVmaze show ID (natural primary key).                                       |
| `name`                 | `TEXT`             | yes      | Primary English/original show title.                                        |
| `localized_name_pt_br` | `TEXT`             | no       | Cached Brazilian/Portuguese AKA title (`NULL` when unavailable).            |
| `image_url`            | `TEXT`             | no       | Show poster URL (`NULL` when unavailable).                                  |
| `status`               | `TEXT` (CHECK)     | yes      | Watch status constrained to `'want_to_watch'`, `'watching'`, or `'watched'`. |
| `genres`               | `JSONB`            | yes      | Array of genre strings; defaults to `'[]'::jsonb`.                          |
| `rating`               | `DOUBLE PRECISION` | no       | Average TVmaze rating (`NULL` when unavailable).                            |
| `total_episodes`       | `INTEGER`          | yes      | Cached total episode count; defaults to `0`.                                |
| `tvmaze_url`           | `TEXT`             | yes      | Canonical TVmaze show URL for CC BY-SA attribution.                         |
| `created_at`           | `TIMESTAMPTZ`      | yes      | Record creation timestamp (`NOW()`).                                        |
| `updated_at`           | `TIMESTAMPTZ`      | yes      | Last update timestamp (`NOW()`), indexed for `ORDER BY updated_at DESC`.    |

```sql
CREATE TABLE watchlist_items (
  series_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  localized_name_pt_br TEXT,
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('want_to_watch', 'watching', 'watched')),
  genres JSONB NOT NULL DEFAULT '[]'::jsonb,
  rating DOUBLE PRECISION,
  total_episodes INTEGER NOT NULL DEFAULT 0,
  tvmaze_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_watchlist_items_status_updated ON watchlist_items (status, updated_at DESC);
```

#### `watched_episodes` - PostgreSQL table for per-episode completion

| Field            | Type           | Required | Description                                                          |
| ---------------- | -------------- | -------- | -------------------------------------------------------------------- |
| `series_id`      | `INTEGER` (FK) | yes      | References `watchlist_items(series_id)` with `ON DELETE CASCADE`.    |
| `episode_id`     | `INTEGER`      | yes      | TVmaze episode ID; composite PK `(series_id, episode_id)`.           |
| `season_number`  | `INTEGER`      | yes      | Season number (`>= 0`).                                              |
| `episode_number` | `INTEGER`      | yes      | Episode number within the season.                                    |
| `watched_at`     | `TIMESTAMPTZ`  | yes      | Timestamp when marked watched (`NOW()`).                             |

```sql
CREATE TABLE watched_episodes (
  series_id INTEGER NOT NULL REFERENCES watchlist_items(series_id) ON DELETE CASCADE,
  episode_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (series_id, episode_id)
);
CREATE INDEX idx_watched_episodes_series_order ON watched_episodes (series_id, season_number ASC, episode_number ASC);
```

#### `user_preferences` - PostgreSQL table for persisted single-user settings

| Field        | Type          | Required | Description                                                |
| ------------ | ------------- | -------- | ---------------------------------------------------------- |
| `key`        | `TEXT` (PK)   | yes      | Setting key (currently `'locale'`).                        |
| `value`      | `TEXT`        | yes      | Setting value (e.g., `'en'` or `'pt-BR'`).                 |
| `updated_at` | `TIMESTAMPTZ` | yes      | Timestamp of last preference update (`NOW()`).             |

```sql
CREATE TABLE user_preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### `pgmigrations` - `node-pg-migrate` tracking table

Managed automatically by `node-pg-migrate` to track applied migration filenames and execution timestamps (`id`, `name`, `run_on`).

#### `AppEnv` - validated backend environment configuration

| Field             | Type     | Required | Description                                                                                 |
| ----------------- | -------- | -------- | ------------------------------------------------------------------------------------------- |
| `port`            | `number` | no       | HTTP listen port (`1`–`65535`); defaults to `3000`.                                         |
| `databaseUrl`     | `string` | yes      | PostgreSQL connection string (`postgres://` or `postgresql://`); boot fails if unset/invalid. |
| `tvmazeBaseUrl`   | `string` | no       | TVmaze API base URL; defaults to `https://api.tvmaze.com`.                                  |
| `tvmazeTimeoutMs` | `number` | no       | Upstream fetch timeout in ms; defaults to `5000`.                                           |

```text
PORT=3000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/next_binge_watch
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/next_binge_watch_test
TVMAZE_BASE_URL=https://api.tvmaze.com
TVMAZE_TIMEOUT_MS=5000
```

#### `HealthResponse` - health check payload

| Field       | Type                       | Required | Description                                    |
| ----------- | -------------------------- | -------- | ---------------------------------------------- |
| `status`    | `'healthy' \| 'unhealthy'` | yes      | Overall backend operational status.            |
| `timestamp` | `string`                   | yes      | ISO-8601 UTC response timestamp.               |
| `database`  | `'ok' \| 'error'`          | yes      | Live PostgreSQL connectivity check result.     |

```text
{
  "status": "healthy",
  "timestamp": "2026-11-26T22:00:00.000Z",
  "database": "ok"
}
```

> **Degraded / database unreachable variant:** When PostgreSQL is stopped, unreachable, or its pool is closed, `GET /health` returns HTTP `503` with `status: "unhealthy"` and `database: "error"`.

```text
{
  "status": "unhealthy",
  "timestamp": "2026-11-26T22:00:05.000Z",
  "database": "error"
}
```

#### `ApiErrorResponse` - error envelope (unchanged contract)

| Code              | HTTP | Meaning                                                                 |
| ----------------- | ---- | ----------------------------------------------------------------------- |
| `INTERNAL_ERROR`  | 500  | Unexpected database/runtime error; never exposes SQL or credentials.    |
| `VALIDATION_ERROR`| 400  | Invalid route/query/body input.                                         |
| `NOT_FOUND`       | 404  | Requested series, person, watchlist entry, episode, or season missing.  |

```text
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred."
  }
}
```

#### Legacy SQLite to PostgreSQL column & behavior mapping

| Source (Legacy SQLite)                        | Destination (PostgreSQL 18.7)                                        |
| --------------------------------------------- | -------------------------------------------------------------------- |
| `genres_json TEXT DEFAULT '[]'`               | `genres JSONB NOT NULL DEFAULT '[]'::jsonb` (returned as `string[]`) |
| `rating REAL`                                 | `rating DOUBLE PRECISION` (returned as `number \| null`)             |
| `created_at / updated_at / watched_at TEXT`   | `TIMESTAMPTZ NOT NULL DEFAULT NOW()` (serialized via `.toISOString()`) |
| Positional `?` parameters                     | Positional `$1`, `$2`, ... parameters                                |
| `INSERT OR IGNORE INTO watched_episodes ...`  | `INSERT INTO watched_episodes ... ON CONFLICT (series_id, episode_id) DO NOTHING` |
| `db.batch(...)` multi-delete                  | `DELETE FROM watched_episodes WHERE series_id = $1 AND episode_id = ANY($2::int[])` |
| `result.rowsAffected`                         | `result.rowCount ?? 0`                                               |
| `PRAGMA foreign_keys = ON`                    | Enforced natively by PostgreSQL foreign keys                         |

#### `backend/package.json` scripts specification

| Script              | Command / Behavior                                                                                   |
| ------------------- | ---------------------------------------------------------------------------------------------------- |
| `dev`               | `nodemon --exec tsx src/index.ts` (unchanged)                                                        |
| `build`             | `tsc` (unchanged; compiles `src/` to `dist/`)                                                        |
| `start`             | `node dist/index.js` (unchanged)                                                                     |
| `migrate:up`        | `tsx ./node_modules/node-pg-migrate/bin/node-pg-migrate.js up -m migrations`                         |
| `migrate:down`      | `tsx ./node_modules/node-pg-migrate/bin/node-pg-migrate.js down -m migrations`                       |
| `migrate:redo`      | `tsx ./node_modules/node-pg-migrate/bin/node-pg-migrate.js redo -m migrations`                       |
| `migrate:create`    | `tsx ./node_modules/node-pg-migrate/bin/node-pg-migrate.js create -m migrations -j ts`               |
| `migrate:test:up`   | `tsx ./node_modules/node-pg-migrate/bin/node-pg-migrate.js up -m migrations -d TEST_DATABASE_URL`    |
| `migrate:test:down` | `tsx ./node_modules/node-pg-migrate/bin/node-pg-migrate.js down -m migrations -d TEST_DATABASE_URL`  |
| `db:up`             | `docker compose up -d`                                                                               |
| `db:down`           | `docker compose down`                                                                                |
| `db:reset`          | `docker compose down -v && docker compose up -d`                                                     |
| `test`              | `npm run migrate:test:up && vitest run --coverage`                                                   |
| `test:watch`        | `vitest`                                                                                             |

### API endpoints

All `/api/*` endpoints (`/api/search`, `/api/series/:id`, `/api/people/:id`, `/api/watchlist`, `/api/watchlist/:seriesId`, `/api/watchlist/:seriesId/episodes/:episodeId`, `/api/watchlist/:seriesId/seasons/:seasonNumber`, `/api/recommendations/next-binge`, `/api/preferences`) retain 100% identical routes, status codes, query/body parameters, and JSON payloads as defined in `tasks/prd-next-binge-watch/techspec.md`.

#### Overview

| Method | Route     | Description                                              |
| ------ | --------- | -------------------------------------------------------- |
| `GET`  | `/health` | Verifies live PostgreSQL 18.7 pool connectivity (`SELECT 1`). |

---

#### `GET /health`

Executes a lightweight `SELECT 1` probe against the PostgreSQL connection pool and returns service readiness.

**Query parameters**

None.

**Responses**

| Status | Body             | When                                                |
| ------ | ---------------- | --------------------------------------------------- |
| `200`  | `HealthResponse` | PostgreSQL responds to `SELECT 1` within timeout.   |
| `503`  | `HealthResponse` | PostgreSQL is unreachable, times out, or pool ended.|

**Example - success**

```http
GET /health
```

```text
{
  "status": "healthy",
  "timestamp": "2026-11-26T22:00:00.000Z",
  "database": "ok"
}
```

**Example - database unavailable**

```http
GET /health
```

```text
{
  "status": "unhealthy",
  "timestamp": "2026-11-26T22:00:05.000Z",
  "database": "error"
}
```

> The frontend header health indicator polls `/health` and surfaces degraded connectivity in the active UI language (`en` or `pt-BR`) without requiring frontend code changes.

---

## Integration points

- **PostgreSQL 18.7 (`pg` Pool):**
  - Connected via `process.env.DATABASE_URL` (development/production) or `process.env.TEST_DATABASE_URL` (integration/E2E tests).
  - Pool configured with bounded limits: `max: 10`, `idleTimeoutMillis: 30_000`, `connectionTimeoutMillis: 5_000`, `statement_timeout: 5_000`.
  - Startup runs `await pool.query('SELECT 1')` before binding the HTTP port so invalid credentials or unreachable PostgreSQL fail fast with a sanitized error log.
  - Unexpected idle client errors are captured via `pool.on('error', ...)` and logged through `logger.error` (never crashing silently).
  - Shutdown (`SIGTERM`/`SIGINT`) calls `await closeDatabase(db)` (`await pool.end()`) inside the existing idempotent shutdown routine before `process.exit()`.
- **`node-pg-migrate`:**
  - Invoked via `tsx` so `.ts` migrations compile on the fly without pre-building into `dist/`.
  - Reads `.env` automatically via `dotenv` (built into `node-pg-migrate`), targeting `DATABASE_URL` by default and `TEST_DATABASE_URL` for test scripts.
  - Uses transactional migrations by default so failed migrations roll back atomically.
- **Docker Compose (`backend/compose.yaml`):**
  - Service `postgres` uses official image `postgres:18.7` (Debian default or `18.7-alpine`; `postgres:18.7` chosen for standard locale/tooling parity).
  - Named volume `postgres_data:/var/lib/postgresql` (PostgreSQL 18+ canonical data mount path).
  - Port mapping `${POSTGRES_PORT:-5432}:5432`.
  - Environment defaults: `POSTGRES_USER=${POSTGRES_USER:-postgres}`, `POSTGRES_PASSWORD=${POSTGRES_PASSWORD:-postgres}`, `POSTGRES_DB=${POSTGRES_DB:-next_binge_watch}`.
  - Init script mounted read-only at `./docker/postgres/init:/docker-entrypoint-initdb.d:ro` creating `next_binge_watch_test`.
  - Health check: `pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-next_binge_watch}` (`interval: 5s`, `timeout: 5s`, `retries: 10`).
- **Playwright E2E (`e2e/playwright.config.ts`):**
  - Backend `webServer` command runs `npm run migrate:test:up`, truncates test tables, and starts the compiled backend on port `3051` with `DATABASE_URL` pointing to `TEST_DATABASE_URL` (defaulting to `postgresql://postgres:postgres@localhost:5432/next_binge_watch_test`).

## Testing approach

Target coverage: **≥ 80%** across lines, branches, functions, and statements in both `backend/` and `frontend/` (enforced by Vitest thresholds per `.agents/rules/tests.md`).

### Unit tests

| ID    | Test case name                                                                 | Acceptance criteria | Expected result                                                                                     |
| ----- | ------------------------------------------------------------------------------ | ------------------- | --------------------------------------------------------------------------------------------------- |
| UT-01 | `loadEnv` requires valid PostgreSQL `DATABASE_URL` and rejects missing/invalid | AC-01, AC-09        | Throws clear error when `DATABASE_URL` is missing or not `postgres://`/`postgresql://`; parses valid URL. |
| UT-02 | `mapWatchlistRow` normalizes PostgreSQL `JSONB`, `TIMESTAMPTZ`, and `NULL`s    | AC-04               | Converts `Date` timestamps to ISO strings, preserves `string[]` genres and `null` optional fields.  |
| UT-03 | `database.ts` pool lifecycle (`createDatabase`, `pingDatabase`, `closeDatabase`) | AC-05, AC-06      | Verifies boot connectivity check, returns `false` when ping rejects, and calls `pool.end()` cleanly. |
| UT-04 | `WatchlistService` & `EpisodeTrackingService` with in-memory repository doubles | AC-04, AC-07       | All watchlist CRUD, status transitions, and episode/season sync logic pass fast without live PG.    |
| UT-05 | `RecommendationService` & resilience with in-memory repository doubles         | AC-04, AC-07        | Tier priority (`watching` → `want_to_watch` → discovery) and timeout degradation pass without PG.   |
| UT-06 | Frontend Vitest suite (`npm test`, `lint`, `typecheck`, `build`)               | AC-11               | All 22 frontend tests pass with ≥ 80% coverage, 0 lint errors/warnings, and clean production build. |

Unit test strategy:
- Replace SQLite `:memory:` usage in service unit tests (`watchlistService.test.ts`, `recommendationService.test.ts`, `recommendationResilience.test.ts`) with deterministic in-memory repository test doubles implementing the same repository methods so unit tests remain fast, isolated, and independent of external services (FIRST principle).
- Mock only external dependencies (`pg.Pool` in unit tests for `database.ts`, `TvmazeClient` in service tests).

### Integration tests

| ID    | Test case name                                                              | Acceptance criteria | Expected result                                                                                           |
| ----- | --------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------------- |
| IT-01 | Migration lifecycle (`up` → `down` → `up`) on `next_binge_watch_test`       | AC-03               | Forward migration creates all 3 tables & indexes; `down` drops them cleanly; re-running `up` succeeds.    |
| IT-02 | PostgreSQL repositories CRUD, upsert, cascade delete, and `JSONB` handling  | AC-01, AC-04, AC-07 | `WatchlistRepository`, `WatchedEpisodeRepository`, and `PreferencesRepository` pass all assertions on PG. |
| IT-03 | Catalog routes integration (`GET /api/search`, `/series/:id`, `/people/:id`) | AC-04, AC-07       | Saved watchlist state & localized AKAs read cleanly from PostgreSQL test DB.                              |
| IT-04 | Watchlist, episode/season, recommendations & preferences HTTP integration   | AC-04, AC-07        | Full HTTP round-trips persist in PostgreSQL and return identical JSON contracts in `en` and `pt-BR`.      |
| IT-05 | `GET /health` returns 200 when PG reachable and 503 when pool closed        | AC-05               | Returns `{ status: 'healthy', database: 'ok' }` (200) and `{ status: 'unhealthy', database: 'error' }` (503). |
| IT-06 | Dev database non-mutation isolation                                         | AC-07               | Seeding a row in `next_binge_watch` and running `backend` `npm test` leaves the dev row untouched.        |

Integration test strategy:
- `npm test` in `backend/` runs `npm run migrate:test:up && vitest run --coverage`.
- Integration suites use `getTestDatabaseUrl()` (defaulting to `process.env.TEST_DATABASE_URL`) and call `resetTestDatabase(db)` (`TRUNCATE TABLE watched_episodes, watchlist_items, user_preferences CASCADE`) in `beforeEach`.
- `backend/vitest.config.ts` sets `fileParallelism: false` so suites sharing `next_binge_watch_test` never collide.

### E2E tests

| ID     | Test case name                                                                    | Acceptance criteria | Expected result                                                                                 |
| ------ | --------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| E2E-01 | Discovery & Series ↔ Person navigation against PostgreSQL-backed backend          | AC-04, AC-08        | Search, scope filter, cross-navigation, and TVmaze attribution pass on PostgreSQL test DB.      |
| E2E-02 | Watchlist persistence, episode/season tracking & Next Binge recommendations       | AC-04, AC-08        | Watchlist state survives browser reload, cascade delete works, recommendations update properly. |
| E2E-03 | Locale detection/persistence, health banner, retry & keyboard a11y on PostgreSQL  | AC-05, AC-08, AC-11 | `pt-BR`/`en` preference persists in PostgreSQL `user_preferences`, `/health` shows connected.   |

E2E execution strategy:
- `e2e/playwright.config.ts` runs test-DB migration & table truncation before starting the built backend against `next_binge_watch_test` on port `3051` and Vite on port `5181`.
- Existing Playwright specs (`discovery-navigation.spec.ts`, `watchlist-recommendations.spec.ts`, `i18n-resilience-a11y.spec.ts`) run unmodified against the PostgreSQL-backed stack, verifying true zero regression.

## Development sequencing

### Build order

1. **Docker Compose & PostgreSQL 18.7 environment:** Add `backend/compose.yaml` and `backend/docker/postgres/init/01-create-test-db.sql`; verify `postgres:18.7` starts healthy and creates both `next_binge_watch` and `next_binge_watch_test`.
2. **Backend dependencies, scripts & configuration:** Replace `@libsql/client` with `pg`, `@types/pg`, and `node-pg-migrate` in `backend/package.json`; add migration & DB scripts; update `backend/.env.example`, `backend/.gitignore`, and `backend/src/config/env.ts` (+ `env.test.ts`).
3. **Initial `node-pg-migrate` migration:** Create `backend/migrations/<timestamp>_initial-schema.ts` with `up` and `down`; verify `migrate:up`, `migrate:down`, `migrate:up`, and `migrate:create` against PostgreSQL 18.7.
4. **PostgreSQL database adapter & repositories:** Rewrite `backend/src/data/database.ts`, `watchlistRepository.ts`, `watchlistRowMapper.ts`, `watchedEpisodeRepository.ts`, and `preferencesRepository.ts` for `pg` Pool and PostgreSQL SQL syntax; remove SQLite leftovers.
5. **Test isolation & suites:** Add `testDatabase.ts` and in-memory repository doubles for service unit tests; update `vitest.config.ts` (`fileParallelism: false`), repository tests, route tests, service tests, and `e2e/playwright.config.ts`; verify backend, frontend, and Playwright E2E suites pass with ≥ 80% coverage and dev-DB isolation.
6. **Documentation update:** Create root `README.md` and update `AGENTS.md` (and clean any stale SQLite references across active docs); run final end-to-end verification from clean commands.

### Technical dependencies

- **Docker Engine & Docker Compose v2+** installed and running on the developer/CI machine to launch `postgres:18.7`.
- **Network access** during initial setup to pull `postgres:18.7` from Docker Hub and install `pg`, `@types/pg`, and `node-pg-migrate` via `npm install`.
- **Port `5432`** available locally (or overridden via `POSTGRES_PORT` and `.env`).

## Monitoring and observability

- **Health Check (`GET /health`):** Executes `SELECT 1` against the `pg.Pool`; returns HTTP `200` (`database: "ok"`) or HTTP `503` (`database: "error"`).
- **Structured Logging (`backend/src/config/logger.ts`):**
  - `info`: Server startup (`port`), graceful shutdown signal received (`signal`), and clean pool shutdown.
  - `error`: Startup DB connectivity failure, unexpected idle `pg.Pool` client errors (`pool.on('error')`), HTTP server close errors, and unhandled 500 request errors.
  - **Security constraint:** Never log `DATABASE_URL`, `TEST_DATABASE_URL`, or PostgreSQL passwords in any log entry or HTTP error payload; log only sanitized error messages or error codes.

## Technical considerations

### Key decisions

- **`pg` (`node-postgres`) over an ORM (Prisma / Drizzle / TypeORM):**
  - *Rationale:* The domain has only 3 small, well-defined relational tables with straightforward SQL queries already encapsulated in 3 repository classes (`≤ 90` lines each). Using `pg` directly keeps dependencies minimal, avoids ORM codegen/runtime overhead, respects the 100-line file rule, and integrates natively with `node-pg-migrate`.
  - *Trade-off:* Parameterized SQL and row mapping are written manually, mitigated by typed repository methods and PostgreSQL integration tests (`IT-02`).
- **TypeScript (`ts`) `node-pg-migrate` migrations executed via `tsx`:**
  - *Rationale:* `tsx` is already a devDependency in `backend/package.json`; TypeScript migrations provide compile-time type safety via `MigrationBuilder` and stay consistent with the TypeScript codebase.
  - *Rejected alternative:* Plain `.sql` files — viable, but less ergonomic for typed schema builders and deviates from the rest of the TypeScript toolchain.
- **Single PostgreSQL 18.7 container hosting two logical databases (`next_binge_watch` & `next_binge_watch_test`):**
  - *Rationale:* Simpler resource footprint and single port (`5432`) for local development while maintaining strict data isolation between dev and test runs via separate databases and distinct `DATABASE_URL` / `TEST_DATABASE_URL` variables.
  - *Rejected alternative:* Two containers on ports `5432`/`5433` — adds duplicate memory usage and extra Compose management for a single-developer local environment.
- **Explicit `DATABASE_URL` required at startup & explicit migrations via npm scripts:**
  - *Rationale:* Aligns strictly with `.agents/rules/node.md` ("Validate required variables during startup... fail fast") and avoids hidden DDL side effects or migration lock contention on server boot.
- **Idiomatic PostgreSQL types (`JSONB`, `TIMESTAMPTZ`, `DOUBLE PRECISION`):**
  - *Rationale:* Leverages PostgreSQL native validation, indexing, and timezone awareness while serializing cleanly to identical API JSON shapes (`string[]`, ISO-8601 strings, `number | null`).
- **Hybrid testing strategy (mocked unit tests + real PostgreSQL 18.7 integration/E2E tests):**
  - *Rationale:* Keeps service unit tests instantaneous (FIRST principle) while guaranteeing real PostgreSQL SQL syntax, constraints, cascade deletes, and migrations are tested against actual PostgreSQL 18.7 (`IT-01`–`IT-06`, `E2E-01`–`E2E-03`).

### Known risks

- **PostgreSQL 18+ Docker volume mount change:** Official `postgres:18+` Docker images changed the volume layout target from `/var/lib/postgresql/data` to `/var/lib/postgresql`. *Mitigation:* Mount `postgres_data:/var/lib/postgresql` in `docker-compose.yml` and verify container startup and data persistence across restarts.
- **Init script runs only on empty volume:** `/docker-entrypoint-initdb.d/` scripts run only when the Docker volume is first initialized. *Mitigation:* Document `npm run db:reset` (which removes and recreates the volume) and ensure test-DB creation is clearly documented in `README.md`.
- **`pg` driver type parsing (`TIMESTAMPTZ` / `COUNT(*)` / `JSONB`):** `pg` returns `TIMESTAMPTZ` as JavaScript `Date` objects, `COUNT(*)` as `string` (`bigint`), and `JSONB` as already-parsed JS arrays/objects. *Mitigation:* Handle both `Date` and `string` safely in row mappers (`value instanceof Date ? value.toISOString() : String(value)`), parse `COUNT(*)` via `Number(...)`, and validate `Array.isArray(row.genres)` with unit (`UT-02`) and integration (`IT-02`) tests.
- **Parallel Vitest suites racing on `next_binge_watch_test`:** Concurrent `TRUNCATE` across test files would cause flaky integration tests. *Mitigation:* Set `fileParallelism: false` in `backend/vitest.config.ts` and keep service unit tests fast with in-memory doubles.
- **Migration runner CJS/ESM resolution with `tsx`:** `backend/package.json` uses CommonJS by default while `node-pg-migrate` v7/v8 may ship ESM entry points. *Mitigation:* Verify `tsx ./node_modules/node-pg-migrate/bin/node-pg-migrate.js` (or `node-pg-migrate` CLI with `NODE_OPTIONS` / `tsx` loader) directly during implementation and test `up`, `down`, `redo`, and `create` end-to-end.

### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule file under `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and incorporated:
- **`AGENTS.md`:** Preserves independent `backend/` and `frontend/` directories with no root `package.json`; updates `AGENTS.md` to document PostgreSQL 18.7, `node-pg-migrate`, Docker Compose, and updated backend commands; all backend (`npm test`, `npm run build`) and frontend (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`) checks remain required before completion.
- **`code-standards.md`:** All new/modified `.ts` files and classes stay ≤ 100 lines, functions/methods ≤ 30 lines, ≤ 3 parameters per function, max 3 nested `if`/`else`, zero blank lines inside functions, zero unnecessary comments, constants extracted for timeouts/pool limits, and zero secrets in source code.
- **`javascript-typescript.md`:** Zero `any` usages, `const` by default, strict `===`/`!==`, explicit `Promise<T>` return types, immutable data handling, and `unknown` in `catch` blocks.
- **`node.md`:** Pure `async/await` with `pg` (zero blocking sync I/O), `dotenv` with strict startup validation of `DATABASE_URL`, idempotent `SIGTERM`/`SIGINT` graceful shutdown calling `pool.end()`, centralized `logger.ts` with zero credential leakage, npm lockfile maintained in `backend/package-lock.json`, and acyclic `config → routes → services → data → types` dependencies.
- **`tests.md`:** Enforces ≥ 80% coverage across lines, branches, functions, and statements in Vitest; respects FIRST principle with fast isolated unit tests, real PostgreSQL integration tests, and Playwright E2E specs under root `e2e/`.
- **`folder-structure.md`:** Keeps backend code under `backend/src/{config,routes,services,data,types}`, tests co-located as `*.test.ts`, migrations at `backend/migrations/`, Docker Compose at repo root, and E2E tests under root `e2e/`.

### Skill compliance

- **`react` (`.agents/skills/react/SKILL.md`):** Not applicable to implementation because no frontend React components, hooks, views, or styles are modified; frontend remains unchanged and is verified only via regression test, lint, typecheck, build, and Playwright E2E runs.
- No other implementation skills apply to this backend/infrastructure migration.

### Relevant and dependent files

**New files:**
- `backend/compose.yaml`
- `backend/docker/postgres/init/01-create-test-db.sql`
- `backend/migrations/<timestamp>_initial-schema.ts`
- `backend/src/data/testDatabase.ts`
- `backend/src/services/inMemoryRepositories.ts` (test helper)
- `README.md`

**Modified files:**
- `AGENTS.md`
- `backend/package.json`
- `backend/package-lock.json`
- `backend/.env.example`
- `backend/.gitignore`
- `backend/vitest.config.ts`
- `backend/src/config/env.ts`
- `backend/src/config/env.test.ts`
- `backend/src/data/database.ts`
- `backend/src/data/watchlistRepository.ts`
- `backend/src/data/watchlistRowMapper.ts`
- `backend/src/data/watchedEpisodeRepository.ts`
- `backend/src/data/preferencesRepository.ts`
- `backend/src/data/repositories.test.ts`
- `backend/src/routes/catalogRoutes.test.ts`
- `backend/src/routes/healthAndError.test.ts`
- `backend/src/routes/trackingAndRecommendationRoutes.test.ts`
- `backend/src/services/watchlistService.test.ts`
- `backend/src/services/recommendationService.test.ts`
- `backend/src/services/recommendationResilience.test.ts`
- `e2e/playwright.config.ts`
- `e2e/.gitignore`

**Dependent / regression-verified files (no code changes expected):**
- `backend/src/index.ts`
- `backend/src/app.ts`
- `backend/src/routes/healthRoutes.ts`
- `frontend/src/**` (verified via `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`)
- `e2e/discovery-navigation.spec.ts`
- `e2e/watchlist-recommendations.spec.ts`
- `e2e/i18n-resilience-a11y.spec.ts`
