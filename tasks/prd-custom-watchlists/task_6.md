# Task 6.0: Playwright End-to-End Test Suite (`e2e/custom-watchlists.spec.ts`) and Full Regression Verification

## Overview

Implement comprehensive Playwright end-to-end tests (`E2E-01`–`E2E-04`) validating the complete Custom Watchlists and Ubiquitous List Membership experience against PostgreSQL 18.7, and run full backend, frontend, and E2E regression suites with ≥ 80% coverage across both applications.

<skills>
### Skill compliance

- **`react` (`.agents/skills/react/SKILL.md`):** Apply if any accessibility attributes or component selectors require adjustment during E2E stabilization.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- Place E2E tests under root `e2e/` outside `frontend/` and `backend/` (`tests.md`, `folder-structure.md`).
- Validate user-visible flows, persistence across reload, bilingual `en`/`pt-BR` behavior, keyboard accessibility, and mobile responsiveness without touching the local development database (`tests.md`, `AGENTS.md`).
- Execute all required validation commands in `backend/`, `frontend/`, and `e2e/` (`AGENTS.md`).
</rules>

<requirements>
- **AC-01–AC-12:** End-to-end validation of primary list icon/color customization & protection, custom Series/People list CRUD + type/tag filters + safe deletion, single-edit multi-select modal for Series & People, ubiquitous badges across all 5 series surfaces and 2 person surfaces, `+N` overflow disclosure, click-to-list navigation, bilingual `en`/`pt-BR`, keyboard accessibility, and 375px mobile layout.
</requirements>

## Subtasks

- [x] 6.1 Create `e2e/custom-watchlists.spec.ts` covering `E2E-01` (primary list customization & protection) and `E2E-02` (custom Series & People list CRUD, type/tag filters, and safe deletion preserving watched episodes).
- [x] 6.2 Add `E2E-03` (single-edit multi-select modal for Series & People + ubiquitous badges across Recommendation, Search, Series Profile, My Lists, and Person Credits + badge navigation) and `E2E-04` (`+N` overflow disclosure, `en`/`pt-BR` localization, keyboard a11y, and 375px mobile responsiveness) to `e2e/custom-watchlists.spec.ts`.
- [x] 6.3 Ensure existing Playwright specs (`discovery-navigation.spec.ts`, `watchlist-recommendations.spec.ts`, `i18n-resilience-a11y.spec.ts`) remain green against the updated My Lists hub and cards.
- [x] 6.4 Run full validation across `backend/` (`npm test && npm run build`), `frontend/` (`npm test && npm run lint && npm run typecheck && npm run build`), and `e2e/` (`npx playwright test`) against PostgreSQL 18.7, confirming ≥ 80% coverage across every metric and zero leftover processes/ports.

## Implementation details

Follow `tasks/prd-custom-watchlists/techspec.md` sections:
- **Testing approach → E2E tests** (`E2E-01`, `E2E-02`, `E2E-03`, `E2E-04`)

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

## Task tests

### Unit tests (if applicable)

Re-verify full `backend/` and `frontend/` Vitest suites pass with ≥ 80% coverage.

### Integration tests (if applicable)

Re-verify full `backend/` PostgreSQL integration suite passes against `next_binge_watch_test`.

### E2E tests (if applicable)

- [x] E2E-01 - Customize primary list icon & color, verify protection and badge propagation
- [x] E2E-02 - Custom Series & People list CRUD, type/tag filters, and safe deletion preserving episodes
- [x] E2E-03 - Unified multi-select modal for Series & People + ubiquitous badges across all 5 surfaces
- [x] E2E-04 - Overflow `+N` disclosure, bilingual `en`/`pt-BR` localization, keyboard a11y & 375px mobile

## Relevant files

- `e2e/custom-watchlists.spec.ts`
- `e2e/discovery-navigation.spec.ts`
- `e2e/watchlist-recommendations.spec.ts`
- `e2e/i18n-resilience-a11y.spec.ts`
- `e2e/playwright.config.ts`
