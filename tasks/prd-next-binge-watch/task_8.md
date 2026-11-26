# Task 8.0: End-to-End Test Suite (Playwright) and Full Verification

## Overview

Set up the root `e2e/` Playwright test suite outside `frontend/` and `backend/`, implement `E2E-01` through `E2E-05` verifying every critical user flow against the live frontend and backend (with isolated SQLite test persistence and deterministic failure fixtures), and run the complete validation suite across both applications.

<skills>
### Skill compliance

- `.agents/skills/react/SKILL.md`: Validate semantic roles, keyboard focusability, accessible labels, and responsive Tailwind layouts across all rendered React views.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules under `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- `tests.md`: Place Playwright specs under root `e2e/*.spec.ts` (outside `frontend/` and `backend/`), keep tests fast, independent, repeatable, and self-validated, and confirm ≥ 80% coverage thresholds pass in both `frontend/` and `backend/`.
- `folder-structure.md`: Keep `e2e/` isolated at the repository root without coupling frontend or backend packages.
- `AGENTS.md`: Verify `npm test`, `npm run lint`, `npm run typecheck`, `npm run build` in `frontend/` and `npm test`, `npm run build` in `backend/`.
</rules>

<requirements>
- FR1–FR24: End-to-end validation of unified search, Show ↔ Person cross-navigation, Watchlist & episode/season SQLite persistence, "Next Binge Watch" recommendations, bilingual `en`/`pt-BR` detection/switching/AKA/errors, backend API status, TVmaze CC BY-SA attribution, and responsive WCAG 2.1 AA keyboard accessibility.
</requirements>

## Subtasks

- [x] 8.1 Initialize root `e2e/` workspace (`package.json`, `playwright.config.ts`) configured to launch the backend (with an isolated temporary SQLite database) and frontend dev/preview server.
- [x] 8.2 Implement `e2e/discovery-navigation.spec.ts` (`E2E-01`: partial search, scope filtering, Series Profile, Cast/Crew click to Person Profile, credited series click back to Series Profile, and TVmaze CC BY-SA links) and confirm zero direct browser calls to `api.tvmaze.com`.
- [x] 8.3 Implement `e2e/watchlist-recommendations.spec.ts` (`E2E-02` and `E2E-03`: add series, toggle episode and full season, reload to verify SQLite persistence & status filters, verify Next Binge Watch empty-watchlist discovery, active-watcher priority, and suggestion cycling).
- [x] 8.4 Implement `e2e/i18n-resilience-a11y.spec.ts` (`E2E-04` and `E2E-05`: `pt-BR` browser auto-detection, `fr-FR` → `en` fallback, manual switch + reload persistence + AKA title + localized error messages, empty search state, upstream/offline error recovery with retry, and responsive 375px & 1280px keyboard accessibility).
- [x] 8.5 Run full validation: `backend/` (`npm test`, `npm run build`), `frontend/` (`npm test`, `npm run lint`, `npm run typecheck`, `npm run build`), and `e2e/` (`npx playwright test`).

## Implementation details

Refer to [techspec.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/techspec.md):
- **Testing approach → E2E tests (`E2E-01`–`E2E-05`)**
- **Development sequencing → Build order & Technical dependencies**

## Related acceptance criteria

- AC-01
- AC-02
- AC-03
- AC-04
- AC-05
- AC-06
- AC-07
- AC-08
- AC-09
- AC-10
- AC-11
- AC-12
- AC-13
- AC-14
- AC-15

## Task tests

### Unit tests

Not applicable for this task (verified via `frontend/` and `backend/` Vitest suites).

### Integration tests

Not applicable for this task (verified via `backend/` Supertest suite).

### E2E tests

- [x] E2E-01 - Search partial title, filter scope, open Series Profile, navigate to Cast/Crew Person Profile, and return to credited Series Profile
- [x] E2E-02 - Add series to Watchlist, toggle individual episode and full season, reload page, and verify persistence & status filters
- [x] E2E-03 - Verify "Next Binge Watch" recommendation on empty watchlist and after starting a series, plus cycling suggestions
- [x] E2E-04 - Auto-detect `pt-BR` browser locale, verify fallback `en`, switch language manually, reload, and verify localized UI, AKA title, and error messages
- [x] E2E-05 - Verify empty search state, upstream/backend error recovery with retry, and responsive keyboard accessibility at 375px and 1280px

## Relevant files

- `e2e/package.json`
- `e2e/playwright.config.ts`
- `e2e/discovery-navigation.spec.ts`
- `e2e/watchlist-recommendations.spec.ts`
- `e2e/i18n-resilience-a11y.spec.ts`
