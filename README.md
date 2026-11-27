# NEXT BINGE WATCH

A bilingual (`en` and `pt-BR`) TV series and people discovery, watchlist, episode-tracking, and recommendation web application powered by a React 19 + TypeScript frontend, an Express 5 + TypeScript backend, the TVmaze catalog API, and **PostgreSQL 18.7** with versioned **`node-pg-migrate`** schema migrations.

## Architecture

The repository contains two independent applications (`frontend/` and `backend/`) plus an isolated Playwright end-to-end suite (`e2e/`). There is intentionally **no root `package.json`**; install dependencies and run npm scripts inside each directory.

```text
.
├── backend/
│   ├── compose.yaml                  # PostgreSQL 18.7 Docker Compose service
│   ├── docker/postgres/init/         # Init script creating next_binge_watch_test
│   ├── migrations/                   # Versioned TypeScript node-pg-migrate files
│   ├── src/                          # Express 5 API, TVmaze BFF, pg repositories
│   └── .env.example
├── frontend/                         # React 19, Vite, Tailwind CSS, Cyber-Neon DS
├── e2e/                              # Playwright end-to-end tests
├── AGENTS.md                         # Project rules and agent/contributor workflow
└── DESIGN.md                         # 3-Tier Cyber-Neon Design System specification
```

- **Frontend (`http://localhost:5173`)** communicates exclusively with the backend (`/api/*` and `/health`).
- **Backend (`http://localhost:3000`)** proxies and caches TVmaze data and persists watchlist items, watched episodes, and user preferences in **PostgreSQL 18.7** via `pg` connection pooling.
- **Data Attribution:** Catalog data is provided by [TVmaze](https://www.tvmaze.com) under CC BY-SA.

## Prerequisites

- **Node.js** (v20.11+ recommended) and **npm**
- **Docker** and **Docker Compose** (v2+) for running **PostgreSQL 18.7** locally

## Quick Start

### 1. Install dependencies

```bash
cd backend
npm install

cd ../frontend
npm install
```

*(Optional, for E2E tests)*:

```bash
cd e2e
npm install
```

### 2. Configure environment variables

Copy the backend environment template and adjust values if needed:

```bash
cd backend
cp .env.example .env
```

Default values in `backend/.env.example`:

```dotenv
PORT=3000
POSTGRES_PORT=5432
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/next_binge_watch
TEST_DATABASE_URL=postgresql://postgres:postgres@localhost:5432/next_binge_watch_test
TVMAZE_BASE_URL=https://api.tvmaze.com
TVMAZE_TIMEOUT_MS=5000
```

> **Note:** `DATABASE_URL` is required at backend startup and must use the `postgres://` or `postgresql://` protocol. If port `5432` is already in use on your machine, set `POSTGRES_PORT=5433` and update the port in `DATABASE_URL` and `TEST_DATABASE_URL` inside `backend/.env` — Docker Compose reads `backend/.env` automatically when running `npm run db:up`.

### 3. Start PostgreSQL 18.7 with Docker Compose

From `backend/`:

```bash
cd backend
npm run db:up
```

This starts a `postgres:18.7` container (`backend/compose.yaml`) with:
- Persistent named volume mounted at `/var/lib/postgresql`
- Automatic readiness health check (`pg_isready`)
- Development database: `next_binge_watch`
- Isolated test database: `next_binge_watch_test` (created by `backend/docker/postgres/init/01-create-test-db.sql`)

### 4. Run database migrations

Apply all pending `node-pg-migrate` migrations to the development database:

```bash
cd backend
npm run migrate:up
```

### 5. Run backend and frontend in development

Run both applications in separate terminals:

```bash
# Terminal 1 - Backend (http://localhost:3000)
cd backend
npm run dev

# Terminal 2 - Frontend (http://localhost:5173)
cd frontend
npm run dev
```

Verify backend & PostgreSQL connectivity at `GET http://localhost:3000/health`.

## Database & Migration Workflows (`backend/`)

All database commands run from `backend/`:

| Script | Description |
| --- | --- |
| `npm run db:up` | Start the PostgreSQL 18.7 container in detached mode (`docker compose up -d`). |
| `npm run db:down` | Stop and remove the container while preserving the named volume. |
| `npm run db:reset` | Destroy the volume and recreate fresh `next_binge_watch` and `next_binge_watch_test` databases. |
| `npm run db:test:reset` | Truncate all application tables in `next_binge_watch_test` (`TEST_DATABASE_URL`). |
| `npm run migrate:up` | Apply pending `node-pg-migrate` migrations to `DATABASE_URL`. |
| `npm run migrate:down` | Roll back the latest migration on `DATABASE_URL`. |
| `npm run migrate:redo` | Roll back and re-apply the latest migration on `DATABASE_URL`. |
| `npm run migrate:create -- <name>` | Scaffold a new timestamped TypeScript migration in `backend/migrations/`. |
| `npm run migrate:test:up` | Apply pending migrations to `TEST_DATABASE_URL`. |
| `npm run migrate:test:down` | Roll back the latest migration on `TEST_DATABASE_URL`. |

## Testing, Linting & Builds

### Backend

Ensure the PostgreSQL 18.7 container is running (`npm run db:up` in `backend/`). `npm test` automatically runs `migrate:test:up` against `TEST_DATABASE_URL` (`next_binge_watch_test`) so your development database (`next_binge_watch`) is never modified.

```bash
cd backend
npm test           # Migrate test DB and run Vitest with ≥ 80% coverage thresholds
npm run test:watch # Run Vitest in watch mode
npm run build      # Compile TypeScript into dist/
npm start          # Run compiled dist/index.js
```

### Frontend

```bash
cd frontend
npm test           # Run Vitest with ≥ 80% coverage thresholds
npm run lint       # Run ESLint
npm run typecheck  # Check TypeScript types
npm run build      # Typecheck and create production build in dist/
npm run preview    # Preview the production build locally
```

### End-to-End (Playwright)

Ensure the backend is built (`cd backend && npm run build`) and PostgreSQL 18.7 is running (`cd backend && npm run db:up`):

```bash
cd e2e
npx playwright test
```

Playwright automatically migrates and resets `TEST_DATABASE_URL` (`next_binge_watch_test`), starts an isolated backend on port `3051` and Vite on port `5181`, and runs all specs without modifying `next_binge_watch`.
