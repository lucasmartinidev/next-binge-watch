# Task 2.0: Backend Auth & User Repositories, Two-Stage `bcryptjs` Password Service, Validation, and Core Services

## Overview

Implement the backend authentication and user-management domain layer: user/auth types, strict input validation, async two-stage `bcryptjs` password service (including deterministic HMAC fake salts and timing equalization), PostgreSQL `UserRepository` and `SessionRepository`, `AuthService`, `UserManagementService`, in-memory test doubles, and full unit test coverage (`UT-01`–`UT-08`).

<skills>
### Skill compliance

No frontend React code is modified in this task; no project skill under `.agents/skills/` applies directly to this backend-only task.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply:
- Keep every non-test `.ts` file ≤ 100 lines, functions/methods ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, and zero `any`.
- Use async `bcryptjs` (`genSalt`, `hash`, `compare`) exclusively so the Node.js event loop is never blocked; never log passwords, salts, hashes, or session tokens.
- Keep unidirectional dependencies (`services → data → types`) with zero circular imports.
- Follow FIRST testing principles with fast injectable bcrypt rounds (`4`) in unit tests and ≥ 80% coverage across statements, branches, functions, and lines.
</rules>

<requirements>
- FR1, FR3, FR4, FR5, FR6, FR7, FR8, FR9, FR13, FR14, FR15, FR16, FR17, FR18, FR19, FR20, FR21, FR22
</requirements>

## Subtasks

- [x] 2.1 Create `backend/src/types/auth.ts` and `backend/src/types/user.ts` with all auth, session, and user-management DTOs and inputs.
- [x] 2.2 Create `backend/src/services/userValidation.ts` enforcing username (`^[A-Za-z0-9-]{1,39}$`), email (valid format, max 254 chars), role (`ADMIN` | `USER`), UUID format, and bcrypt client salt/hash format rules (`UT-01`, `UT-02`).
- [x] 2.3 Create `backend/src/services/passwordService.ts` implementing async two-stage `bcryptjs` hashing/verification, deterministic HMAC-SHA256 fake salt derivation for unknown identifiers, and constant-time dummy verification (`UT-03`).
- [x] 2.4 Create `backend/src/data/userRepository.ts` and `backend/src/data/sessionRepository.ts` supporting transactional user creation with 3 primary lists, case-insensitive username/email lookups, active admin counting, and SHA-256 session persistence/revocation.
- [x] 2.5 Create `backend/src/services/authService.ts` implementing challenge issuance, login (username/email CI), logout, session lookup, password challenge, password change (revoking other sessions), and DEV-user listing/login (`UT-04`, `UT-05`, `UT-06`).
- [x] 2.6 Create `backend/src/services/userManagementService.ts` enforcing `ADMIN` CRUD, CI uniqueness conflicts (`409`), immediate session revocation on deactivation, and self-lockout / last-active-admin guards (`UT-07`, `UT-08`).
- [x] 2.7 Create `backend/src/services/inMemoryAuthRepositories.ts` and unit test suites (`userValidation.test.ts`, `passwordService.test.ts`, `authService.test.ts`, `userManagementService.test.ts`).

## Implementation details

Follow `techspec.md` sections:
- **Implementation design → Primary interfaces** (`PasswordService`, `AuthService`, `UserManagementService`, `UserRepository`, `SessionRepository`)
- **Implementation design → Data models** (`AuthUser`, `AuthMeResponse`, `AuthChallengeResponse`, `LoginRequest`, `ChangePasswordRequest`, `CreateUserRequest`, `UpdateUserRequest`, `DevUsersResponse`)
- **Technical considerations → Key decisions** (Two-Stage `bcryptjs` with Challenge Salt & HMAC Fake Salt)

## Related acceptance criteria

- AC-03
- AC-04
- AC-05
- AC-06
- AC-08

## Task tests

### Unit tests (if applicable)

- [x] UT-01 - `userValidation`: username rules (max 39, `[A-Za-z0-9-]`, blank, invalid chars)
- [x] UT-02 - `userValidation`: email format, max 254 chars, role enum, bcrypt salt/hash
- [x] UT-03 - `passwordService`: two-stage hash/verify, fake salt determinism, timing guard
- [x] UT-04 - `authService`: challenge, login (username/email CI), inactive user, logout
- [x] UT-05 - `authService`: password change verifies current hash & revokes other sessions
- [x] UT-06 - `authService`: DEV users list & DEV one-click login rejects inactive user
- [x] UT-07 - `userManagementService`: create, duplicate CI conflict, role/active, delete
- [x] UT-08 - `userManagementService`: self-lockout & last-active-admin guards

### Integration tests (if applicable)

Not applicable in this task (covered in Task 4.0).

### E2E tests (if applicable)

Not applicable in this task (covered in Task 8.0).

## Relevant files

- `backend/src/types/auth.ts`
- `backend/src/types/user.ts`
- `backend/src/services/userValidation.ts`
- `backend/src/services/userValidation.test.ts`
- `backend/src/services/passwordService.ts`
- `backend/src/services/passwordService.test.ts`
- `backend/src/data/userRepository.ts`
- `backend/src/data/sessionRepository.ts`
- `backend/src/services/authService.ts`
- `backend/src/services/authService.test.ts`
- `backend/src/services/userManagementService.ts`
- `backend/src/services/userManagementService.test.ts`
- `backend/src/services/inMemoryAuthRepositories.ts`
