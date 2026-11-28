# Code review report - User Authentication & Multi-User Watchlists

## Summary

- Date: 2026-11-28
- Branch: `main`
- Status: APPROVED

## Rule compliance

| Rule | Status | Notes |
| --- | --- | --- |
| Coding standards (`code-standards.md`) — file length ≤ 100 lines (non-test `.ts`/`.tsx`) | OK | Initial audit found 10 backend files > 100 lines; all refactored cleanly into cohesive helpers (`registerApiRouters.ts`, `userRowMapper.ts`, `inMemorySessionRepository.ts`, `authMigrationSql.ts`). Final audit: **0** files > 100 lines across `backend/src`, `backend/migrations`, and `frontend/src`. |
| Coding standards (`code-standards.md`) — function/component length ≤ 30 lines, ≤ 3 params, 0 blank lines inside functions | OK | Initial audit found 14 functions > 30 lines and 4 frontend files with blank lines inside functions; all refactored (including shared `useRequireAuthAction` hook). Final audit: **0** functions > 30 lines, **0** blank lines inside functions. Sole > 3-param function is pre-existing Express 4-arg error handler `backend/src/routes/errorMiddleware.ts:41` (framework-mandated signature). |
| JavaScript/TypeScript (`javascript-typescript.md`) — strict typing, zero `any`, `const`, strict comparisons, clean ESLint | OK | Zero `any`, zero inline comments, ESLint 0 errors/warnings (`frontend/npm run lint`), `tsc -b` 0 errors (`frontend/npm run typecheck`), `tsc` 0 errors (`backend/npm run build`). |
| Node.js (`node.md`) — async I/O & crypto, fail-fast env validation, structured logging, no secrets in code | OK | Zero `*Sync` calls (`bcryptjs` uses async `genSalt`/`hash`/`compare` throughout); `authConfig.ts` validates required env vars on startup; structured JSON logging without sensitive credentials. |
| React 19 (`react` skill) — no `{...props}` spreading, semantic HTML & ARIA, clean hooks/effects, Tailwind CSS | OK | Zero JSX prop spreading; accessible labels, `role="alert"`, `aria-invalid`, `aria-describedby`, `aria-busy`, and keyboard Escape handling on modals; unidirectional `view → components/hooks → services → backend`. |
| Testing (`tests.md`) — FIRST principles, ≥ 80% coverage, unit + integration + E2E | OK | Backend 93.59% stmts / 80.48% branch / 96.80% funcs / 96.44% lines; Frontend 89.91% stmts / 81.01% branch / 86.70% funcs / 92.45% lines; Playwright E2E 12/12 passing. |
| Folder structure (`folder-structure.md`) & separation of `frontend/` and `backend/` | OK | No root `package.json`; independent lock files; schema changes exclusively via reversible `node-pg-migrate` migration (`1764400000000_user-authentication.ts`); bilingual `en` + `pt-BR` messages complete. |

## TechSpec alignment

| Technical decision | Implemented | Notes |
| --- | --- | --- |
| Two-stage async `bcryptjs` protocol (`POST /api/auth/challenge` → client hash → server hash/verify) | YES | Plaintext passwords never traverse HTTP payloads; deterministic HMAC-SHA256 fake salt + dummy verification prevent account enumeration. |
| HttpOnly `SameSite=Lax` cookie (`nbw_session`, 7-day TTL) + PostgreSQL `user_sessions` (SHA-256 hashed tokens) | YES | Implemented in `authCookies.ts`, `sessionRepository.ts`, and `authService.ts`; `Secure` enabled in production. |
| Role-based access control (`ADMIN` / `USER`) & admin user management (`/api/users`) | YES | Only `ADMIN` can list, create, update role/active status, or delete users; self-lockout and last-active-admin invariants enforced; deactivation revokes active sessions. |
| Self-service password change (`POST /api/auth/change-password`) | YES | Verifies current password hash, rejects unchanged password, updates `client_salt` + `password_hash`, and revokes all other sessions while preserving the active session. |
| Double-locked localhost DEV Mode (`/api/auth/dev/users`, `/api/auth/dev/login`, `DevLoginPanel`) | YES | Backend enforces `NODE_ENV !== 'production'` AND `localhost`/`127.0.0.1` host+origin; frontend enforces `import.meta.env.DEV` AND `localhost`/`127.0.0.1`. |
| Reversible multi-user PostgreSQL migration & initial `ADMIN` seed from `FIRST_USER_ADMIN_*` | YES | `1764400000000_user-authentication.ts` creates `users`/`user_sessions`, seeds initial `ADMIN`, backfills `user_id` ownership and composite PK/FKs across all 6 user-owned tables, and cleanly rolls back in `down()`. |
| Multi-user isolation across watchlists, episodes, custom lists, and preferences | YES | All private routes guarded by `requireAuth` and scoped by `req.auth.user.id`; public discovery endpoints (`search`, `series`, `people`, `next-binge`) work unauthenticated while omitting personal badges. |
| Frontend `AuthProvider`, route guards (`ProtectedRoute`, `AdminRoute`), per-user i18n, and bilingual UI | YES | `AuthProvider` wraps `I18nProvider`; unauthenticated users redirected to `/login` with return path; `en` and `pt-BR` fully supported. |

## Verified tasks

| Task | Status | Notes |
| --- | --- | --- |
| 1.0 Backend Dependencies, Auth Configuration, Localized Errors, and Multi-User PostgreSQL Migration | COMPLETE | 8/8 subtasks checked; migration up/down and env validation tested. |
| 2.0 Backend Auth & User Repositories, Two-Stage `bcryptjs` Password Service, Validation, and Core Services | COMPLETE | 15/15 subtasks checked; unit tests cover validation, `PasswordService`, `AuthService`, `UserManagementService`. |
| 3.0 Backend Multi-User Ownership Scoping Across Existing Repositories and Domain Services | COMPLETE | 7/7 subtasks checked; all repositories/services scoped by `userId`. |
| 4.0 Backend Auth Middleware, Cookie Helpers, Auth/User HTTP Routes, CORS, and Integration Tests | COMPLETE | 13/13 subtasks checked; full PostgreSQL HTTP integration suite passing. |
| 5.0 Frontend `bcryptjs` Client, Auth/User Services, `AuthContext`, Route Guards, Per-User i18n, and Header Account Menu | COMPLETE | 8/8 subtasks checked; services, password hasher, and layout/auth controls verified. |
| 6.0 Frontend Login (+ Localhost DEV Mode), Change Password View, and Public Discovery Auth Prompts | COMPLETE | 7/7 subtasks checked; `LoginView`, `ChangePasswordView`, `DevLoginPanel`, and `useRequireAuthAction` verified. |
| 7.0 Frontend Admin User Management View (`/admin/users`), Role/Status Controls, and Create/Delete User Modals | COMPLETE | 6/6 subtasks checked; `AdminUsersView`, `UserTable`, `UserRow`, `CreateUserModal` verified. |
| 8.0 Playwright End-to-End Test Suite (`e2e/user-authentication.spec.ts`) and Full Regression Verification | COMPLETE | 9/9 subtasks checked; 12/12 E2E tests passing across all suites. |

## Tests

- Total tests: **143** (80 backend Vitest + 51 frontend Vitest + 12 Playwright E2E)
- Passing: **143** (32/32 backend files, 23/23 frontend files, 12/12 E2E specs)
- Failing: **0**
- Coverage:
  - Backend: **93.59% statements / 80.48% branches / 96.80% functions / 96.44% lines** (target: ≥ 80% on all metrics)
  - Frontend: **89.91% statements / 81.01% branches / 86.70% functions / 92.45% lines** (target: ≥ 80% on all metrics)

## Issues found

| Severity | File | Line | Description | Suggestion |
| --- | --- | --- | --- | --- |
| Medium | `backend/src/app.ts`, `backend/src/data/userRepository.ts`, `backend/src/services/authService.ts`, `backend/src/services/inMemoryAuthRepositories.ts`, `backend/src/data/listMembershipQueries.ts`, `backend/src/data/listMembershipRepository.ts`, `backend/src/services/watchlistService.ts`, `backend/migrations/1764400000000_user-authentication.ts` | Multiple | Non-test files exceeded the 100-line rule (`code-standards.md`), and `down()` in the migration was 40 lines. | **Fixed:** Extracted `registerApiRouters.ts`, `userRowMapper.ts`, `inMemorySessionRepository.ts`, `authMigrationSql.ts`, deduplicated `buildSavedWatchlistItem` in `WatchlistService`, and compacted repository signatures. All files now ≤ 100 lines. |
| Medium | `backend/src/routes/userRoutes.ts`, `frontend/src/components/admin/CreateUserModal.tsx`, `UserRow.tsx`, `DevLoginPanel.tsx`, `PasswordField.tsx`, `AccountMenu.tsx`, `NextBingeSection.tsx`, `AuthContext.tsx`, `useAdminUsers.ts`, `useChangePassword.ts`, `useLoginForm.ts`, `PersonProfileView.tsx`, `SeriesProfileView.tsx` | Multiple | 14 functions/components exceeded the 30-line limit, and 4 frontend files had blank lines inside functions; `requireSignIn` logic was duplicated across 3 components. | **Fixed:** Extracted shared `useRequireAuthAction` hook, pure validation/parsing helpers (`validateCreateInput`, `validateChangeInput`, `parseCreateBody`, `parseUpdateBody`), subcomponents (`CreateUserFormFields`, `DevUserRow`, `SignInLink`), and removed all blank lines inside functions. |
| Low | `backend/src/services/authService.test.ts` | 68 | After modularizing backend helpers, global backend branch coverage dipped slightly to 79.98% (below 80% threshold). | **Fixed:** Added unit test covering `logout(null)`, `getSessionByToken(null)`, deactivated-account login rejection, and password-change guardrails; backend branch coverage rose to **80.48%**. |

## Strengths

- Strong end-to-end security posture: two-stage async `bcryptjs`, constant-time dummy verification with HMAC-derived fake salts, SHA-256 hashed PostgreSQL session tokens in `HttpOnly` `SameSite=Lax` cookies, and double-locked localhost-only DEV Mode.
- Clean multi-user PostgreSQL schema with composite foreign keys (`(user_id, series_id)`, `(list_id, user_id)`) enforcing tenant isolation at the database layer as well as the application layer.
- Shared `useRequireAuthAction` hook and modular `registerApiRouters`/`userRowMapper`/`authMigrationSql` extraction keep every file ≤ 100 lines and every function/component ≤ 30 lines without sacrificing readability.
- Comprehensive automated coverage across unit, PostgreSQL integration, and Playwright E2E layers (143/143 passing).

## Recommendations

- Consider adding `frontend/coverage/` to `.gitignore` in a future housekeeping PR so generated coverage HTML reports do not create noisy git diffs on local test runs.
- Consider adding a periodic background cleanup job (or login-triggered sweep) calling `sessionRepository.deleteExpired()` to prune expired rows from `user_sessions` over long-lived production deployments.

## Conclusion

All coding standard violations discovered during the review (file lengths > 100 lines, functions > 30 lines, blank lines inside functions, and duplicated auth-redirect logic) have been refactored cleanly, and all backend, frontend, lint, typecheck, build, and Playwright E2E validations pass at 100% with > 80% coverage across every metric. The **User Authentication & Multi-User Watchlists** feature is **APPROVED** for merge.
