# Task 5.0: Frontend `bcryptjs` Client, Auth/User Services, `AuthContext`, Route Guards, Per-User i18n, and Header Account Menu

## Overview

Install `bcryptjs` in `frontend/`, build the client-side password hashing module (`passwordHasher.ts`), enable credentialed cookies in `apiClient.ts`, implement `authService.ts` and `userService.ts`, create `AuthContext` + `useAuth`, add bilingual `en`/`pt-BR` auth dictionaries and per-user locale sync in `I18nContext`, create `ProtectedRoute`, `AdminRoute`, `PasswordField`, and `AccountMenu`, and integrate them into `Header.tsx` and `App.tsx`.

<skills>
### Skill compliance

Applicable skill: **`.agents/skills/react/SKILL.md` (`react`)** — must be loaded and followed for all frontend components, hooks, backend access, accessibility (`aria-*`, semantic HTML), explicit props (no `{...props}` spreading), small components ≤ 30 lines, and Tailwind CSS styling.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`, `folder-structure.md`) were read and apply:
- Keep every non-test `.ts`/`.tsx` file ≤ 100 lines, functions/components ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, zero `any`, and zero JSX prop spreading.
- Manage frontend dependencies exclusively in `frontend/package.json` and `frontend/package-lock.json` via `npm`.
- Keep all HTTP calls encapsulated in `frontend/src/services/`; components consume hooks and handle only presentation and interactions.
- Verify `cd frontend && npm test && npm run lint && npm run typecheck && npm run build` passes with ≥ 80% coverage.
</rules>

<requirements>
- FR5, FR6, FR8, FR9, FR10, FR11, FR12, FR26, FR28
</requirements>

## Subtasks

- [x] 5.1 Install `bcryptjs` and `@types/bcryptjs` in `frontend/` via `npm`, create `frontend/src/types/auth.ts`, and create `frontend/src/services/passwordHasher.ts` (validating 8–60 char passwords and running async `bcryptjs` salt/hash) with unit tests (`UT-10`).
- [x] 5.2 Update `frontend/src/services/apiClient.ts` to include `credentials: 'include'` and `isUnauthorizedError`, and create `frontend/src/services/authService.ts` and `frontend/src/services/userService.ts` (plus service tests).
- [x] 5.3 Create bilingual dictionaries `frontend/src/i18n/authEn.ts` and `frontend/src/i18n/authPtBR.ts`, merge them into `en.ts` and `ptBR.ts`, and update `frontend/src/i18n/I18nContext.tsx` to sync `/api/preferences` only when authenticated (reloading on user change/login and falling back to `localStorage`/browser locale when signed out).
- [x] 5.4 Create `frontend/src/hooks/AuthContext.tsx` and `frontend/src/hooks/useAuth.ts` managing initial `/api/auth/me` probe, standard login, DEV login, logout, and session refresh state.
- [x] 5.5 Create `frontend/src/components/auth/ProtectedRoute.tsx`, `AdminRoute.tsx`, `PasswordField.tsx`, and `frontend/src/components/layout/AccountMenu.tsx`, and integrate `AuthProvider`, route guards, and `AccountMenu` into `Header.tsx` and `App.tsx`.
- [x] 5.6 Add and update unit/component tests for `passwordHasher`, `apiClient`, `authService`, `userService`, `ProtectedRoute`, `AdminRoute`, `Header`/`AccountMenu`, and `I18nContext` (`UT-10`, `UT-14`).

## Implementation details

Follow `techspec.md` sections:
- **System architecture → Component overview** (Frontend New & Modified Components)
- **Implementation design → Primary interfaces** (`FrontendPasswordHasher`)
- **Integration points** (`bcryptjs`, CORS & Cookie Transport)

## Related acceptance criteria

- AC-02
- AC-03
- AC-07
- AC-09

## Task tests

### Unit tests (if applicable)

- [x] UT-10 - `passwordHasher` (frontend): 8–60 char validation & async `bcryptjs` hashing
- [x] UT-14 - `ProtectedRoute`, `AdminRoute`, `Header`/`AccountMenu`, `I18nContext`

### Integration tests (if applicable)

Not applicable in this task (backend HTTP integration covered in Task 4.0).

### E2E tests (if applicable)

Not applicable in this task (covered in Task 8.0).

## Relevant files

- `frontend/package.json`
- `frontend/package-lock.json`
- `frontend/src/types/auth.ts`
- `frontend/src/services/passwordHasher.ts`
- `frontend/src/services/passwordHasher.test.ts`
- `frontend/src/services/apiClient.ts`
- `frontend/src/services/apiClient.test.ts`
- `frontend/src/services/authService.ts`
- `frontend/src/services/userService.ts`
- `frontend/src/hooks/AuthContext.tsx`
- `frontend/src/hooks/useAuth.ts`
- `frontend/src/i18n/authEn.ts`
- `frontend/src/i18n/authPtBR.ts`
- `frontend/src/i18n/en.ts`
- `frontend/src/i18n/ptBR.ts`
- `frontend/src/i18n/I18nContext.tsx`
- `frontend/src/components/auth/ProtectedRoute.tsx`
- `frontend/src/components/auth/AdminRoute.tsx`
- `frontend/src/components/auth/PasswordField.tsx`
- `frontend/src/components/layout/AccountMenu.tsx`
- `frontend/src/components/layout/Header.tsx`
- `frontend/src/components/layout/layoutAndCommon.test.tsx`
- `frontend/src/App.tsx`
