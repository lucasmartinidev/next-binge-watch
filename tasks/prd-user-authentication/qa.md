# QA report - User Authentication & Multi-User Watchlists

Browser-tool evidence is saved in `tasks/prd-user-authentication/evidences/`.

## Summary

- Date: 2026-11-28
- Status: **APPROVED**
- Total acceptance criteria: 9 (`AC-01`–`AC-09`)
- Acceptance criteria met: 9 / 9
- Bugs found: 1 (`BUG-01` — fixed and re-verified)

## Verified acceptance criteria

| ID    | Acceptance criterion | Test cases | Status | Evidence |
| ----- | -------------------- | ---------- | ------ | -------- |
| AC-01 | Reversible PostgreSQL migration seeds initial `ADMIN` from `backend/.env` with UUID & 3 primary lists and migrates all legacy watchlist/list/episode/preference records | `IT-01`, `IT-06` | PASS | [04-watchlist-admin-authenticated.png](evidences/04-watchlist-admin-authenticated.png) |
| AC-02 | Unauthenticated visitors browse Search, Series Profile, and Person Profile cleanly without personal badges; `/watchlist` and protected routes redirect to `/login` (`401` on private APIs) | `UT-09`, `UT-14`, `IT-04`, `E2E-01` | PASS | [01-home-public-desktop.png](evidences/01-home-public-desktop.png), [02-login-dev-mode-desktop.png](evidences/02-login-dev-mode-desktop.png) |
| AC-03 | Login accepts case-insensitive username or email, hashes password with `bcryptjs` on frontend & backend (zero plaintext in payloads), persists session via HttpOnly cookie across reload, and signs out cleanly | `UT-02`, `UT-03`, `UT-04`, `UT-10`, `UT-11`, `IT-02`, `E2E-02` | PASS | [02-login-dev-mode-desktop.png](evidences/02-login-dev-mode-desktop.png), [03-login-validation-error.png](evidences/03-login-validation-error.png), [04-watchlist-admin-authenticated.png](evidences/04-watchlist-admin-authenticated.png) |
| AC-04 | Authenticated user changes password with current/new/confirm validation (8–60 chars), two-stage `bcryptjs` hashing, revokes other sessions while keeping active session, and logs in with new password | `UT-03`, `UT-05`, `UT-10`, `UT-12`, `IT-03`, `E2E-03` | PASS | [07-change-password-desktop.png](evidences/07-change-password-desktop.png), [09-change-password-ptbr-mobile-375.png](evidences/09-change-password-ptbr-mobile-375.png) |
| AC-05 | Only `ADMIN` can list and create users (UUID, unique CI username 1–39 `[A-Za-z0-9-]`, unique CI email ≤ 254, role `ADMIN`/`USER`, auto-provisioned 3 primary lists); `USER` receives `403` / forbidden view | `UT-01`, `UT-02`, `UT-07`, `UT-09`, `UT-13`, `UT-14`, `IT-04`, `IT-05`, `E2E-04` | PASS | [05-admin-users-desktop.png](evidences/05-admin-users-desktop.png), [06-admin-create-user-modal.png](evidences/06-admin-create-user-modal.png), [08-user-role-admin-forbidden.png](evidences/08-user-role-admin-forbidden.png) |
| AC-06 | `ADMIN` changes role, deactivates/reactivates (immediately revoking sessions), and deletes other users after confirmation; self-lockout and last-active-admin guards block unsafe actions | `UT-07`, `UT-08`, `UT-13`, `IT-05`, `E2E-04` | PASS | [05-admin-users-desktop.png](evidences/05-admin-users-desktop.png), [11-admin-users-ptbr-mobile-375.png](evidences/11-admin-users-ptbr-mobile-375.png), [12-admin-delete-confirm-mobile.png](evidences/12-admin-delete-confirm-mobile.png) |
| AC-07 | Complete per-user isolation across primary/custom lists, tracked series, watched episodes, recommendations, and language preferences | `UT-14`, `IT-06`, `E2E-04` | PASS | [04-watchlist-admin-authenticated.png](evidences/04-watchlist-admin-authenticated.png), [08-user-role-admin-forbidden.png](evidences/08-user-role-admin-forbidden.png) |
| AC-08 | Login DEV Mode lists registered users with one-click login strictly in local development (`localhost`) and is double-locked off in production / non-localhost | `UT-06`, `UT-09`, `UT-11`, `IT-07`, `E2E-05` | PASS | [02-login-dev-mode-desktop.png](evidences/02-login-dev-mode-desktop.png), [10-login-dev-ptbr-mobile-375.png](evidences/10-login-dev-ptbr-mobile-375.png) |
| AC-09 | Full bilingual (`en` / `pt-BR`) localization, WCAG 2.1 Level AA semantics/labels/contrast, and zero horizontal overflow on desktop (`1280px`) and mobile (`375px`) | `UT-11`, `UT-12`, `UT-13`, `UT-14`, `E2E-05` | PASS | [09-change-password-ptbr-mobile-375.png](evidences/09-change-password-ptbr-mobile-375.png), [10-login-dev-ptbr-mobile-375.png](evidences/10-login-dev-ptbr-mobile-375.png), [11-admin-users-ptbr-mobile-375.png](evidences/11-admin-users-ptbr-mobile-375.png) |

## Executed E2E tests

| ID | Flow | Result | Notes |
| -- | ---- | ------ | ----- |
| E2E-01 | Public discovery unauthenticated + `/watchlist` redirect to `/login` | PASS | Verified in `e2e/user-authentication.spec.ts` and live QA (`5162` / `3062`) |
| E2E-02 | Standard login (CI email), zero plaintext password in HTTP payload, reload persistence, logout | PASS | Verified `$2` bcryptjs hash in POST payload and `leakedPlaintext: []` |
| E2E-03 | Self-service password change and re-login with new password | PASS | Verified password change, sign-out, login with updated password, and restore |
| E2E-04 | Admin creates `USER`, verifies multi-user watchlist isolation, deletes user | PASS | Verified `Admin Only List` invisible to `e2e-viewer`, cascade delete via ConfirmDialog |
| E2E-05 | Localhost DEV Mode one-click login, `en`/`pt-BR`, and `375px` mobile responsive/a11y | PASS | Verified 0 overflow, 0 console errors, 0 unlabeled controls |
| Regression | Pre-existing E2E specs (`discovery-navigation`, `watchlist-recommendations`, `custom-watchlists`, `i18n-resilience-a11y`) | PASS | 12 / 12 Playwright tests passed (`24.7s`) |

## Automated tests and coverage

| Layer | ID | Result | Validation/command | Notes |
| ----- | -- | ------ | ------------------ | ----- |
| Backend Unit & Integration | `UT-01`–`UT-09`, `IT-01`–`IT-07` | PASS | `cd backend && npm test && npm run build` | 32 / 32 test files passed; TypeScript build 0 errors |
| Frontend Unit & Component | `UT-10`–`UT-14` | PASS | `cd frontend && npm test && npm run lint && npm run typecheck && npm run build` | 23 / 23 test files (51 / 51 tests) passed; ESLint & `tsc -b` 0 errors |
| Playwright E2E | `E2E-01`–`E2E-05` + regressions | PASS | `cd e2e && npx playwright test` | 12 / 12 E2E tests passed |
| Live Browser QA | Visual, a11y, console, network payload audit | PASS | Isolated backend (`3062`) + frontend (`5162`) | 12 screenshots saved; 0 console errors; 0 plaintext leaks; 0 overflow |

- Coverage (target ≥ 80% across all metrics):
  - **Backend:** 93.47% statements / 80.01% branches / 96.78% functions / 96.59% lines (**PASS**)
  - **Frontend:** 89.53% statements / 80.12% branches / 86.61% functions / 92.04% lines (**PASS**)

## Accessibility

Checked across all 10 audited screens (`1280×800` desktop and `375×812` mobile, `en` and `pt-BR`) in live Chromium:
- [x] Keyboard navigation (Tab, Enter, Esc to close modals via `useEscapeKey`, visible focus rings)
- [x] Interactive elements have descriptive labels (`unlabeledButtons: 0` across all screens)
- [x] Images have appropriate alternative text (`missingAlt: 0` across all screens)
- [x] Adequate color contrast (Cyber-Neon high-contrast accents, amber DEV badge with dark slate text, opaque modal backdrops `bg-slate-950/90`)
- [x] Forms have labels associated with fields (`unlabeledInputs: 0` across all screens)
- [x] Error messages are clear and accessible (`role="alert"`, `aria-invalid`, `aria-describedby`, localized in `en` and `pt-BR`)
- [x] Fonts have an appropriate size and wrap safely without horizontal overflow at `375px` (`overflow: false` on all screens)

## Bugs found and fixed

| ID | Description | Severity | Status | Fix | Regression test | Evidence |
| -- | ----------- | -------- | ------ | --- | --------------- | -------- |
| BUG-01 | `SeriesProfileView.test.tsx` flaked intermittently when `I18nContext` started in `'en'` before resolving mocked `pt-BR` preference, consuming the first `getSeriesProfile` mock prematurely | Medium | Fixed | Seeded `window.localStorage.setItem('nbw_locale', 'pt-BR')` in `beforeEach` and cleared in `afterEach` in `frontend/src/views/SeriesProfileView.test.tsx` | `frontend/src/views/SeriesProfileView.test.tsx` (2 / 2 passing deterministically) | `cd frontend && npm test` (23 / 23 files passed) |

## Conclusion

All 9 acceptance criteria (`AC-01`–`AC-09`), all TechSpec unit/integration/E2E test cases (`UT-01`–`UT-14`, `IT-01`–`IT-07`, `E2E-01`–`E2E-05`), coverage thresholds (≥ 80% on backend and frontend), accessibility checks, responsive checks, and live Chromium visual inspections passed with zero unresolved defects. Isolated QA services (`3062`, `5162`) and PostgreSQL container were cleanly shut down. **QA Verdict: APPROVED.**
