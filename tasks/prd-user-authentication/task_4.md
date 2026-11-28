# Task 4.0: Backend Auth Middleware, Cookie Helpers, Auth/User HTTP Routes, CORS, and Integration Tests

## Overview

Expose the HTTP authentication (`/api/auth/*`) and admin user-management (`/api/users/*`) APIs, implement `nbw_session` HttpOnly cookie handling and Express auth/role/DEV-localhost middleware, configure credentialed CORS in `app.ts`, protect all private existing routes with `requireAuth`, pass optional auth identity to public discovery routes, and validate full HTTP + PostgreSQL integration behavior (`UT-09`, `IT-02`–`IT-07`).

<skills>
### Skill compliance

No frontend React code is modified in this task; no project skill under `.agents/skills/` applies directly to this backend-only task.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply:
- Keep every non-test `.ts` file ≤ 100 lines, functions ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, and zero `any`.
- Keep business rules out of `routes/`; routes parse input, enforce middleware guards, call services, set/clear cookies, and return HTTP responses.
- Never log cookies, tokens, passwords, or hashes via `logger`.
- Verify `cd backend && npm test && npm run build` passes with ≥ 80% coverage across all metrics.
</rules>

<requirements>
- FR3, FR5, FR6, FR7, FR8, FR9, FR10, FR11, FR12, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22, FR23, FR27, FR28
</requirements>

## Subtasks

- [x] 4.1 Create `backend/src/routes/authCookies.ts` to parse `nbw_session` from `req.headers.cookie` and set/clear the `HttpOnly`, `SameSite=Lax`, `Path=/`, 7-day `Max-Age` cookie (with `Secure` in production).
- [x] 4.2 Create `backend/src/routes/authMiddleware.ts` implementing `attachOptionalAuth`, `requireAuth`, `requireAdmin`, and the double-locked `requireDevLocalhost` middleware (`NODE_ENV !== 'production'` AND `localhost`/`127.0.0.1` host/origin), plus unit tests (`UT-09`).
- [x] 4.3 Create `backend/src/routes/authRoutes.ts` implementing `POST /api/auth/challenge`, `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`, `GET /api/auth/password-challenge`, `POST /api/auth/change-password`, `GET /api/auth/dev/users`, and `POST /api/auth/dev/login`.
- [x] 4.4 Create `backend/src/routes/userRoutes.ts` implementing `GET /api/users`, `POST /api/users`, `PATCH /api/users/:userId`, and `DELETE /api/users/:userId` protected by `requireAuth` + `requireAdmin`.
- [x] 4.5 Update `backend/src/app.ts` (CORS with `credentials: true` and origin validation, `attachOptionalAuth`, registering `authRoutes` and `userRoutes`), `backend/src/index.ts`, and existing route files (`watchlistRoutes.ts`, `listRoutes.ts`, `preferencesRoutes.ts`, `searchRoutes.ts`, `seriesRoutes.ts`, `personRoutes.ts`, `recommendationRoutes.ts`).
- [x] 4.6 Update existing route integration tests (`catalogRoutes.test.ts`, `listRoutes.test.ts`, `trackingAndRecommendationRoutes.test.ts`, `healthAndError.test.ts`) and add comprehensive auth, user-management, multi-user isolation, and DEV-lock integration tests (`authRoutes.test.ts`, `userRoutes.test.ts`, covering `IT-02`–`IT-07`).

## Implementation details

Follow `techspec.md` sections:
- **Implementation design → API endpoints** (all `/api/auth/*`, `/api/users/*`, and existing endpoint access rules)
- **Integration points** (CORS & Cookie Transport)
- **Monitoring and observability** (structured logging and strict redaction rules)

## Related acceptance criteria

- AC-02
- AC-03
- AC-04
- AC-05
- AC-06
- AC-07
- AC-08

## Task tests

### Unit tests (if applicable)

- [x] UT-09 - `authMiddleware`: `requireAuth`, `requireAdmin`, `requireDevLocalhost`

### Integration tests (if applicable)

- [x] IT-02 - Auth HTTP flow: challenge → login (cookie) → `/api/auth/me` → logout
- [x] IT-03 - Change password HTTP flow & cross-session revocation
- [x] IT-04 - Public discovery vs. protected endpoints (`401` anonymous, `403` non-admin)
- [x] IT-05 - Admin `/api/users` CRUD, CI uniqueness, deactivation revocation, cascade delete
- [x] IT-06 - Multi-user isolation across watchlists, lists, episodes, recommendations, prefs
- [x] IT-07 - DEV endpoints double-lock (`NODE_ENV=production` vs. non-localhost vs. localhost)

### E2E tests (if applicable)

Not applicable in this task (covered in Task 8.0).

## Relevant files

- `backend/src/routes/authCookies.ts`
- `backend/src/routes/authMiddleware.ts`
- `backend/src/routes/authMiddleware.test.ts`
- `backend/src/routes/authRoutes.ts`
- `backend/src/routes/authRoutes.test.ts`
- `backend/src/routes/userRoutes.ts`
- `backend/src/routes/userRoutes.test.ts`
- `backend/src/app.ts`
- `backend/src/index.ts`
- `backend/src/routes/watchlistRoutes.ts`
- `backend/src/routes/listRoutes.ts`
- `backend/src/routes/preferencesRoutes.ts`
- `backend/src/routes/searchRoutes.ts`
- `backend/src/routes/seriesRoutes.ts`
- `backend/src/routes/personRoutes.ts`
- `backend/src/routes/recommendationRoutes.ts`
- `backend/src/routes/catalogRoutes.test.ts`
- `backend/src/routes/listRoutes.test.ts`
- `backend/src/routes/trackingAndRecommendationRoutes.test.ts`
