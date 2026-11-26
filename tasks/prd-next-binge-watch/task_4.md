# Task 4.0: Frontend Foundation, Routing, i18n (`en`/`pt-BR`), API Client, and Shared Layout

## Overview

Set up the frontend application shell, testing infrastructure, routing, internationalization (`en` and `pt-BR`), backend HTTP client, health polling, and shared WCAG 2.1 AA layout and feedback components (including the language switcher, localized API status badge, and TVmaze CC BY-SA footer attribution).

<skills>
### Skill compliance

- `.agents/skills/react/SKILL.md`: Load and follow all React 19 rules — single-responsibility components ≤ 30 lines, explicit props (no prop spreading), `useEffect` restricted to external synchronization (backend fetches, health timer, `<html lang>` sync), Tailwind utility classes, and semantic HTML with full `aria-*` attributes. Aligned with `folder-structure.md`, place API modules in `frontend/src/services/`.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules under `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- `AGENTS.md`: Keep frontend API calls directed exclusively to the backend via Vite proxy (`/api`, `/health`) or `VITE_API_URL`, and validate with `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build`. Authorized deviation: support `en` (default) and `pt-BR` UI copy per PRD.
- `code-standards.md`: Keep `.ts`/`.tsx` files ≤ 100 lines, functions/components ≤ 30 lines, ≤ 3 parameters, guard clauses, no blank lines inside functions, extracted constants.
- `javascript-typescript.md`: Zero `any`, explicit types, `const`, strict comparisons, ESLint compliance.
- `tests.md`: Configure Vitest + `@vitest/coverage-v8` + jsdom + Testing Library with mandatory ≥ 80% coverage threshold.
- `folder-structure.md`: Organize under `frontend/src/{types,i18n,services,hooks,components/layout,components/common,views}` with no direct `fetch` in components or views.
</rules>

<requirements>
- FR19, FR20, FR21, FR22: Auto-detect browser language (`pt*` → `pt-BR`, fallback `en`), provide an always-accessible manual language switcher persisted via the backend, and automatically send `lang` on all backend requests.
- FR23: Retain a localized, non-color-only backend API connectivity status indicator polling `/health`.
- FR24: Display persistent TVmaze CC BY-SA attribution with clickable link to `https://www.tvmaze.com` in the footer.
</requirements>

## Subtasks

- [x] 4.1 Install frontend dependencies (`react-router-dom`, `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`) via `npm`, update `frontend/vite.config.ts` (dev proxy for `/api` and `/health` + Vitest 80% coverage config), add `test` script to `frontend/package.json`, and update `frontend/index.html` title to `NEXT BINGE WATCH`.
- [x] 4.2 Create `frontend/src/types/` per-concept contracts (`locale.ts`, `api.ts`, `search.ts`, `series.ts`, `person.ts`, `watchlist.ts`, `recommendation.ts`, `health.ts`).
- [x] 4.3 Implement `frontend/src/i18n/detectLocale.ts`, typed translation dictionaries `en.ts` and `ptBR.ts` (compile-time key parity), `I18nContext.tsx` (backend preference hydration + `<html lang>` sync + persistence), and `frontend/src/hooks/useI18n.ts`.
- [x] 4.4 Implement `frontend/src/services/apiClient.ts` (exclusive backend calls via `VITE_API_URL` or proxy, automatic `lang` param, normalized `ApiErrorResponse`), `healthService.ts`, `preferencesService.ts`, and `frontend/src/hooks/useApiHealth.ts`.
- [x] 4.5 Implement accessible `components/layout/` (`AppLayout`, `Header`, `LanguageSwitcher`, `ApiStatusBadge`, `FooterAttribution`), `components/common/` (`LoadingState`, `EmptyState`, `ErrorState`, `MediaImage`, `StatusBadge`), `views/NotFoundView.tsx`, and route shell in `frontend/src/App.tsx`; verify unit tests, lint, typecheck, and build.

## Implementation details

Refer to [techspec.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/techspec.md):
- **System architecture → Component overview (Frontend)**
- **Implementation design → Data models (`ApiErrorResponse`, `UserPreferences`)**
- **Implementation design → API endpoints (`GET /health`, `GET/PUT /api/preferences`)**
- **Technical considerations → Key decisions & Skill compliance**

## Related acceptance criteria

- AC-10
- AC-11
- AC-13
- AC-14
- AC-15

## Task tests

### Unit tests

- [x] UT-10 - Frontend `detectLocale` maps `pt-BR`/`pt` to `pt-BR` and unsupported locales (`fr-FR`) to `en`
- [x] UT-13 - Frontend `ApiStatusBadge`, `ErrorState`, and `FooterAttribution` display connectivity states, retry actions, and CC BY-SA link

### Integration tests

Not applicable for this task (backend HTTP integration covered in Tasks 1.0–3.0).

### E2E tests

Not applicable for this task (covered in Task 8.0).

## Relevant files

- `frontend/package.json`
- `frontend/vite.config.ts`
- `frontend/index.html`
- `frontend/src/App.tsx`
- `frontend/src/types/*.ts`
- `frontend/src/i18n/detectLocale.ts`
- `frontend/src/i18n/en.ts`
- `frontend/src/i18n/ptBR.ts`
- `frontend/src/i18n/I18nContext.tsx`
- `frontend/src/services/apiClient.ts`
- `frontend/src/services/healthService.ts`
- `frontend/src/services/preferencesService.ts`
- `frontend/src/hooks/useI18n.ts`
- `frontend/src/hooks/useApiHealth.ts`
- `frontend/src/components/layout/*.tsx`
- `frontend/src/components/common/*.tsx`
- `frontend/src/views/NotFoundView.tsx`
