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
      command: `rm -f ../backend/data/e2e-test.db* && PORT=${BACKEND_PORT} DATABASE_URL=file:./data/e2e-test.db npm run start`,
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
