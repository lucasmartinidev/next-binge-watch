# QA report - PostgreSQL 18.7 Migration, `node-pg-migrate`, Docker Compose & Documentation

Browser-tool evidence is saved in `tasks/prd-postgresql-migration/evidences/`.

## Summary

- Date: 2026-11-26
- Status: **APPROVED**
- Total acceptance criteria: 11
- Acceptance criteria met: 11
- Bugs found: 0

## Verified acceptance criteria

| ID | Acceptance criterion | Test cases | Status | Evidence |
| --- | --- | --- | --- | --- |
| AC-01 | `@libsql/client` and SQLite file-handling logic completely removed; PostgreSQL 18.7 is the sole database engine | UT-01, IT-02 | PASS | `grep` audit confirmed 0 SQLite/libsql runtime deps or code; `SELECT version()` confirmed `PostgreSQL 18.7 (Debian 18.7-1.pgdg13+5)` |
| AC-02 | Docker Compose starts PostgreSQL 18.7 healthy, accepts connections, and persists data across container restarts | IT-01 | PASS | `backend/compose.yaml` booted healthy on isolated port `5433`, created `next_binge_watch` & `next_binge_watch_test`, and retained sentinel row across `docker compose restart postgres` |
| AC-03 | `node-pg-migrate` `up`, `down`, re-`up`, and `create` succeed cleanly on PostgreSQL 18.7 | IT-01 | PASS | Verified `migrate:test:up` → `\dt`/`\di` (3 tables + 2 custom indexes) → `migrate:test:down` (0 leftover tables) → `migrate:test:up` + `migrate:create` scaffold |
| AC-04 | Watchlist CRUD, episode/season toggles, cascade delete, `pt-BR`/`en` preferences, and Next Binge recommendations persist in PostgreSQL with full API parity | UT-02, UT-04, UT-05, IT-02, IT-03, IT-04, E2E-01, E2E-02 | PASS | [02-watchlist-populated-pg.png](evidences/02-watchlist-populated-pg.png), [03-series-profile-ptbr.png](evidences/03-series-profile-ptbr.png) + direct `psql` verification (`watchlist_items`, `watched_episodes`, `user_preferences`) |
| AC-05 | `GET /health` returns HTTP `200` (`database: "ok"`) when PG reachable and HTTP `503` (`database: "error"`) when PG stopped, reflected in UI | UT-03, IT-05, E2E-03 | PASS | [01-home-desktop.png](evidences/01-home-desktop.png) (`API Online`, HTTP 200) and [04-health-degraded-pg-down.png](evidences/04-health-degraded-pg-down.png) (`API Offline`, HTTP 503 with PG stopped, zero leaked SQL/secrets) |
| AC-06 | `SIGINT`/`SIGTERM` closes active PostgreSQL pool connections cleanly and exits with code `0` | UT-03 | PASS | Live `kill -TERM` test against `dist/index.js` on port `3052` logged graceful shutdown and exited cleanly (`SIGTERM_EXIT_CODE=0`) |
| AC-07 | Backend `npm test` passes with ≥ 80% coverage across all metrics and leaves local dev DB untouched | UT-01–UT-05, IT-02–IT-06 | PASS | 47/47 backend tests passed (`93.97%` stmts, `80.86%` branches, `97.57%` funcs, `94.14%` lines); `dev_sentinel` row in `next_binge_watch` remained `untouched` |
| AC-08 | Playwright E2E suite runs against isolated `next_binge_watch_test` without SQLite files or dev-DB mutation | E2E-01, E2E-02, E2E-03, IT-06 | PASS | 4/4 Playwright specs passed in 10.0s against PostgreSQL 18.7; `e2e/playwright.config.ts` uses `migrate:test:up` + `db:test:reset` |
| AC-09 | Copying `backend/.env.example` to `.env`, starting Compose, and running documented `backend/package.json` scripts succeed cleanly | UT-01, IT-01 | PASS | Verified `db:up`, `migrate:up`/`down`/`up`, `npm test`, `npm run build`, and `db:down` end-to-end |
| AC-10 | Root `README.md`, `AGENTS.md`, `frontend/README.md`, and `backend/.env.example` accurately document PostgreSQL 18.7, `backend/compose.yaml`, `node-pg-migrate`, and preserve no root `package.json` | Documentation audit | PASS | Confirmed `NO_ROOT_PACKAGE_JSON_OK` and 0 stale SQLite setup instructions across all active docs/configs |
| AC-11 | Frontend `npm test`, `lint`, `typecheck`, and `build` pass with 0 errors/warnings and ≥ 80% coverage | UT-06, E2E-03 | PASS | 22/22 frontend tests passed (`95.59%` stmts, `85.53%` branches, `96.55%` funcs, `96.27%` lines), 0 ESLint issues, clean `tsc -b` + `vite build`, [05-mobile-375px.png](evidences/05-mobile-375px.png) |

## Executed E2E tests

| ID | Flow | Result | Notes |
| --- | --- | --- | --- |
| E2E-01 | Discovery, scope filtering, Series ↔ Person cross-navigation & TVmaze attribution (`discovery-navigation.spec.ts`) | PASS | Passed in 3.4s against PostgreSQL 18.7 (`next_binge_watch_test`) |
| E2E-02 | Watchlist persistence across reload, episode/season tracking & Next Binge recommendations (`watchlist-recommendations.spec.ts`) | PASS | Passed in 1.2s; additionally verified live in Chromium ([02-watchlist-populated-pg.png](evidences/02-watchlist-populated-pg.png), [03-series-profile-ptbr.png](evidences/03-series-profile-ptbr.png)) |
| E2E-03 | Locale detection/persistence, health indicator, retry recovery, responsive layout & keyboard navigation (`i18n-resilience-a11y.spec.ts`) | PASS | Both specs passed (1.2s + 845ms); degraded PG outage verified live ([04-health-degraded-pg-down.png](evidences/04-health-degraded-pg-down.png)) |

## Automated tests and coverage

| Layer | ID | Result | Validation/command | Notes |
| --- | --- | --- | --- | --- |
| Backend Unit & Integration | UT-01–UT-05, IT-02–IT-05 | PASS | `cd backend && npm test && npm run build` | 19 test files, 47/47 tests passed; `tsc` build clean |
| Migration Lifecycle | IT-01 | PASS | `cd backend && npm run migrate:test:up && npm run migrate:test:down && npm run migrate:test:up` | Verified cleanly against PostgreSQL 18.7 (`next_binge_watch_test`) |
| Dev-DB Isolation | IT-06 | PASS | Seeded `dev_sentinel` in `next_binge_watch`, ran `backend` `npm test` + Playwright E2E, confirmed `untouched` | Zero cross-database mutation |
| Frontend Unit & Component | UT-06 | PASS | `cd frontend && npm test && npm run lint && npm run typecheck && npm run build` | 10 test files, 22/22 tests passed; 0 ESLint errors/warnings; production bundle built in 1.94s |
| End-to-End (Playwright) | E2E-01–E2E-03 | PASS | `cd e2e && npx playwright test` | 4/4 specs passed in 10.0s against PostgreSQL 18.7 |

- Coverage (target ≥ 80% on all 4 metrics):
  - **Backend:** **93.97%** statements, **80.86%** branches, **97.57%** functions, **94.14%** lines
  - **Frontend:** **95.59%** statements, **85.53%** branches, **96.55%** functions, **96.27%** lines

## Accessibility

Checked across live Chromium screens (`home-desktop`, `series-profile-ptbr`, `watchlist-populated`, `home-mobile-375px`) on isolated ports (`3052` / `5182`):

- [x] Keyboard navigation (Tab moves focus cleanly to interactive navigation links/controls; Enter submits search; Escape/focus rings visible)
- [x] Interactive elements have descriptive labels (`unlabeledControls: 0` across all 4 audited screens)
- [x] Images have appropriate alternative text (`missingAlt: 0` across all 4 audited screens)
- [x] Adequate color contrast (Cyber-Neon high-contrast text/badges verified visually on all 5 screenshots, including error/offline state)
- [x] Forms have labels associated with fields (`inputsWithoutLabel: 0`, including `#watch-status-select` and search input)
- [x] Error messages are clear and accessible (`An unexpected error occurred.` + `Try again` button and `API Offline` indicator during PG outage; zero console/page errors during normal operation)
- [x] Fonts have an appropriate size (`bodyFontSize: 16px`, zero horizontal overflow `overflowX: false` at both 1280px desktop and 375px mobile)

## Bugs found and fixed

| ID | Description | Severity | Status | Fix | Regression test | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| — | No bugs found during QA validation. | — | — | — | — | — |

## Conclusion

QA is **APPROVED**. All 11 acceptance criteria (`AC-01`–`AC-11`), all TechSpec test cases (`UT-01`–`UT-06`, `IT-01`–`IT-06`, `E2E-01`–`E2E-03`), live PostgreSQL 18.7 restart persistence, `SIGTERM` graceful shutdown, PostgreSQL outage `/health` 503 degradation, accessibility/responsiveness checks, and ≥ 80% coverage thresholds passed with 0 defects. All temporary QA processes and containers (`5433`, `3052`, `5182`, `3051`, `5181`) were shut down cleanly with ports verified released.
