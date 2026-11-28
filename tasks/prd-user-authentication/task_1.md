# Task 1.0: Backend Dependencies, Auth Configuration, Localized Errors, and Multi-User PostgreSQL Migration

## Overview

Install `bcryptjs` in `backend/`, add startup validation for initial admin and auth environment variables (`FIRST_USER_ADMIN_*`, `SESSION_TTL_DAYS`, `AUTH_SALT_PEPPER`, `CORS_ORIGINS`), add `UNAUTHORIZED` (`401`) and bilingual `en`/`pt-BR` auth/user error messages, create the reversible PostgreSQL migration `1764400000000_user-authentication.ts` (seeding the first `ADMIN` and migrating all legacy watchlist/list/episode/preference records), and update `resetTestDatabase`.

<skills>
### Skill compliance

No frontend React code is modified in this task; no project skill under `.agents/skills/` applies directly to this backend-only task.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply:
- Keep every non-test `.ts` file ≤ 100 lines, functions ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, and zero `any`.
- Never hardcode credentials from `backend/.env`; read via `dotenv`, fail fast on startup in `env.ts`/`authConfig.ts`, and add placeholders to `backend/.env.example`.
- Use async `bcryptjs` APIs only (never `*Sync`) and keep schema changes strictly inside reversible `node-pg-migrate` migrations.
- Manage backend dependencies exclusively in `backend/package.json` and `backend/package-lock.json` via `npm`.
</rules>

<requirements>
- FR1, FR2, FR4, FR24, FR25, FR28
</requirements>

## Subtasks

- [x] 1.1 Install `bcryptjs` and `@types/bcryptjs` in `backend/` via `npm` and update `backend/.env.example` with placeholder auth/admin keys (`FIRST_USER_ADMIN_ROLE`, `FIRST_USER_ADMIN_USERNAME`, `FIRST_USER_ADMIN_EMAIL`, `FIRST_USER_ADMIN_PASSWORD`, `SESSION_TTL_DAYS`, `AUTH_SALT_PEPPER`, `CORS_ORIGINS`).
- [x] 1.2 Create `backend/src/config/authConfig.ts` and update `backend/src/config/env.ts` (plus `env.test.ts`) to validate required initial admin and auth configuration at startup.
- [x] 1.3 Add `UNAUTHORIZED` (`401`) to `backend/src/types/error.ts` and add all localized auth/user error `MessageKey` entries to `backend/src/i18n/enMessages.ts` and `backend/src/i18n/ptBrMessages.ts` (plus `messages.test.ts`).
- [x] 1.4 Create `backend/src/data/initialAdminSeed.ts` implementing idempotent two-stage `bcryptjs` seeding of the first `ADMIN` user and provisioning of their 3 primary Series lists (`want_to_watch`, `watching`, `watched`).
- [x] 1.5 Create reversible migration `backend/migrations/1764400000000_user-authentication.ts` creating `users` and `user_sessions`, seeding the first `ADMIN`, adding `user_id` ownership, composite primary/foreign keys, and per-user uniqueness constraints across `watchlist_items`, `watched_episodes`, `user_lists`, `custom_list_series`, `custom_list_people`, and `user_preferences`, and migrating all legacy records to the initial `ADMIN`.
- [x] 1.6 Update `backend/src/data/testDatabase.ts` (`resetTestDatabase`) to truncate user-scoped tables cleanly and re-seed the initial `ADMIN` with their 3 primary lists, and add migration/backfill integration tests (`IT-01`).

## Implementation details

Follow `techspec.md` sections:
- **System architecture → Component overview** (Backend configuration, migration, seed helper)
- **Implementation design → Data models** (`ApiErrorResponse`, `users`, `user_sessions`, Multi-User Ownership Updates on Existing Tables)
- **Development sequencing → Build order (Step 1)**

## Related acceptance criteria

- AC-01
- AC-09

## Task tests

### Unit tests (if applicable)

- [x] Config & localized error message unit tests in `backend/src/config/env.test.ts` and `backend/src/i18n/messages.test.ts`

### Integration tests (if applicable)

- [x] IT-01 - Migration up/down & legacy data backfill to `FIRST_USER_ADMIN_EMAIL`

### E2E tests (if applicable)

Not applicable in this task (covered in Task 8.0).

## Relevant files

- `backend/package.json`
- `backend/package-lock.json`
- `backend/.env.example`
- `backend/src/config/authConfig.ts`
- `backend/src/config/env.ts`
- `backend/src/config/env.test.ts`
- `backend/src/types/error.ts`
- `backend/src/i18n/enMessages.ts`
- `backend/src/i18n/ptBrMessages.ts`
- `backend/src/i18n/messages.test.ts`
- `backend/src/data/initialAdminSeed.ts`
- `backend/src/data/testDatabase.ts`
- `backend/migrations/1764400000000_user-authentication.ts`
