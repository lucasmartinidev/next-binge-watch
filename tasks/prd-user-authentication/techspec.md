# Technical Specification

## Summary

This specification defines the architecture, database migration, two-stage `bcryptjs` authentication protocol, HttpOnly session management, role-based access control (`ADMIN` / `USER`), local-only DEV Mode login, and multi-user watchlist isolation required by [prd.md](./prd.md). Rather than introducing JWT libraries or cookie-parsing packages, the backend persists SHA-256 hashes of opaque cryptographically random session tokens in PostgreSQL (`user_sessions`) and transports the raw token in an `HttpOnly`, `SameSite=Lax` cookie (`nbw_session`) with a 7-day lifetime, delivering XSS protection and immediate revocation on sign-out, password change (revoking all other sessions), deactivation, or deletion.

To guarantee that plaintext passwords never traverse HTTP payloads and never exist unhashed in storage, both `frontend/` and `backend/` adopt `bcryptjs` (`https://github.com/bcrypt-js/bcrypt.js`) in a two-stage protocol: each user stores a per-user `client_salt` and a server-side `bcryptjs` hash of the client-derived `bcryptjs` hash (`password_hash`). Unknown login identifiers receive a deterministic HMAC-derived fake bcrypt salt from `POST /api/auth/challenge` and undergo a constant-time dummy verification so authentication never leaks account existence. A reversible `node-pg-migrate` migration introduces `users` and `user_sessions`, seeds the initial `ADMIN` from `backend/.env`, adds `user_id` ownership and composite foreign keys across `user_lists`, `watchlist_items`, `watched_episodes`, `custom_list_series`, `custom_list_people`, and `user_preferences`, and migrates 100% of pre-existing records to that initial `ADMIN`.

## System architecture

### Component overview

The solution preserves the independent `backend/` (Express 5 + TypeScript + PostgreSQL 18.7) and `frontend/` (React 19 + TypeScript + Vite + Tailwind CSS + React Router) architecture and follows the strict unidirectional dependency flows (`configuration → routes → services → data` in backend; `view → components/hooks → services → backend` in frontend).

#### Backend — New Components
- **`backend/migrations/1764400000000_user-authentication.ts`:** Reversible migration creating `users` and `user_sessions`, seeding the initial `ADMIN` from `FIRST_USER_ADMIN_*` env vars, scoping `user_lists`, `watchlist_items`, `watched_episodes`, `custom_list_series`, `custom_list_people`, and `user_preferences` by `user_id`, and migrating all legacy records to the initial `ADMIN`.
- **`backend/src/types/auth.ts` & `backend/src/types/user.ts`:** Domain types for roles (`ADMIN` | `USER`), public user projections, session metadata, auth payloads, and user-management inputs.
- **`backend/src/config/authConfig.ts`:** Parses and validates `FIRST_USER_ADMIN_ROLE`, `FIRST_USER_ADMIN_USERNAME`, `FIRST_USER_ADMIN_EMAIL`, `FIRST_USER_ADMIN_PASSWORD`, `SESSION_TTL_DAYS`, `AUTH_SALT_PEPPER`, `CORS_ORIGINS`, and `NODE_ENV`.
- **`backend/src/data/userRepository.ts`:** PostgreSQL CRUD and lookup queries for `users` (case-insensitive username/email lookups, active admin counts, transactional user creation with 3 primary lists).
- **`backend/src/data/sessionRepository.ts`:** PostgreSQL session persistence (`create`, `findActiveByTokenHash`, `deleteById`, `deleteOtherUserSessions`, `deleteAllForUser`, `deleteExpired`).
- **`backend/src/data/initialAdminSeed.ts`:** Shared idempotent helper used by migration and `resetTestDatabase` to seed the first `ADMIN` user and provision their 3 primary lists (`want_to_watch`, `watching`, `watched`).
- **`backend/src/services/passwordService.ts`:** Async `bcryptjs` hashing/comparison, bcrypt salt/hash format validation, two-stage server verification, dummy-hash timing equalization, and deterministic HMAC fake-salt generation for unknown identifiers.
- **`backend/src/services/userValidation.ts`:** Pure validation functions for username (`^[A-Za-z0-9-]{1,39}$`), email (valid format, max 254 chars), role (`ADMIN` | `USER`), and bcrypt client salt/hash payloads.
- **`backend/src/services/authService.ts`:** Handles `issueChallenge`, `login`, `logout`, `getCurrentSession`, `getPasswordChallenge`, `changePassword` (revoking other sessions), `listDevUsers`, and `loginAsDevUser`.
- **`backend/src/services/userManagementService.ts`:** Admin-only operations (`listUsers`, `createUser`, `updateUser`, `deleteUser`) enforcing uniqueness, automatic 3-primary-list provisioning, self-lockout prevention, last-active-admin protection, and immediate session invalidation on deactivation.
- **`backend/src/routes/authCookies.ts`:** Pure cookie parser/serializer helpers for `nbw_session` (`HttpOnly`, `SameSite=Lax`, `Path=/`, `Secure` in production, 7-day `Max-Age`).
- **`backend/src/routes/authMiddleware.ts`:** Express middleware (`attachOptionalAuth`, `requireAuth`, `requireAdmin`) and double-lock `requireDevLocalhost` guard.
- **`backend/src/routes/authRoutes.ts`:** HTTP endpoints under `/api/auth/*` (challenge, login, logout, me, password-challenge, change-password, dev/users, dev/login).
- **`backend/src/routes/userRoutes.ts`:** Admin HTTP endpoints under `/api/users` and `/api/users/:userId`.
- **`backend/src/services/inMemoryAuthRepositories.ts`:** Fast in-memory repository doubles for unit testing `AuthService` and `UserManagementService`.

#### Backend — Modified Components
- **`backend/src/config/env.ts`:** Integrates `authConfig` validation on startup (fail-fast).
- **`backend/src/types/error.ts`, `backend/src/i18n/enMessages.ts`, `backend/src/i18n/ptBrMessages.ts`:** Adds `UNAUTHORIZED` (`401`) error code and localized auth/user validation error messages.
- **`backend/src/data/userListRepository.ts`, `watchlistRepository.ts`, `watchedEpisodeRepository.ts`, `listMembershipRepository.ts`, `listMembershipQueries.ts`, `preferencesRepository.ts`, `testDatabase.ts`:** Scopes every query, insert, update, delete, and `resetTestDatabase` operation by `userId` (`UUID`), and supports resolving primary lists by UUID `id` or `system_key` for that user.
- **`backend/src/services/userListService.ts`, `listMembershipService.ts`, `listDetailLoader.ts`, `listSeriesCommit.ts`, `watchlistService.ts`, `episodeTrackingService.ts`, `preferencesService.ts`, `searchService.ts`, `seriesService.ts`, `personService.ts`, `recommendationService.ts`:** Accepts `userId: string` on private services and optional `userId?: string` on public discovery services (omitting personal badges/watchlist state when `userId` is absent).
- **`backend/src/routes/watchlistRoutes.ts`, `listRoutes.ts`, `preferencesRoutes.ts`, `searchRoutes.ts`, `seriesRoutes.ts`, `personRoutes.ts`, `recommendationRoutes.ts`:** Applies `requireAuth` to private routes and passes `req.auth?.user.id` from `attachOptionalAuth` / `requireAuth` to services.
- **`backend/src/app.ts`:** Configures CORS with `credentials: true` and origin validation, attaches `attachOptionalAuth`, and registers `authRoutes` and `userRoutes`.

#### Frontend — New Components
- **`frontend/src/types/auth.ts`:** Frontend DTOs (`UserRole`, `AuthUser`, `DevUserSummary`, `ManagedUser`, `ChangePasswordInput`, `CreateUserInput`, `UpdateUserInput`).
- **`frontend/src/services/passwordHasher.ts`:** Async `bcryptjs` wrapper (`generateClientSalt`, `hashClientPassword`, `validatePlainPassword`) ensuring plaintext passwords never leave the browser.
- **`frontend/src/services/authService.ts` & `frontend/src/services/userService.ts`:** HTTP client functions for `/api/auth/*` and `/api/users/*`.
- **`frontend/src/hooks/AuthContext.tsx`, `useAuth.ts`, `useLoginForm.ts`, `useDevUsers.ts`, `useChangePassword.ts`, `useAdminUsers.ts`:** Auth session provider, login/DEV-login hooks, password-change hook, and admin user-management state hooks.
- **`frontend/src/i18n/authEn.ts` & `frontend/src/i18n/authPtBR.ts`:** Bilingual `en` / `pt-BR` dictionaries for login, DEV Mode, account menu, password change, and admin user management.
- **`frontend/src/components/auth/ProtectedRoute.tsx` & `AdminRoute.tsx`:** Route guards redirecting unauthenticated visitors to `/login` (preserving `location.state.from`) and denying `USER` access to `/admin/users`.
- **`frontend/src/components/auth/PasswordField.tsx`:** Reusable accessible password input with visibility toggle, inline error, and ARIA attributes.
- **`frontend/src/components/auth/DevLoginPanel.tsx`:** Strictly `import.meta.env.DEV && isLocalhost()` quick-login panel listing registered users with one-click login buttons.
- **`frontend/src/components/layout/AccountMenu.tsx`:** Header account controls (Sign In link when signed out; username, role chip, Change Password, Users [ADMIN only], and Sign Out when signed in).
- **`frontend/src/components/admin/UserTable.tsx`, `UserRow.tsx`, `CreateUserModal.tsx`:** Admin user-management list, role/active controls, delete confirmation (`ConfirmDialog`), and new-user creation form.
- **`frontend/src/views/LoginView.tsx`, `ChangePasswordView.tsx`, `AdminUsersView.tsx`:** Top-level page views for `/login`, `/account/password`, and `/admin/users`.

#### Frontend — Modified Components
- **`frontend/src/services/apiClient.ts`:** Adds `credentials: 'include'` to all `fetch` calls and exports `isUnauthorizedError` helper.
- **`frontend/src/i18n/en.ts`, `ptBR.ts`, `I18nContext.tsx`:** Merges auth translations; syncs `GET/PUT /api/preferences` only when authenticated (re-fetching on user switch/login) and falls back to `localStorage`/browser detection when unauthenticated.
- **`frontend/src/components/layout/Header.tsx`:** Integrates `AccountMenu` and hides/protects `My Lists` cleanly for unauthenticated visitors.
- **`frontend/src/App.tsx`:** Wraps app in `AuthProvider` (above `I18nProvider`) and registers `/login`, `/account/password`, `/admin/users`, and route guards for `/watchlist` and `/watchlist/:listId`.
- **`frontend/src/views/SeriesProfileView.tsx`, `PersonProfileView.tsx`, `HomeView.tsx` & `frontend/src/components/recommendation/NextBingeSection.tsx`:** Preserves public browsing when unauthenticated; clicking watchlist/list/episode actions while signed out routes to `/login` with return path.

#### High-Level Data Flow

```text
[Browser: LoginView]
  1. POST /api/auth/challenge { identifier }        ──▶ [Backend: AuthService] ──▶ returns per-user client_salt (or HMAC fake salt)
  2. bcryptjs.hash(password, salt)  [in browser]    ──▶ produces 60-char clientPasswordHash (plaintext never sent)
  3. POST /api/auth/login { identifier, passwordHash }
     ──▶ [Backend: AuthService] verifies bcryptjs.compare(clientHash, storedHash) + isActive
     ──▶ creates SHA-256 hashed session in PostgreSQL `user_sessions` (TTL 7 days)
     ──▶ sets HttpOnly SameSite=Lax cookie `nbw_session` + returns { user }

[Browser: Protected Request (e.g. GET /api/lists)]
  fetch(..., { credentials: 'include' })
     ──▶ [Backend: attachOptionalAuth / requireAuth]
     ──▶ hashes cookie token → queries active session JOIN active user
     ──▶ attaches req.auth = { user, sessionId }
     ──▶ routes pass req.auth.user.id → services → repositories (WHERE user_id = $1)
```

## Implementation design

### Primary interfaces

```ts
PasswordService
  validateClientSalt(salt: string) -> string
  validateClientHash(hash: string, expectedSalt?: string) -> string
  generateClientSalt() -> Promise<string>
  deriveFakeClientSalt(normalizedIdentifier: string) -> string
  hashClientHashForStorage(clientPasswordHash: string) -> Promise<string>
  verifyClientHash(clientPasswordHash: string, storedHash: string | null) -> Promise<boolean>
  hashPlaintextTwoStage(plaintext: string) -> Promise<{ clientSalt: string; passwordHash: string }>
```

```ts
AuthService
  issueChallenge(identifier: string) -> Promise<AuthChallengeResponse>
  login(input: LoginInput) -> Promise<AuthSessionResult>
  logout(sessionId: string | null) -> Promise<void>
  getSessionByToken(rawToken: string | null) -> Promise<ActiveSessionContext | null>
  getPasswordChallenge(userId: string) -> Promise<AuthChallengeResponse>
  changePassword(input: ChangePasswordServiceInput) -> Promise<void>
  listDevUsers() -> Promise<DevUserSummary[]>
  loginAsDevUser(userId: string) -> Promise<AuthSessionResult>
```

```ts
UserManagementService
  listUsers() -> Promise<ManagedUser[]>
  createUser(input: CreateUserServiceInput) -> Promise<ManagedUser>
  updateUser(input: UpdateUserServiceInput) -> Promise<ManagedUser>
  deleteUser(input: DeleteUserServiceInput) -> Promise<void>
```

```ts
UserRepository
  findById(userId: string) -> Promise<StoredUser | null>
  findByIdentifier(normalizedIdentifier: string) -> Promise<StoredUser | null>
  findByLowerUsername(lowerUsername: string) -> Promise<StoredUser | null>
  findByLowerEmail(lowerEmail: string) -> Promise<StoredUser | null>
  listAll() -> Promise<StoredUser[]>
  countActiveAdmins() -> Promise<number>
  createWithPrimaryLists(input: CreateStoredUserInput) -> Promise<StoredUser>
  updateAccount(userId: string, patch: UpdateStoredUserPatch) -> Promise<StoredUser | null>
  updateCredentials(userId: string, clientSalt: string, passwordHash: string) -> Promise<boolean>
  deleteById(userId: string) -> Promise<boolean>
```

```ts
SessionRepository
  create(input: CreateSessionInput) -> Promise<StoredSession>
  findActiveByTokenHash(tokenHash: string, nowIso: string) -> Promise<ActiveSessionContext | null>
  deleteById(sessionId: string) -> Promise<void>
  deleteOtherUserSessions(userId: string, keepSessionId: string) -> Promise<void>
  deleteAllForUser(userId: string) -> Promise<void>
```

```ts
FrontendPasswordHasher
  validatePlainPassword(password: string) -> PasswordValidationError | null
  generateClientSalt() -> Promise<string>
  hashClientPassword(plaintext: string, clientSalt: string) -> Promise<string>
```

### Data models

All backend JSON contracts are ready for direct UI display. Sensitive columns (`password_hash`, `client_salt`, `token_hash`) are never exposed in user list or profile responses; `client_salt` is returned only by dedicated challenge endpoints (`/api/auth/challenge` and `/api/auth/password-challenge`).

#### `AuthUser` - authenticated user summary

| Field       | Type                  | Required | Description                                     |
| ----------- | --------------------- | -------- | ----------------------------------------------- |
| `id`        | `string` (UUID)       | yes      | Unique user identifier                          |
| `username`  | `string`              | yes      | Display username (1–39 chars, `[A-Za-z0-9-]`)   |
| `email`     | `string`              | yes      | Normalized email address (max 254 chars)        |
| `role`      | `'ADMIN' \| 'USER'`   | yes      | User permission role                            |
| `isActive`  | `boolean`             | yes      | Whether the account is active                   |
| `createdAt` | `string` (ISO 8601)   | yes      | Account creation timestamp                      |

```json
{
  "id": "8c5d9a12-4e7b-4f1a-9c2d-1a2b3c4d5e6f",
  "username": "super-admin",
  "email": "super-admin@nextbingwatch.com",
  "role": "ADMIN",
  "isActive": true,
  "createdAt": "2026-11-28T11:30:00.000Z"
}
```

#### `AuthMeResponse` - current session probe payload

| Field           | Type               | Required | Description                                    |
| --------------- | ------------------ | -------- | ---------------------------------------------- |
| `authenticated` | `boolean`          | yes      | `true` when a valid active session cookie exists |
| `user`          | `AuthUser \| null` | yes      | Current user object, or `null` when signed out |

```json
{
  "authenticated": true,
  "user": {
    "id": "8c5d9a12-4e7b-4f1a-9c2d-1a2b3c4d5e6f",
    "username": "super-admin",
    "email": "super-admin@nextbingwatch.com",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2026-11-28T11:30:00.000Z"
  }
}
```

> **Unauthenticated visitor variant:** When no valid session cookie is present (or the session expired/was revoked), `GET /api/auth/me` returns HTTP `200` with `authenticated: false` and `user: null` so public discovery pages load cleanly without triggering browser `401` console errors.

```json
{
  "authenticated": false,
  "user": null
}
```

#### `AuthChallengeResponse` - bcryptjs client salt payload

| Field  | Type     | Required | Description                                                  |
| ------ | -------- | -------- | ------------------------------------------------------------ |
| `salt` | `string` | yes      | Valid 29-char bcrypt salt (`$2b$10$...`) for frontend hashing |

```json
{
  "salt": "$2b$10$abcdefghijklmnopqrstuv"
}
```

#### `LoginRequest` - two-stage login payload

| Field          | Type     | Required | Description                                                          |
| -------------- | -------- | -------- | -------------------------------------------------------------------- |
| `identifier`   | `string` | yes      | Username or email (trimmed, matched case-insensitively)              |
| `passwordHash` | `string` | yes      | 60-char `bcryptjs` hash computed on frontend with the challenge salt |

```json
{
  "identifier": "super-admin",
  "passwordHash": "$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234"
}
```

#### `ChangePasswordRequest` - authenticated password change payload

| Field                 | Type     | Required | Description                                                              |
| --------------------- | -------- | -------- | ------------------------------------------------------------------------ |
| `currentPasswordHash` | `string` | yes      | Frontend `bcryptjs` hash of current password using user's current salt   |
| `newClientSalt`       | `string` | yes      | Fresh 29-char bcrypt salt generated on frontend for the new password     |
| `newPasswordHash`     | `string` | yes      | Frontend `bcryptjs` hash of new password computed with `newClientSalt`   |

```json
{
  "currentPasswordHash": "$2b$10$abcdefghijklmnopqrstuvABCDEFGHIJKLMNOPQRSTUVWXYZ01234",
  "newClientSalt": "$2b$10$zyxwvutsrqponmlkjihgfe",
  "newPasswordHash": "$2b$10$zyxwvutsrqponmlkjihgfe0123456789ABCDEFGHIJKLMNOPQRSTU"
}
```

#### `CreateUserRequest` - admin user creation payload

| Field          | Type                | Required | Description                                                      |
| -------------- | ------------------- | -------- | ---------------------------------------------------------------- |
| `username`     | `string`            | yes      | 1–39 chars, `[A-Za-z0-9-]`, unique case-insensitively            |
| `email`        | `string`            | yes      | Valid email format, max 254 chars, unique case-insensitively     |
| `role`         | `'ADMIN' \| 'USER'` | yes      | Role assigned to the new account                                 |
| `clientSalt`   | `string`            | yes      | Fresh 29-char bcrypt salt generated on frontend                  |
| `passwordHash` | `string`            | yes      | Frontend `bcryptjs` hash of initial password (8–60 chars raw)    |

```json
{
  "username": "viewer-one",
  "email": "viewer@example.com",
  "role": "USER",
  "clientSalt": "$2b$10$zyxwvutsrqponmlkjihgfe",
  "passwordHash": "$2b$10$zyxwvutsrqponmlkjihgfe0123456789ABCDEFGHIJKLMNOPQRSTU"
}
```

#### `UpdateUserRequest` - admin user update payload

| Field      | Type                | Required | Description                                |
| ---------- | ------------------- | -------- | ------------------------------------------ |
| `role`     | `'ADMIN' \| 'USER'` | no       | Updated role (cannot self-demote)          |
| `isActive` | `boolean`           | no       | Updated active status (cannot self-disable)|

```json
{
  "role": "ADMIN",
  "isActive": true
}
```

#### `DevUsersResponse` - localhost DEV Mode user list

| Field   | Type         | Required | Description                              |
| ------- | ------------ | -------- | ---------------------------------------- |
| `users` | `AuthUser[]` | yes      | All registered users ordered by role/name |

```json
{
  "users": [
    {
      "id": "8c5d9a12-4e7b-4f1a-9c2d-1a2b3c4d5e6f",
      "username": "super-admin",
      "email": "super-admin@nextbingwatch.com",
      "role": "ADMIN",
      "isActive": true,
      "createdAt": "2026-11-28T11:30:00.000Z"
    }
  ]
}
```

#### `ApiErrorResponse` - error envelope

| Code               | HTTP | Meaning                                                                                      |
| ------------------ | ---- | -------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR` | 400  | Invalid username, email, role, bcrypt salt/hash format, or missing/empty fields              |
| `UNAUTHORIZED`     | 401  | Missing/expired session, invalid login credentials, wrong current password, inactive account |
| `FORBIDDEN`        | 403  | Non-`ADMIN` calling admin endpoints, self-lockout, last-active-admin protection, DEV blocked |
| `NOT_FOUND`        | 404  | Target user, list, or item does not exist (or belongs to another user)                       |
| `CONFLICT`         | 409  | Username or email already exists (case-insensitive)                                          |
| `INTERNAL_ERROR`   | 500  | Unexpected server or database failure                                                        |

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid username/email or password."
  }
}
```

#### Database Schema — `users` and `user_sessions`

| Table / Column                  | Type          | Constraints                                                                 |
| ------------------------------- | ------------- | --------------------------------------------------------------------------- |
| `users.id`                      | `uuid`        | `PRIMARY KEY DEFAULT gen_random_uuid()`                                     |
| `users.username`                | `text`        | `NOT NULL`, `char_length(username) BETWEEN 1 AND 39`, `~ '^[A-Za-z0-9-]+$'` |
| `users.email`                   | `text`        | `NOT NULL`, `char_length(email) <= 254`                                     |
| `users.client_salt`             | `text`        | `NOT NULL`                                                                  |
| `users.password_hash`           | `text`        | `NOT NULL`                                                                  |
| `users.role`                    | `text`        | `NOT NULL CHECK (role IN ('ADMIN', 'USER'))`                                |
| `users.is_active`               | `boolean`     | `NOT NULL DEFAULT TRUE`                                                     |
| `users.created_at`              | `timestamptz` | `NOT NULL DEFAULT NOW()`                                                    |
| `users.updated_at`              | `timestamptz` | `NOT NULL DEFAULT NOW()`                                                    |
| `idx_users_username_lower`      | unique index  | `UNIQUE (LOWER(username))`                                                  |
| `idx_users_email_lower`         | unique index  | `UNIQUE (LOWER(email))`                                                     |
| `user_sessions.id`              | `uuid`        | `PRIMARY KEY DEFAULT gen_random_uuid()`                                     |
| `user_sessions.user_id`         | `uuid`        | `NOT NULL REFERENCES users(id) ON DELETE CASCADE`                           |
| `user_sessions.token_hash`      | `text`        | `NOT NULL UNIQUE` (SHA-256 hex digest of raw cookie token)                  |
| `user_sessions.expires_at`      | `timestamptz` | `NOT NULL`                                                                  |
| `user_sessions.created_at`      | `timestamptz` | `NOT NULL DEFAULT NOW()`                                                    |
| `idx_user_sessions_user_id`     | btree index   | `(user_id)`                                                                 |
| `idx_user_sessions_expires_at`  | btree index   | `(expires_at)`                                                              |

#### Database Schema — Multi-User Ownership Updates on Existing Tables

| Existing Table       | Schema Changes                                                                                                                                                                |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `watchlist_items`    | Add `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`; PK becomes `(user_id, series_id)`; index `(user_id, status, updated_at DESC)`                             |
| `watched_episodes`   | Add `user_id uuid NOT NULL`; PK becomes `(user_id, series_id, episode_id)`; FK `(user_id, series_id) REFERENCES watchlist_items(user_id, series_id) ON DELETE CASCADE`        |
| `user_lists`         | Add `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`; add `UNIQUE (id, user_id)`; replace global unique indexes with `UNIQUE (user_id, LOWER(name))` and partial `UNIQUE (user_id, system_key) WHERE system_key IS NOT NULL`; migrate legacy system list IDs to UUIDs |
| `custom_list_series` | Add `user_id uuid NOT NULL`; FK `(list_id, user_id) REFERENCES user_lists(id, user_id) ON DELETE CASCADE`; FK `(user_id, series_id) REFERENCES watchlist_items(user_id, series_id) ON DELETE CASCADE`; PK `(list_id, series_id)` |
| `custom_list_people` | Add `user_id uuid NOT NULL`; FK `(list_id, user_id) REFERENCES user_lists(id, user_id) ON DELETE CASCADE`; index `(user_id, person_id)`                                        |
| `user_preferences`   | Add `user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE`; PK becomes `(user_id, key)`                                                                               |

```sql
-- Illustrative migration step for legacy ownership backfill (run inside migration transaction)
INSERT INTO users (id, username, email, client_salt, password_hash, role, is_active)
VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, TRUE)
RETURNING id;

UPDATE watchlist_items SET user_id = $admin_id WHERE user_id IS NULL;
UPDATE watched_episodes SET user_id = $admin_id WHERE user_id IS NULL;
UPDATE user_lists SET user_id = $admin_id WHERE user_id IS NULL;
UPDATE custom_list_series SET user_id = $admin_id WHERE user_id IS NULL;
UPDATE custom_list_people SET user_id = $admin_id WHERE user_id IS NULL;
UPDATE user_preferences SET user_id = $admin_id WHERE user_id IS NULL;
```

### API endpoints

#### Overview

| Method   | Route                         | Access            | Description                                                          |
| -------- | ----------------------------- | ----------------- | -------------------------------------------------------------------- |
| `POST`   | `/api/auth/challenge`         | Public            | Returns per-user (or deterministic fake) bcryptjs salt for login     |
| `POST`   | `/api/auth/login`             | Public            | Authenticates user with frontend bcryptjs hash and sets session cookie |
| `POST`   | `/api/auth/logout`            | Public            | Revokes current session (if any) and clears `nbw_session` cookie     |
| `GET`    | `/api/auth/me`                | Public            | Returns `{ authenticated, user }` for current session                |
| `GET`    | `/api/auth/password-challenge`| Authenticated     | Returns current user's `client_salt` for password-change verification |
| `POST`   | `/api/auth/change-password`   | Authenticated     | Changes logged-in user's password via two-stage bcryptjs             |
| `GET`    | `/api/auth/dev/users`         | DEV + `localhost` | Lists registered users for one-click DEV Mode login                  |
| `POST`   | `/api/auth/dev/login`         | DEV + `localhost` | One-click login as selected active user in local development         |
| `GET`    | `/api/users`                  | `ADMIN`           | Lists all registered users                                           |
| `POST`   | `/api/users`                  | `ADMIN`           | Creates a new `ADMIN` or `USER` with 3 primary lists                 |
| `PATCH`  | `/api/users/:userId`          | `ADMIN`           | Updates another user's role or active status                         |
| `DELETE` | `/api/users/:userId`          | `ADMIN`           | Permanently deletes another user and cascades their watchlist data   |

Existing endpoints updated for auth scoping:
- **Optional-auth (public discovery, user-enriched when signed in):** `GET /api/search`, `GET /api/series/:id`, `GET /api/people/:id`, `GET /api/recommendations/next-binge`.
- **Authenticated (`requireAuth` → `401` if unauthenticated):** `GET/POST /api/watchlist`, `PATCH/DELETE /api/watchlist/:seriesId`, `PUT /api/watchlist/:seriesId/episodes/:episodeId`, `PUT /api/watchlist/:seriesId/seasons/:seasonNumber`, `GET/POST /api/lists`, `GET/PATCH/DELETE /api/lists/:listId`, `DELETE /api/lists/:listId/items/:itemId`, `PUT /api/series/:seriesId/lists`, `PUT /api/people/:personId/lists`, `GET/PUT /api/preferences`.

---

#### `POST /api/auth/challenge`

Returns a bcrypt salt for the given username or email so the frontend can hash the user's password with `bcryptjs` before submitting `/api/auth/login`.

**Body**

| Parameter    | Type     | Default | Rules                                         |
| ------------ | -------- | ------- | --------------------------------------------- |
| `identifier` | `string` | -       | Required, trimmed, non-empty, max 254 chars   |

**Responses**

| Status | Body                    | When                                          |
| ------ | ----------------------- | --------------------------------------------- |
| `200`  | `AuthChallengeResponse` | Always for valid non-empty identifier         |
| `400`  | `ApiErrorResponse`      | Missing, blank, or oversized `identifier`     |

**Example - success (existing or unknown user)**

```http
POST /api/auth/challenge
Content-Type: application/json
```

```json
{
  "identifier": "super-admin"
}
```

```json
{
  "salt": "$2b$10$abcdefghijklmnopqrstuv"
}
```

> Unknown or deactivated identifiers receive a valid-looking bcrypt salt (deterministic HMAC-derived for unknown accounts) so this endpoint never leaks account existence or status.

**Example - validation error**

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Username or email is required."
  }
}
```

---

#### `POST /api/auth/login`

Verifies a client-hashed `bcryptjs` credential against the server-side `bcryptjs` hash, creates a 7-day session in `user_sessions`, and sets the `nbw_session` HttpOnly cookie.

**Body**

| Parameter      | Type     | Default | Rules                                                 |
| -------------- | -------- | ------- | ----------------------------------------------------- |
| `identifier`   | `string` | -       | Required, trimmed, username or email (case-insensitive) |
| `passwordHash` | `string` | -       | Required, valid 60-char bcrypt hash from frontend     |

**Responses**

| Status | Body                | When                                                                |
| ------ | ------------------- | ------------------------------------------------------------------- |
| `200`  | `{ user: AuthUser }`| Credentials valid and account active; sets `Set-Cookie: nbw_session`|
| `400`  | `ApiErrorResponse`  | Missing fields or malformed bcrypt hash                             |
| `401`  | `ApiErrorResponse`  | Unknown identifier, wrong password, or deactivated account          |

**Example - success**

```http
POST /api/auth/login
Content-Type: application/json
```

See `LoginRequest` and `AuthUser` in Data models.

**Example - invalid credentials**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Invalid username/email or password."
  }
}
```

**Example - deactivated account**

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "This account has been deactivated."
  }
}
```

---

#### `POST /api/auth/logout`

Deletes the current session row from `user_sessions` (if present) and clears the `nbw_session` cookie.

**Responses**

| Status | Body | When                                              |
| ------ | ---- | ------------------------------------------------- |
| `204`  | -    | Always (idempotent whether signed in or already out) |

---

#### `GET /api/auth/me`

Returns the current authentication state and user projection without throwing `401` for anonymous visitors.

**Responses**

| Status | Body             | When                                       |
| ------ | ---------------- | ------------------------------------------ |
| `200`  | `AuthMeResponse` | Always (returns `user: null` if signed out)|

See `AuthMeResponse` in Data models.

---

#### `GET /api/auth/password-challenge`

Returns the authenticated user's current `client_salt` so the frontend can hash the current password before calling `/api/auth/change-password`.

**Responses**

| Status | Body                    | When                         |
| ------ | ----------------------- | ---------------------------- |
| `200`  | `AuthChallengeResponse` | User is authenticated        |
| `401`  | `ApiErrorResponse`      | Unauthenticated or inactive  |

---

#### `POST /api/auth/change-password`

Verifies the current client-hashed password, stores the newly server-hashed `bcryptjs` credential and `newClientSalt`, and revokes all other active sessions for this user while preserving the current session.

**Body**

| Parameter             | Type     | Default | Rules                                                                |
| --------------------- | -------- | ------- | -------------------------------------------------------------------- |
| `currentPasswordHash` | `string` | -       | Required, valid 60-char bcrypt hash matching user's current salt     |
| `newClientSalt`       | `string` | -       | Required, valid 29-char bcrypt salt                                  |
| `newPasswordHash`     | `string` | -       | Required, valid 60-char bcrypt hash starting with `newClientSalt`    |

**Responses**

| Status | Body               | When                                                              |
| ------ | ------------------ | ----------------------------------------------------------------- |
| `204`  | -                  | Password updated and other sessions revoked                       |
| `400`  | `ApiErrorResponse` | Invalid salt/hash format or new hash identical to current hash    |
| `401`  | `ApiErrorResponse` | Unauthenticated or `currentPasswordHash` does not match stored hash |

> Frontend additionally enforces `8 <= newPassword.length <= 60`, `newPassword === confirmPassword`, and `newPassword !== currentPassword` before hashing and calling this endpoint.

---

#### `GET /api/auth/dev/users` & `POST /api/auth/dev/login`

Local-development-only endpoints powering the Login screen's **DEV Mode** one-click switcher.

**Body (`POST /api/auth/dev/login`)**

| Parameter | Type            | Default | Rules                           |
| --------- | --------------- | ------- | ------------------------------- |
| `userId`  | `string` (UUID) | -       | Required, valid UUID of active user |

**Responses**

| Status | Body                                        | When                                                       |
| ------ | ------------------------------------------- | ---------------------------------------------------------- |
| `200`  | `DevUsersResponse` / `{ user: AuthUser }`   | `NODE_ENV !== 'production'` AND host is `localhost`/`127.0.0.1` |
| `400`  | `ApiErrorResponse`                          | Invalid `userId` UUID format                               |
| `401`  | `ApiErrorResponse`                          | Selected user is deactivated                               |
| `403`  | `ApiErrorResponse`                          | Blocked outside local development / non-localhost host     |
| `404`  | `ApiErrorResponse`                          | Target user not found                                      |

---

#### `GET /api/users`

Lists all registered accounts for `ADMIN` management.

**Responses**

| Status | Body                    | When                                          |
| ------ | ----------------------- | --------------------------------------------- |
| `200`  | `{ users: AuthUser[] }` | Caller is authenticated `ADMIN`               |
| `401`  | `ApiErrorResponse`      | Caller is unauthenticated                     |
| `403`  | `ApiErrorResponse`      | Caller has role `USER`                        |

---

#### `POST /api/users`

Creates a new user account (`ADMIN` or `USER`) with a server-generated UUID, server-hashed `bcryptjs` credential, and automatically provisioned 3 primary Series lists (`Want to Watch`, `Watching`, `Watched`) in a single PostgreSQL transaction.

**Body**

| Parameter      | Type                | Default | Rules                                                      |
| -------------- | ------------------- | ------- | ---------------------------------------------------------- |
| `username`     | `string`            | -       | Required, trimmed, 1–39 chars, `^[A-Za-z0-9-]+$`, unique CI|
| `email`        | `string`            | -       | Required, trimmed, valid email, max 254 chars, unique CI   |
| `role`         | `'ADMIN' \| 'USER'` | -       | Required, strictly `ADMIN` or `USER`                       |
| `clientSalt`   | `string`            | -       | Required, valid 29-char bcrypt salt                        |
| `passwordHash` | `string`            | -       | Required, valid 60-char bcrypt hash matching `clientSalt`  |

**Responses**

| Status | Body                 | When                                                    |
| ------ | -------------------- | ------------------------------------------------------- |
| `201`  | `{ user: AuthUser }` | User and 3 primary lists created successfully           |
| `400`  | `ApiErrorResponse`   | Validation failure on username, email, role, or hash    |
| `401`  | `ApiErrorResponse`   | Unauthenticated                                         |
| `403`  | `ApiErrorResponse`   | Caller is not `ADMIN`                                   |
| `409`  | `ApiErrorResponse`   | Username or email already registered (case-insensitive) |

---

#### `PATCH /api/users/:userId`

Updates another user's role (`ADMIN` / `USER`) and/or active status (`isActive`). Deactivating a user immediately deletes all of that user's rows in `user_sessions`.

**Body**

| Parameter  | Type                | Default | Rules                                                 |
| ---------- | ------------------- | ------- | ----------------------------------------------------- |
| `role`     | `'ADMIN' \| 'USER'` | -       | Optional; strictly `ADMIN` or `USER`                  |
| `isActive` | `boolean`           | -       | Optional; boolean                                     |

**Responses**

| Status | Body                 | When                                                                        |
| ------ | -------------------- | --------------------------------------------------------------------------- |
| `200`  | `{ user: AuthUser }` | User updated successfully                                                   |
| `400`  | `ApiErrorResponse`   | Invalid UUID, empty patch, or invalid role/isActive type                    |
| `401`  | `ApiErrorResponse`   | Unauthenticated                                                             |
| `403`  | `ApiErrorResponse`   | Caller not `ADMIN`, self-demotion/self-deactivation, or last active `ADMIN` |
| `404`  | `ApiErrorResponse`   | Target user not found                                                       |

---

#### `DELETE /api/users/:userId`

Permanently deletes another user account, cascading deletion to all their `user_sessions`, `user_lists`, `watchlist_items`, `watched_episodes`, `custom_list_series`, `custom_list_people`, and `user_preferences`.

**Responses**

| Status | Body               | When                                                            |
| ------ | ------------------ | --------------------------------------------------------------- |
| `204`  | -                  | User deleted                                                    |
| `400`  | `ApiErrorResponse` | Invalid UUID format                                             |
| `401`  | `ApiErrorResponse` | Unauthenticated                                                 |
| `403`  | `ApiErrorResponse` | Caller not `ADMIN`, self-deletion, or last active `ADMIN`       |
| `404`  | `ApiErrorResponse` | Target user not found                                           |

---

## Integration points

- **`bcryptjs` (`https://github.com/bcrypt-js/bcrypt.js`):** Installed in both `backend/package.json` and `frontend/package.json` (with `@types/bcryptjs` in `devDependencies`). Used asynchronously (`bcrypt.genSalt`, `bcrypt.hash`, `bcrypt.compare`) in both runtimes so neither the browser UI thread nor the Node.js event loop blocks. Cost factor defaults to `10` in runtime (completing a full client+server cycle in ~120 ms locally, well under the 500 ms target) and is injectable for fast unit tests.
- **PostgreSQL 18.7 (`pg` + `node-pg-migrate`):** Hosts `users`, `user_sessions`, and all user-scoped tables. All multi-table mutations (creating a user + 3 primary lists, password update + revoking other sessions, series membership updates) execute inside PostgreSQL transactions.
- **TVmaze Upstream API:** Unchanged; public discovery endpoints continue using `TvmazeClient` and `TtlCache` regardless of authentication state.
- **CORS & Cookie Transport (`apiClient.ts` ↔ Express `cors`):** Supports both same-origin Vite dev proxy (`/api` → `localhost:3000`) and cross-origin `VITE_API_URL` (e.g. Playwright E2E `localhost:5181` → `localhost:3051`) via `credentials: 'include'` on frontend `fetch` and explicit `credentials: true` with validated origin reflection on Express CORS.

## Testing approach

All backend and frontend code must satisfy the project's mandatory **≥ 80% coverage threshold** across statements, branches, functions, and lines (Vitest) while following the FIRST principle and testing pyramid. Unit tests use injectable fast bcrypt rounds (`4`) and in-memory repositories; integration tests run against `TEST_DATABASE_URL` (`next_binge_watch_test`); E2E tests run in Playwright (`e2e/`).

### Unit tests

| ID    | Test case name                                                                 | Acceptance criteria | Expected result                                                                 |
| ----- | ------------------------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------- |
| UT-01 | `userValidation`: username rules (max 39, `[A-Za-z0-9-]`, blank, invalid chars)| AC-05               | Accepts valid usernames; rejects spaces, symbols, >39 chars, empty strings      |
| UT-02 | `userValidation`: email format, max 254 chars, role enum, bcrypt salt/hash     | AC-03, AC-04, AC-05 | Rejects malformed emails, >254 chars, invalid roles, malformed bcrypt hashes    |
| UT-03 | `passwordService`: two-stage hash/verify, fake salt determinism, timing guard  | AC-03, AC-04        | Verifies valid client hash; fake salt is deterministic and matches bcrypt regex |
| UT-04 | `authService`: challenge, login (username/email CI), inactive user, logout     | AC-03               | Issues session for active user; rejects wrong hash or inactive user with `401`  |
| UT-05 | `authService`: password change verifies current hash & revokes other sessions  | AC-04               | Rejects wrong current hash; updates credentials and keeps only current session  |
| UT-06 | `authService`: DEV users list & DEV one-click login rejects inactive user      | AC-08               | Logs in active user; rejects inactive or unknown user                           |
| UT-07 | `userManagementService`: create, duplicate CI conflict, role/active, delete    | AC-05, AC-06        | Provisions 3 primary lists on create; enforces `409` on CI duplicates           |
| UT-08 | `userManagementService`: self-lockout & last-active-admin guards               | AC-06               | Rejects self-demote/self-disable/self-delete and removing last active `ADMIN`   |
| UT-09 | `authMiddleware`: `requireAuth`, `requireAdmin`, `requireDevLocalhost`         | AC-02, AC-05, AC-08 | Enforces `401`/`403`; blocks DEV endpoints when `NODE_ENV=production` or remote |
| UT-10 | `passwordHasher` (frontend): 8–60 char validation & async `bcryptjs` hashing   | AC-03, AC-04, AC-05 | Rejects <8 or >60 chars; generates valid bcrypt salt and 60-char client hash    |
| UT-11 | `LoginView` & `DevLoginPanel`: login form, payload has no plaintext, DEV gate  | AC-03, AC-08, AC-09 | Sends only `passwordHash`; hides DEV panel when not dev/localhost; localized    |
| UT-12 | `ChangePasswordView`: current/new/confirm validation & localized feedback      | AC-04, AC-09        | Blocks mismatch or length violation; calls service with hashed payloads only    |
| UT-13 | `AdminUsersView` & `CreateUserModal`: list, create, role, status, delete modal | AC-05, AC-06, AC-09 | Disables self-destructive controls; requires confirmation before delete         |
| UT-14 | `ProtectedRoute`, `AdminRoute`, `Header`/`AccountMenu`, `I18nContext`          | AC-02, AC-07, AC-09 | Redirects anonymous users; hides admin link for `USER`; syncs locale per user   |

Unit tests mock only external HTTP/browser boundaries (TVmaze fetch, frontend `apiRequest` in component tests) and use in-memory repository doubles for backend services.

### Integration tests

| ID    | Test case name                                                                      | Acceptance criteria | Expected result                                                                     |
| ----- | ----------------------------------------------------------------------------------- | ------------------- | ----------------------------------------------------------------------------------- |
| IT-01 | Migration up/down & legacy data backfill to `FIRST_USER_ADMIN_EMAIL`                | AC-01               | Migrates pre-existing watchlist/lists/episodes/preferences to seeded admin; down rolls back cleanly |
| IT-02 | Auth HTTP flow: challenge → login (cookie) → `/api/auth/me` → logout                | AC-03               | Sets HttpOnly cookie, authenticates follow-up requests, clears cookie on logout     |
| IT-03 | Change password HTTP flow & cross-session revocation                                | AC-04               | Updates credentials, invalidates old password & other session, preserves active one |
| IT-04 | Public discovery vs. protected endpoints (`401` anonymous, `403` non-admin)         | AC-02, AC-05        | Public `/api/search`, `/series/:id`, `/people/:id` succeed without badges; private routes return `401`; `/api/users` returns `403` for `USER` |
| IT-05 | Admin `/api/users` CRUD, CI uniqueness, deactivation revocation, cascade delete     | AC-05, AC-06        | Creates user with 3 primary lists; deactivation immediately invalidates user cookie; delete cascades user data |
| IT-06 | Multi-user isolation across watchlists, lists, episodes, recommendations, prefs     | AC-07               | Two users independently track same series, create same-named `"Sci-Fi"` list, customize primary lists, and store independent locales with zero leakage |
| IT-07 | DEV endpoints double-lock (`NODE_ENV=production` vs. non-localhost vs. localhost)   | AC-08               | Allowed only on non-production `localhost`; returns `403` in production or non-local host |

Integration tests run against real PostgreSQL (`TEST_DATABASE_URL`) using `supertest` and `resetTestDatabase`, verifying HTTP headers (`Set-Cookie`), status codes, localized `en`/`pt-BR` error envelopes, and real SQL constraints.

### E2E tests

| ID     | Test case name                                                                    | Acceptance criteria      | Expected result                                                                           |
| ------ | --------------------------------------------------------------------------------- | ------------------------ | ----------------------------------------------------------------------------------------- |
| E2E-01 | Public discovery unauthenticated + redirect to `/login` on protected routes       | AC-02                    | Search and profiles render without personal badges; `/watchlist` redirects to `/login`    |
| E2E-02 | Standard login (username & email CI), network payload check (no plaintext), logout| AC-03                    | Request payload contains bcrypt hash (never raw password); session survives reload; logout clears session |
| E2E-03 | Self-service password change and re-login with new password                       | AC-04                    | Rejects old password after change; signs in with new password cleanly                     |
| E2E-04 | Admin creates `USER`, verifies multi-user watchlist isolation, updates role/status/deletes | AC-05, AC-06, AC-07 | New user starts with clean 3 primary lists isolated from Admin; Admin changes role, deactivates, and deletes user |
| E2E-05 | Localhost DEV Mode one-click login + `en`/`pt-BR` + desktop/mobile responsive/a11y| AC-08, AC-09             | DEV Mode signs in with one click; zero horizontal overflow at `375px` and `1280px`; WCAG AA labels intact |

E2E tests live in `e2e/user-authentication.spec.ts` (Playwright). Existing E2E specs (`watchlist-recommendations.spec.ts`, `custom-watchlists.spec.ts`, `i18n-resilience-a11y.spec.ts`) are updated with a shared Playwright sign-in helper for authenticated flows while `discovery-navigation.spec.ts` validates public browsing.

## Development sequencing

### Build order

1. **Dependencies, Configuration & Database Migration (`backend/`):** Install `bcryptjs` + `@types/bcryptjs`; update `backend/.env.example`, `authConfig.ts`, `env.ts`; add `UNAUTHORIZED` error code and localized `en`/`pt-BR` error messages; create reversible migration `1764400000000_user-authentication.ts` + `initialAdminSeed.ts`; update `resetTestDatabase`.
2. **Backend Auth & User Repositories + Services (`backend/`):** Implement `passwordService.ts`, `userValidation.ts`, `userRepository.ts`, `sessionRepository.ts`, `authService.ts`, `userManagementService.ts`, and unit tests (`UT-01`–`UT-08`).
3. **Backend Multi-User Repository & Service Scoping (`backend/`):** Scope `watchlistRepository`, `watchedEpisodeRepository`, `userListRepository`, `listMembershipRepository`, `listMembershipQueries`, `preferencesRepository`, and all domain services by `userId` (required for private flows, optional for public discovery).
4. **Backend HTTP Middleware, Routes & Integration Tests (`backend/`):** Implement `authCookies.ts`, `authMiddleware.ts`, `authRoutes.ts`, `userRoutes.ts`, wire CORS + routes in `app.ts`, update existing route tests, and add auth/isolation integration tests (`IT-01`–`IT-07`).
5. **Frontend Auth Foundation & `bcryptjs` Client (`frontend/`):** Install `bcryptjs` + `@types/bcryptjs`; add `types/auth.ts`, `passwordHasher.ts`, `apiClient.ts` (`credentials: 'include'`), `authService.ts`, `userService.ts`, `AuthContext.tsx`, `I18nContext.tsx` per-user sync, `authEn.ts`/`authPtBR.ts`, route guards, and `AccountMenu` in `Header.tsx`.
6. **Frontend Views & Public/Private Polish (`frontend/`):** Build `LoginView` + `DevLoginPanel`, `ChangePasswordView`, `AdminUsersView` + `CreateUserModal`, update `SeriesProfileView`/`PersonProfileView`/`NextBingeSection` for unauthenticated prompts, and add frontend unit/component tests (`UT-10`–`UT-14`).
7. **End-to-End Verification (`e2e/`):** Update existing E2E specs for authenticated watchlist flows, add `e2e/user-authentication.spec.ts` (`E2E-01`–`E2E-05`), and verify full backend, frontend, and Playwright suites.

### Technical dependencies

- **PostgreSQL 18.7 (`backend/compose.yaml`):** Must be running with `pgcrypto` or built-in PostgreSQL 18 `gen_random_uuid()` (native in PostgreSQL 13+, zero extension needed).
- **Environment Variables (`backend/.env`):** Requires `FIRST_USER_ADMIN_ROLE`, `FIRST_USER_ADMIN_USERNAME`, `FIRST_USER_ADMIN_EMAIL`, and `FIRST_USER_ADMIN_PASSWORD` before running `migrate:up`, `migrate:test:up`, or starting the server.
- **New npm Dependencies:** `bcryptjs` (production) and `@types/bcryptjs` (dev) installed independently in `backend/` and `frontend/`, updating each app's own `package-lock.json`.

## Monitoring and observability

- **Health Check (`GET /health`):** Remains public and unchanged (probes PostgreSQL via `SELECT 1`).
- **Centralized Structured Logging (`backend/src/config/logger.ts`):**
  - `info`: successful login (`userId`, `role`, `mode: 'standard' | 'dev'`), logout (`userId`), password changed (`userId`), admin user created/updated/deleted (`actorUserId`, `targetUserId`), initial admin seeded (`email`).
  - `warn`: failed login attempts (identifier redacted or hashed; never log passwords, salts, hashes, or session tokens), forbidden admin access, blocked DEV-mode requests outside localhost, self-lockout attempts.
  - `error`: unexpected database or hashing errors during auth/user mutations.
- **Strict Redaction Rule:** Passwords, `client_salt`, `passwordHash`, `nbw_session` cookie values, and `token_hash` must never appear in logs or error payloads.

## Technical considerations

### Key decisions

- **Two-Stage `bcryptjs` with Challenge Salt & HMAC Fake Salt:** Chosen to satisfy PRD FR6 (zero plaintext passwords in HTTP payloads + server-side `bcryptjs` verification) while supporting case-insensitive login by *either* username or email. Using a server-side `bcryptjs` hash over the 60-char client bcrypt hash prevents a stolen client hash from matching the stored database digest (and fits cleanly inside bcrypt's 72-byte input ceiling). Deterministic HMAC fake salts prevent account enumeration. *Rejected alternative:* deterministic salt derived from username (breaks email login and allows precomputation).
- **HttpOnly `SameSite=Lax` Cookie + PostgreSQL `user_sessions`:** Chosen over `localStorage` Bearer tokens and stateless JWTs to mitigate XSS token theft, avoid adding `jsonwebtoken`/`cookie-parser`, and guarantee instant revocation when an admin deactivates/deletes a user or a user changes their password (revoking all other sessions).
- **Composite Foreign Keys `(user_id, series_id)` and `(list_id, user_id)`:** Chosen to enforce multi-user data isolation and FR10's Primary-List Invariant directly at the PostgreSQL constraint layer, making cross-user list contamination structurally impossible.
- **Primary List Resolution by UUID `id` or `system_key`:** Migrating `user_lists` primary rows to unique per-user UUIDs enables independent customization per user while accepting `'want_to_watch' | 'watching' | 'watched'` aliases in `UserListRepository` preserves clean URL compatibility.
- **Double-Locked DEV Mode:** Requiring both non-production mode (`NODE_ENV !== 'production'` / `import.meta.env.DEV`) and `localhost`/`127.0.0.1` hostname on both backend and frontend ensures zero accidental exposure in staging or production deployments.

### Known risks

- **Bcrypt Latency Under Parallel Requests:** Running client + server `bcryptjs` at cost `10` takes ~100–160 ms locally. Using `bcryptjs` async APIs (`hash`/`compare`, never `*Sync`) prevents blocking the Node.js event loop and browser UI thread; cost factor is centralized as a constant if tuning is ever needed.
- **Cross-Origin Cookies in Local E2E (`5181` → `3051`):** Different ports on `localhost` are same-site for `SameSite=Lax` cookies, but `fetch` still requires `credentials: 'include'` and Express CORS requires explicit `origin` reflection (never `*`) with `credentials: true`. Covered explicitly by `IT-02` and `E2E-02`.
- **Breaking Existing Unauthenticated Tests:** Existing backend route tests, frontend view tests, and Playwright E2E specs assumed anonymous access to `/api/watchlist`, `/api/lists`, and `/api/preferences`. Plan includes updating test helpers cleanly in the same sequencing steps so all existing suites remain green.
- **Migration Reversibility with Multiple Users:** Rolling back (`migrate:down`) from multi-user to single-user schema cannot keep conflicting duplicate `series_id` rows from multiple users; `down()` preserves the initial `ADMIN` user's records cleanly and drops secondary users' rows before restoring single-user primary keys.

### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule file under `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read in full and govern this specification:
- **Size & Style Limits (`code-standards.md`):** Every non-test `.ts`/`.tsx` file ≤ 100 lines; every function/method/component ≤ 30 lines; max 3 parameters (use typed input objects); zero blank lines inside functions; zero inline comments; extract all business constants (`MAX_USERNAME_LENGTH = 39`, `MAX_EMAIL_LENGTH = 254`, `MIN_PASSWORD_LENGTH = 8`, `MAX_PASSWORD_LENGTH = 60`, `SESSION_TTL_DAYS = 7`); keep credentials exclusively in `.env` with placeholders in `.env.example`.
- **TypeScript Strictness (`javascript-typescript.md`):** Zero `any`, `const` by default, strict `===`/`!==`, immutable updates, named primary functions, run `npm run lint` and `npm run typecheck` on `frontend/`.
- **Node.js Rules (`node.md`):** Async `bcryptjs` only (no `*Sync` calls blocking the event loop), startup env validation via `dotenv`, centralized `logger` with strict secret redaction, independent `npm` lock files per app, strict acyclic module layering (`config → routes → services → data`).
- **Testing & Structure (`tests.md`, `folder-structure.md`):** ≥ 80% coverage across all Vitest metrics in both `backend/` and `frontend/`, FIRST-compliant tests, unit/integration tests co-located under `src/`, Playwright E2E tests in root `e2e/`, no root `package.json`.

### Skill compliance

- **Applicable skill: `.agents/skills/react/SKILL.md` (`react`):**
  - Small single-responsibility functional components ≤ 30 lines (`LoginView`, `DevLoginPanel`, `PasswordField`, `AccountMenu`, `ChangePasswordView`, `AdminUsersView`, `UserTable`, `UserRow`, `CreateUserModal`).
  - Explicit props everywhere (zero `{...props}` spreading).
  - Custom hooks (`useAuth`, `useLoginForm`, `useDevUsers`, `useChangePassword`, `useAdminUsers`) encapsulate async state and backend calls via `frontend/src/services/`; `useEffect` used strictly for external synchronization (initial session load, DEV user fetch, locale sync).
  - Full ARIA semantics (`aria-label`, `aria-invalid`, `aria-describedby`, `role="alert"`, `aria-busy`, keyboard navigation) and Tailwind CSS utility styling aligned with the Cyber-Neon Design System.
  - **Deviations:** None.

### Relevant and dependent files

#### Backend
- Modified: `backend/package.json`, `backend/.env.example`, `backend/src/config/env.ts`, `backend/src/types/error.ts`, `backend/src/i18n/enMessages.ts`, `backend/src/i18n/ptBrMessages.ts`, `backend/src/app.ts`, `backend/src/data/testDatabase.ts`, `backend/src/data/userListRepository.ts`, `backend/src/data/watchlistRepository.ts`, `backend/src/data/watchedEpisodeRepository.ts`, `backend/src/data/listMembershipRepository.ts`, `backend/src/data/listMembershipQueries.ts`, `backend/src/data/preferencesRepository.ts`, `backend/src/services/userListService.ts`, `backend/src/services/listMembershipService.ts`, `backend/src/services/listDetailLoader.ts`, `backend/src/services/listSeriesCommit.ts`, `backend/src/services/watchlistService.ts`, `backend/src/services/episodeTrackingService.ts`, `backend/src/services/preferencesService.ts`, `backend/src/services/searchService.ts`, `backend/src/services/seriesService.ts`, `backend/src/services/personService.ts`, `backend/src/services/recommendationService.ts`, `backend/src/routes/watchlistRoutes.ts`, `backend/src/routes/listRoutes.ts`, `backend/src/routes/preferencesRoutes.ts`, `backend/src/routes/searchRoutes.ts`, `backend/src/routes/seriesRoutes.ts`, `backend/src/routes/personRoutes.ts`, `backend/src/routes/recommendationRoutes.ts`.
- New: `backend/migrations/1764400000000_user-authentication.ts`, `backend/src/config/authConfig.ts`, `backend/src/types/auth.ts`, `backend/src/types/user.ts`, `backend/src/data/userRepository.ts`, `backend/src/data/sessionRepository.ts`, `backend/src/data/initialAdminSeed.ts`, `backend/src/services/passwordService.ts`, `backend/src/services/userValidation.ts`, `backend/src/services/authService.ts`, `backend/src/services/userManagementService.ts`, `backend/src/services/inMemoryAuthRepositories.ts`, `backend/src/routes/authCookies.ts`, `backend/src/routes/authMiddleware.ts`, `backend/src/routes/authRoutes.ts`, `backend/src/routes/userRoutes.ts`, plus co-located `*.test.ts` suites.

#### Frontend
- Modified: `frontend/package.json`, `frontend/src/App.tsx`, `frontend/src/services/apiClient.ts`, `frontend/src/i18n/en.ts`, `frontend/src/i18n/ptBR.ts`, `frontend/src/i18n/I18nContext.tsx`, `frontend/src/components/layout/Header.tsx`, `frontend/src/views/SeriesProfileView.tsx`, `frontend/src/views/PersonProfileView.tsx`, `frontend/src/components/recommendation/NextBingeSection.tsx`.
- New: `frontend/src/types/auth.ts`, `frontend/src/services/passwordHasher.ts`, `frontend/src/services/authService.ts`, `frontend/src/services/userService.ts`, `frontend/src/hooks/AuthContext.tsx`, `frontend/src/hooks/useAuth.ts`, `frontend/src/hooks/useLoginForm.ts`, `frontend/src/hooks/useDevUsers.ts`, `frontend/src/hooks/useChangePassword.ts`, `frontend/src/hooks/useAdminUsers.ts`, `frontend/src/i18n/authEn.ts`, `frontend/src/i18n/authPtBR.ts`, `frontend/src/components/auth/ProtectedRoute.tsx`, `frontend/src/components/auth/AdminRoute.tsx`, `frontend/src/components/auth/PasswordField.tsx`, `frontend/src/components/auth/DevLoginPanel.tsx`, `frontend/src/components/layout/AccountMenu.tsx`, `frontend/src/components/admin/UserTable.tsx`, `frontend/src/components/admin/UserRow.tsx`, `frontend/src/components/admin/CreateUserModal.tsx`, `frontend/src/views/LoginView.tsx`, `frontend/src/views/ChangePasswordView.tsx`, `frontend/src/views/AdminUsersView.tsx`, plus co-located `*.test.ts` / `*.test.tsx` suites.

#### E2E
- Modified: `e2e/watchlist-recommendations.spec.ts`, `e2e/custom-watchlists.spec.ts`, `e2e/i18n-resilience-a11y.spec.ts`.
- New: `e2e/user-authentication.spec.ts`, `e2e/helpers/authHelper.ts`.
