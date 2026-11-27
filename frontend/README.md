# NEXT BINGE WATCH — Frontend

React 19 + TypeScript + Vite + Tailwind CSS frontend for **NEXT BINGE WATCH**.

## Setup & Development

See the root [`README.md`](../README.md) for full repository setup (including PostgreSQL 18.7 and backend startup).

```bash
npm install
npm run dev
```

The development server runs at `http://localhost:5173` and proxies `/api/*` and `/health` to the backend (`http://localhost:3000` by default, or set `VITE_API_URL` for a separate backend origin).

## Scripts

```bash
npm test           # Run Vitest unit/component tests with ≥ 80% coverage thresholds
npm run lint       # Run ESLint
npm run typecheck  # Check TypeScript types
npm run build      # Typecheck and create a production build in dist/
npm run preview    # Serve the production build locally
```
