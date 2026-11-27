# Project Context

## Coding Standards

See [`.agents/rules/code-standards.md`](.agents/rules/code-standards.md) for coding standards and examples that apply to the frontend and backend.

See [`.agents/rules/javascript-typescript.md`](.agents/rules/javascript-typescript.md) for JavaScript and TypeScript rules, including `const`, strict comparisons, typing, arrow functions, ternaries, and linting.

For Node.js-specific rules on asynchronous code, the event loop, environment variables, shutdown, logging, lock files, and module dependencies, see [`.agents/rules/node.md`](.agents/rules/node.md).

For React-specific rules on components, hooks, accessibility, and styling, see the [`react`](.agents/skills/react/SKILL.md) skill.

## Testing Rules

See [`.agents/rules/tests.md`](.agents/rules/tests.md) for automated testing, minimum coverage, the FIRST principle, the testing pyramid, Vitest, Playwright, and E2E test organization.

This repository contains two independent applications: a frontend and a backend. Run commands from the corresponding application directory; there is no root `package.json`.

## Project Structure

See [`.agents/rules/folder-structure.md`](.agents/rules/folder-structure.md) for frontend, backend, and test folder and file organization.

## Frontend

- Role: Bilingual (`en` and `pt-BR`) watch list and discovery UI for TV series and people that retrieves catalog and tracking data exclusively from the backend and displays live backend connectivity status.
- Technology: React 19, TypeScript, Vite, Tailwind CSS, React Router, and ESLint.
- Directory: `frontend/`.
- Development URL: `http://localhost:5173` (Vite's default port; Vite arguments can override it).
- Set `VITE_API_URL` when the backend is hosted on a different origin outside the Vite development server.

### Required Skill

Before implementing, fixing, refactoring, or reviewing any frontend code, load the [`react`](.agents/skills/react/SKILL.md) skill (`$react`) and follow its rules and references. This applies to frontend components, hooks, backend integration, accessibility, styling, and tests.

## Backend

- Role: HTTP API, TVmaze BFF proxy/cache, watchlist and episode tracker, recommendations engine, and preferences persistence server.
- Technology: Node.js, Express 5, TypeScript, PostgreSQL 18.7 (`pg`), `node-pg-migrate`, CORS, and dotenv.
- Directory: `backend/`.
- Default URL: `http://localhost:3000`.
- Port: set by `process.env.PORT`; defaults to `3000` when `PORT` is not set.
- Database: PostgreSQL 18.7 provisioned locally via `backend/compose.yaml` (`next_binge_watch` for dev, `next_binge_watch_test` for integration/E2E tests); schema managed exclusively via TypeScript migrations in `backend/migrations/`.
- Required environment variable: `DATABASE_URL` (`postgres://` or `postgresql://`); `TEST_DATABASE_URL` targets the isolated test database.
- Health check: `GET /health` (probes live PostgreSQL connectivity via `SELECT 1`).

## Prerequisites

Node.js, npm, and Docker (with Docker Compose v2+) are required. Each application has its own `package-lock.json`; install dependencies separately in each directory.

## Installation

```bash
cd frontend
npm install

cd ../backend
npm install
cp .env.example .env
```

## Development

Start PostgreSQL 18.7, apply migrations, and run the frontend and backend in separate terminals:

```bash
# Terminal 1 - Database, migrations, and backend
cd backend
npm run db:up
npm run migrate:up
npm run dev

# Terminal 2 - Frontend
cd frontend
npm run dev
```

The backend runs at `http://localhost:3000`, the frontend at `http://localhost:5173`, and PostgreSQL 18.7 at `localhost:5432` (override with `POSTGRES_PORT` if `5432` is already in use). The frontend periodically checks the backend through `/health`.

To use another backend port, set `PORT`, for example:

```bash
cd backend
PORT=3001 npm run dev
```

When changing the backend port, update the Vite proxy target in `frontend/vite.config.ts`. For a deployed frontend and backend on separate origins, set `VITE_API_URL` for the frontend build.

## Tests, Validation, and Builds

### Frontend

```bash
cd frontend
npm test           # Run Vitest with coverage thresholds
npm run lint       # Run ESLint
npm run typecheck  # Check TypeScript types
npm run build      # Typecheck and create a production build in dist/
npm run preview    # Serve the production build locally
```

### Backend

Ensure PostgreSQL 18.7 is running (`npm run db:up`) before running backend integration tests:

```bash
cd backend
npm run db:up                   # Start PostgreSQL 18.7 (backend/compose.yaml)
npm run db:down                 # Stop PostgreSQL 18.7 container (preserves volume)
npm run db:reset                # Recreate fresh dev & test PostgreSQL volumes
npm run db:test:reset           # Truncate tables in TEST_DATABASE_URL
npm run migrate:up              # Apply pending migrations to DATABASE_URL
npm run migrate:down            # Roll back latest migration on DATABASE_URL
npm run migrate:redo            # Roll back and re-apply latest migration
npm run migrate:create -- name  # Scaffold a new TypeScript migration in migrations/
npm run migrate:test:up         # Apply pending migrations to TEST_DATABASE_URL
npm run migrate:test:down       # Roll back latest migration on TEST_DATABASE_URL
npm test                        # Run migrate:test:up and Vitest with ≥ 80% coverage
npm run build                   # Compile TypeScript into dist/
npm start                       # Run dist/index.js; requires a prior build
```

For development, run `npm run dev`. It uses Nodemon and `tsx` to restart the server when files under `src/` change.

### End-to-End Tests (`e2e/`)

Ensure `backend/` is built (`npm run build`) and PostgreSQL 18.7 is running (`npm run db:up`):

```bash
cd e2e
npx playwright test
```

Playwright migrates and truncates `TEST_DATABASE_URL` (`next_binge_watch_test`) automatically without touching the development database.

## Change Checklist

- Preserve the separation between `frontend/` and `backend/`; install dependencies and run scripts from each application's directory (never add a root `package.json`).
- Keep frontend API requests directed to the backend. Update the Vite proxy or `VITE_API_URL` when changing the backend address.
- Manage all PostgreSQL schema changes through reversible `node-pg-migrate` migrations in `backend/migrations/`.
- Before completing frontend changes, run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` from `frontend/`.
- Before completing backend changes, run `npm test` and `npm run build` from `backend/`.
- Keep all user-facing text and API error messages localized cleanly (`en` default and `pt-BR` per PRD).

<critical>ALWAYS FOLLOW THE TESTING RULES IN .agents/rules/tests.md AND ADD TESTS FOR THE CODE YOU PRODUCE.</critical>
