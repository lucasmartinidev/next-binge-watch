import { defineConfig } from '@playwright/test';

const BACKEND_PORT = 3051;
const FRONTEND_PORT = 5181;

export default defineConfig({
  testDir: '.',
  testMatch: '*.spec.ts',
  timeout: 30_000,
  workers: 1,
  use: {
    baseURL: `http://localhost:${FRONTEND_PORT}`,
    trace: 'on-first-retry',
  },
  webServer: [
    {
      command: `npm run migrate:test:up && npm run db:test:reset && PORT=${BACKEND_PORT} node -e "require('./scripts/preload-env.cjs'); if (!process.env.TEST_DATABASE_URL) { throw new Error('TEST_DATABASE_URL is required'); } process.env.DATABASE_URL = process.env.TEST_DATABASE_URL; require('./dist/index.js');"`,
      cwd: '../backend',
      url: `http://localhost:${BACKEND_PORT}/health`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
    {
      command: `VITE_API_URL=http://localhost:${BACKEND_PORT} npx vite --port ${FRONTEND_PORT}`,
      cwd: '../frontend',
      url: `http://localhost:${FRONTEND_PORT}`,
      reuseExistingServer: false,
      timeout: 30_000,
    },
  ],
});
