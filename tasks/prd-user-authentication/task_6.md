# Task 6.0: Frontend Login (+ Localhost DEV Mode), Change Password View, and Public Discovery Auth Prompts

## Overview

Implement the user-facing authentication views and hooks: the `/login` screen with two-stage `bcryptjs` submission and double-locked `localhost` DEV Mode one-click login (`DevLoginPanel`), the `/account/password` self-service password-change view (`ChangePasswordView`), and unauthenticated sign-in routing/prompts on public discovery views (`SeriesProfileView`, `PersonProfileView`, `NextBingeSection`), verified by component unit tests (`UT-11`, `UT-12`).

<skills>
### Skill compliance

Applicable skill: **`.agents/skills/react/SKILL.md` (`react`)** — must be loaded and followed for all components, custom hooks, accessibility (WCAG 2.1 AA, ARIA labels/alerts, keyboard navigation, focus rings), explicit props, ≤ 30-line components, and Tailwind CSS Cyber-Neon styling.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`, `folder-structure.md`) were read and apply:
- Keep every non-test `.ts`/`.tsx` file ≤ 100 lines, functions/components ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, zero `any`, and zero JSX prop spreading.
- Enforce strict double-lock on `DevLoginPanel`: render only when `import.meta.env.DEV` is true AND `window.location.hostname` is `localhost` or `127.0.0.1`.
- Ensure plaintext passwords never leave `authService` / `passwordHasher` payloads.
- Verify `cd frontend && npm test && npm run lint && npm run typecheck && npm run build` passes with ≥ 80% coverage.
</rules>

<requirements>
- FR5, FR6, FR7, FR8, FR9, FR10, FR13, FR14, FR15, FR21, FR22, FR23, FR27, FR28
</requirements>

## Subtasks

- [x] 6.1 Create `frontend/src/hooks/useLoginForm.ts` and `frontend/src/hooks/useDevUsers.ts` (including pure `isDevAuthUiEnabled` helper checking `import.meta.env.DEV` and `localhost`/`127.0.0.1`).
- [x] 6.2 Create `frontend/src/components/auth/DevLoginPanel.tsx` and `frontend/src/views/LoginView.tsx` with username/email + `PasswordField`, return-to-origin redirect (`location.state.from`), DEV Mode one-click user buttons (disabling inactive users), and full bilingual `en`/`pt-BR` copy.
- [x] 6.3 Create `frontend/src/hooks/useChangePassword.ts` and `frontend/src/views/ChangePasswordView.tsx` requiring current password, new password (8–60 chars, distinct from current), and confirmation, submitting only `bcryptjs`-hashed credentials and displaying localized feedback.
- [x] 6.4 Update `SeriesProfileView.tsx`, `PersonProfileView.tsx`, and `NextBingeSection.tsx` (and related hooks if needed) so unauthenticated visitors browse catalog details cleanly without personal list badges and clicking list/tracking actions navigates to `/login` with return state.
- [x] 6.5 Wire `LoginView` (`/login`) and `ChangePasswordView` (`/account/password`) into `App.tsx`, update affected view tests, and add `LoginView.test.tsx` and `ChangePasswordView.test.tsx` (`UT-11`, `UT-12`).

## Implementation details

Follow `techspec.md` sections:
- **System architecture → Component overview** (Frontend Login, DEV Mode, Change Password, Public Discovery updates)
- **Implementation design → Data models** (`LoginRequest`, `ChangePasswordRequest`, `DevUsersResponse`)
- **User experience** in `prd.md` (Login Flow, Change Password Flow, Cyber-Neon & WCAG 2.1 AA guidelines)

## Related acceptance criteria

- AC-02
- AC-03
- AC-04
- AC-08
- AC-09

## Task tests

### Unit tests (if applicable)

- [x] UT-11 - `LoginView` & `DevLoginPanel`: login form, payload has no plaintext, DEV gate
- [x] UT-12 - `ChangePasswordView`: current/new/confirm validation & localized feedback

### Integration tests (if applicable)

Not applicable in this task (covered in Task 4.0).

### E2E tests (if applicable)

Not applicable in this task (covered in Task 8.0).

## Relevant files

- `frontend/src/hooks/useLoginForm.ts`
- `frontend/src/hooks/useDevUsers.ts`
- `frontend/src/components/auth/DevLoginPanel.tsx`
- `frontend/src/views/LoginView.tsx`
- `frontend/src/views/LoginView.test.tsx`
- `frontend/src/hooks/useChangePassword.ts`
- `frontend/src/views/ChangePasswordView.tsx`
- `frontend/src/views/ChangePasswordView.test.tsx`
- `frontend/src/views/SeriesProfileView.tsx`
- `frontend/src/views/SeriesProfileView.test.tsx`
- `frontend/src/views/PersonProfileView.tsx`
- `frontend/src/views/PersonProfileView.test.tsx`
- `frontend/src/components/recommendation/NextBingeSection.tsx`
- `frontend/src/views/HomeView.test.tsx`
- `frontend/src/App.tsx`
