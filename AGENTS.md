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

- Role: English-language watch list for movies and series that retrieves titles and artists data from the backend and displays all type of content and also a backend status.
- Technology: React 19, TypeScript, Vite, Tailwind CSS, and ESLint.
- Directory: `frontend/`.
- Development URL: `http://localhost:5173` (Vite's default port; Vite arguments can override it).
- Set `VITE_API_URL` when the backend is hosted on a different origin outside the Vite development server.

### Required Skill

Before implementing, fixing, refactoring, or reviewing any frontend code, load the [`react`](.agents/skills/react/SKILL.md) skill (`$react`) and follow its rules and references. This applies to frontend components, hooks, backend integration, accessibility, styling, and tests.

## Backend

- Role: HTTP API and application server, including the search endpoint.
- Technology: Node.js, Express 5, TypeScript, CORS, and dotenv.
- Directory: `backend/`.
- Default URL: `http://localhost:3000`.
- Port: set by `process.env.PORT`; defaults to `3000` when `PORT` is not set.
- Health check: `GET /health`.

## Prerequisites

Node.js and npm are required. Each application has its own `package-lock.json`; install dependencies separately in each directory.

## Installation

```bash
cd frontend
npm install

cd ../backend
npm install
```

## Development

Run the frontend and backend in separate terminals:

```bash
# Terminal 1
cd backend
npm run dev

# Terminal 2
cd frontend
npm run dev
```

The backend runs at `http://localhost:3000` and the frontend at `http://localhost:5173`. The frontend periodically checks the backend through `/health`

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

```bash
cd backend
npm test           # Run Vitest with coverage thresholds
npm run build      # Compile TypeScript into dist/
npm start          # Run dist/index.js; requires a prior build
```

For development, run `npm run dev`. It uses Nodemon and `tsx` to restart the server when files under `src/` change.

## Change Checklist

- Preserve the separation between `frontend/` and `backend/`; install dependencies and run scripts from each application's directory.
- Keep frontend API requests directed to the backend. Update the Vite proxy or `VITE_API_URL` when changing the backend address.
- Before completing frontend changes, run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` from `frontend/`.
- Before completing backend changes, run `npm test` and `npm run build` from `backend/`.
- Keep all user-facing dashboard text and API error messages in English.

<critical>ALWAYS FOLLOW THE TESTING RULES IN .agents/rules/tests.md AND ADD TESTS FOR THE CODE YOU PRODUCE.</critical>
