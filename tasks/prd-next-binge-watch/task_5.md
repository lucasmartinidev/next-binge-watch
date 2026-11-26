# Task 5.0: Frontend Home View, Unified Search, and Next Binge Watch Spotlight

## Overview

Implement the home experience (`HomeView`) combining the unified partial-query search bar with content-type filtering (`All`, `Series`, `People`), typed search result cards linking to `/series/:id` and `/people/:id`, and the "Next Binge Watch" recommendation spotlight with localized rationale, quick actions, and cycling to alternative suggestions.

<skills>
### Skill compliance

- `.agents/skills/react/SKILL.md`: Load and follow all React 19 rules — components ≤ 30 lines, explicit props (no spread), state and backend fetching encapsulated in `useSearch` and `useNextBinge` hooks, Tailwind CSS styling, accessible `aria-live` result announcements, and keyboard-operable filter controls.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules under `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- `code-standards.md`: Keep files ≤ 100 lines, functions/components ≤ 30 lines, ≤ 3 parameters, guard clauses, no blank lines inside functions.
- `javascript-typescript.md`: Zero `any`, explicit types, strict comparisons, ESLint clean.
- `tests.md`: ≥ 80% coverage with Vitest + Testing Library validating visible accessible behavior and interactions.
- `folder-structure.md`: Keep backend calls in `services/`, state/effects in `hooks/`, UI building blocks in `components/search/` and `components/recommendation/`, and screen composition in `views/HomeView.tsx`.
</rules>

<requirements>
- FR1, FR2, FR3, FR4: Partial search input, scope filter (`All` / `Series` / `People`), typed result cards with preview metadata and clear/refine controls, empty/error states, and ID-based profile navigation.
- FR16, FR17, FR18: Prominent "Next Binge Watch" highlight with next unwatched episode when applicable, localized explanation, quick actions (open profile, add to watchlist, show another suggestion).
- FR22, FR24: Full `en`/`pt-BR` copy, localized AKA title display when available, and responsive WCAG 2.1 AA presentation.
</requirements>

## Subtasks

- [x] 5.1 Implement `frontend/src/services/searchService.ts`, `frontend/src/services/recommendationService.ts`, `frontend/src/hooks/useSearch.ts`, and `frontend/src/hooks/useNextBinge.ts` (including `excludeIds` cycling and locale-reactive refetch).
- [x] 5.2 Implement `frontend/src/components/search/` (`SearchForm.tsx`, `SearchScopeFilter.tsx`, `SearchResultCard.tsx`, `SearchResultList.tsx`) with clear `Series` vs `Person` badges, accessible placeholders, and `aria-live` results summary.
- [x] 5.3 Implement `frontend/src/components/recommendation/` (`NextBingeCard.tsx`, `NextBingeSection.tsx`) displaying localized recommendation rationale, next episode pointer when present, profile navigation, add-to-watchlist action, and "Show Another" cycle button.
- [x] 5.4 Compose `frontend/src/views/HomeView.tsx`, connect route `/` in `frontend/src/App.tsx`, and run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` in `frontend/`.

## Implementation details

Refer to [techspec.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/techspec.md):
- **System architecture → Component overview (Frontend)**
- **Implementation design → Data models (`SearchResultItem`, `SearchResponse`, `NextBingeResponse`)**
- **Implementation design → API endpoints (`GET /api/search`, `GET /api/recommendations/next-binge`)**

## Related acceptance criteria

- AC-01
- AC-02
- AC-08
- AC-09
- AC-12
- AC-13
- AC-14
- AC-15

## Task tests

### Unit tests

- [x] UT-11 - Frontend `SearchForm`, `SearchScopeFilter`, and `EmptyState` render accessible controls and filter results

### Integration tests

Not applicable for this task (covered on backend in Tasks 2.0–3.0).

### E2E tests

Not applicable for this task (covered in Task 8.0).

## Relevant files

- `frontend/src/services/searchService.ts`
- `frontend/src/services/recommendationService.ts`
- `frontend/src/hooks/useSearch.ts`
- `frontend/src/hooks/useNextBinge.ts`
- `frontend/src/components/search/SearchForm.tsx`
- `frontend/src/components/search/SearchScopeFilter.tsx`
- `frontend/src/components/search/SearchResultCard.tsx`
- `frontend/src/components/search/SearchResultList.tsx`
- `frontend/src/components/recommendation/NextBingeCard.tsx`
- `frontend/src/components/recommendation/NextBingeSection.tsx`
- `frontend/src/views/HomeView.tsx`
- `frontend/src/App.tsx`
