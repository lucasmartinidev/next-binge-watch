# Task 8.0: Playwright End-to-End Test Suite (`e2e/user-authentication.spec.ts`) and Full Regression Verification

## Overview

Add a shared Playwright authentication helper, update existing E2E specs so authenticated flows sign in cleanly while public discovery remains unauthenticated, implement `e2e/user-authentication.spec.ts` covering all end-to-end authentication, `bcryptjs` payload inspection, password change, admin CRUD, multi-user watchlist isolation, DEV Mode one-click login, bilingual `en`/`pt-BR`, and desktop/mobile accessibility scenarios (`E2E-01`–`E2E-05`), and verify all backend, frontend, and Playwright suites pass cleanly.

<skills>
### Skill compliance

No frontend React source components are created in this task; Playwright E2E specs live in root `e2e/`.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`, `folder-structure.md`) were read and apply:
- Keep E2E tests strictly in root `e2e/` (`e2e/user-authentication.spec.ts`, `e2e/helpers/authHelper.ts`), outside `frontend/` and `backend/`.
- Never hardcode literal secrets from `backend/.env` in E2E specs; read `FIRST_USER_ADMIN_USERNAME`, `FIRST_USER_ADMIN_EMAIL`, and `FIRST_USER_ADMIN_PASSWORD` from `backend/.env` via `dotenv` or environment in the test helper.
- Run full verification across `backend/` (`npm test`, `npm run build`), `frontend/` (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`), and `e2e/` (`npx playwright test`).
</rules>

<requirements>
- FR1–FR28 (full end-to-end verification across backend, frontend, and PostgreSQL)
</requirements>

## Subtasks

- [x] 8.1 Create `e2e/helpers/authHelper.ts` to read seeded admin credentials from `backend/.env` and provide reusable Playwright login/logout helpers without hardcoding passwords.
- [x] 8.2 Update existing E2E specs (`e2e/watchlist-recommendations.spec.ts`, `e2e/custom-watchlists.spec.ts`, `e2e/i18n-resilience-a11y.spec.ts`) to authenticate before testing private watchlist/list/preference flows while keeping `e2e/discovery-navigation.spec.ts` unauthenticated to verify public browsing.
- [x] 8.3 Implement `e2e/user-authentication.spec.ts` covering `E2E-01` (public discovery + `/login` redirect), `E2E-02` (username/email CI login, network payload assertion verifying zero plaintext password, session reload persistence, logout), `E2E-03` (password change & re-login), `E2E-04` (Admin creates `USER`, verifies full multi-user watchlist/list/locale isolation, role/status update, and delete), and `E2E-05` (localhost DEV Mode one-click login, `en`/`pt-BR`, `375px` mobile & `1280px` desktop responsive/a11y checks).
- [x] 8.4 Run full regression checks: `cd backend && npm test && npm run build`, `cd frontend && npm test && npm run lint && npm run typecheck && npm run build`, and `cd e2e && npx playwright test`, confirming 100% pass and ≥ 80% coverage across all suites.

## Implementation details

Follow `techspec.md` sections:
- **Testing approach → E2E tests** (`E2E-01`–`E2E-05`)
- **Integration points** (Cross-origin Playwright `localhost:5181` → `localhost:3051` HttpOnly cookie flow)

## Related acceptance criteria

- AC-01
- AC-02
- AC-03
- AC-04
- AC-05
- AC-06
- AC-07
- AC-08
- AC-09

## Task tests

### Unit tests (if applicable)

Verified via full `backend/` and `frontend/` Vitest regression suites.

### Integration tests (if applicable)

Verified via full `backend/` PostgreSQL integration suite (`TEST_DATABASE_URL`).

### E2E tests (if applicable)

- [x] E2E-01 - Public discovery unauthenticated + redirect to `/login` on protected routes
- [x] E2E-02 - Standard login (username & email CI), network payload check (no plaintext), logout
- [x] E2E-03 - Self-service password change and re-login with new password
- [x] E2E-04 - Admin creates `USER`, verifies multi-user watchlist isolation, updates role/status/deletes
- [x] E2E-05 - Localhost DEV Mode one-click login + `en`/`pt-BR` + desktop/mobile responsive/a11y

## Relevant files

- `e2e/helpers/authHelper.ts`
- `e2e/user-authentication.spec.ts`
- `e2e/discovery-navigation.spec.ts`
- `e2e/watchlist-recommendations.spec.ts`
- `e2e/custom-watchlists.spec.ts`
- `e2e/i18n-resilience-a11y.spec.ts`
- `e2e/playwright.config.ts`
