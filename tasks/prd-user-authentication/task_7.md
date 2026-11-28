# Task 7.0: Frontend Admin User Management View (`/admin/users`), Role/Status Controls, and Create/Delete User Modals

## Overview

Implement the `ADMIN`-only user management experience under `/admin/users`: `useAdminUsers` state hook, responsive `UserTable` and `UserRow` components (handling up to 254-char emails and 39-char usernames with zero horizontal overflow on `375px` mobile), `CreateUserModal` with full client-side validation and `bcryptjs` credential hashing, self-lockout UI protection, delete confirmation via the existing `ConfirmDialog`, and component unit tests (`UT-13`).

<skills>
### Skill compliance

Applicable skill: **`.agents/skills/react/SKILL.md` (`react`)** — must be loaded and followed for all components, hooks, accessibility (WCAG 2.1 AA, ARIA labels, Escape-to-close via `useEscapeKey`, opaque modal backdrops), explicit props, ≤ 30-line components, and Tailwind CSS Cyber-Neon styling.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`, `folder-structure.md`) were read and apply:
- Keep every non-test `.ts`/`.tsx` file ≤ 100 lines, functions/components ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, zero `any`, and zero JSX prop spreading.
- Reuse existing `ConfirmDialog`, `PasswordField`, and `useEscapeKey` instead of duplicating modal or confirmation logic.
- Validate username (`1–39`, `[A-Za-z0-9-]`), email (valid format, `≤ 254`), password (`8–60`), and role (`ADMIN` | `USER`) before hashing with `bcryptjs` and calling `userService`.
- Verify `cd frontend && npm test && npm run lint && npm run typecheck && npm run build` passes with ≥ 80% coverage.
</rules>

<requirements>
- FR1, FR3, FR6, FR12, FR16, FR17, FR18, FR19, FR20, FR28
</requirements>

## Subtasks

- [x] 7.1 Create `frontend/src/hooks/useAdminUsers.ts` managing user list loading, create user (hashing initial password via `passwordHasher`), role updates, deactivate/reactivate toggles, delete user, and localized error/success state.
- [x] 7.2 Create `frontend/src/components/admin/CreateUserModal.tsx` (using `PasswordField` and `useEscapeKey`) validating username (`^[A-Za-z0-9-]{1,39}$`), email (format, max 254 chars), initial password (8–60 chars), and role (`ADMIN` | `USER`) with inline accessible errors.
- [x] 7.3 Create `frontend/src/components/admin/UserRow.tsx` and `frontend/src/components/admin/UserTable.tsx` rendering user metadata, role selector, active/deactivated status badge and toggle, and delete trigger with self-row controls disabled and safe text wrapping (`min-w-0`, `break-words [overflow-wrap:anywhere]`) for mobile viewports.
- [x] 7.4 Create `frontend/src/views/AdminUsersView.tsx` composing `UserTable`, `CreateUserModal`, and `ConfirmDialog` for permanent deletion warnings, and wire `/admin/users` (wrapped in `AdminRoute`) in `App.tsx`.
- [x] 7.5 Add comprehensive component and hook tests in `frontend/src/views/AdminUsersView.test.tsx` (`UT-13`).

## Implementation details

Follow `techspec.md` sections:
- **System architecture → Component overview** (Frontend Admin components & views)
- **Implementation design → Data models** (`AuthUser`, `CreateUserRequest`, `UpdateUserRequest`)
- **User experience** in `prd.md` (Admin User Management Flow, responsive & WCAG 2.1 AA guidelines)

## Related acceptance criteria

- AC-05
- AC-06
- AC-09

## Task tests

### Unit tests (if applicable)

- [x] UT-13 - `AdminUsersView` & `CreateUserModal`: list, create, role, status, delete modal

### Integration tests (if applicable)

Not applicable in this task (covered in Task 4.0).

### E2E tests (if applicable)

Not applicable in this task (covered in Task 8.0).

## Relevant files

- `frontend/src/hooks/useAdminUsers.ts`
- `frontend/src/components/admin/CreateUserModal.tsx`
- `frontend/src/components/admin/UserRow.tsx`
- `frontend/src/components/admin/UserTable.tsx`
- `frontend/src/views/AdminUsersView.tsx`
- `frontend/src/views/AdminUsersView.test.tsx`
- `frontend/src/components/common/ConfirmDialog.tsx`
- `frontend/src/App.tsx`
