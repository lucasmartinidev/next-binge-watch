# Task 7.0: Frontend Person Profile View and Watchlist View

## Overview

Implement the Person Profile screen (`/people/:id`) with biographical metadata, canonical TVmaze link, and clickable Cast and Crew series credit lists linking back to `/series/:id`, alongside the Watchlist screen (`/watchlist`) with status filter tabs (`All`, `Want to Watch`, `Watching`, `Watched`), episode progress bars, quick status updates, and removal controls.

<skills>
### Skill compliance

- `.agents/skills/react/SKILL.md`: Load and follow all React 19 rules — components ≤ 30 lines, explicit props, data loading and filtering encapsulated in `usePersonProfile` and `useWatchlist` hooks, Tailwind CSS styling, and accessible tab/card semantics.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules under `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- `code-standards.md`: Keep files ≤ 100 lines, functions/components ≤ 30 lines, ≤ 3 parameters, guard clauses, no blank lines inside functions.
- `javascript-typescript.md`: Zero `any`, explicit types, strict comparisons, ESLint clean.
- `tests.md`: ≥ 80% coverage across frontend components, hooks, and services with Vitest + Testing Library.
- `folder-structure.md`: Keep HTTP access in `services/personService.ts` and `services/watchlistService.ts`, state in `hooks/`, reusable UI in `components/person/` and `components/watchlist/`, and pages in `views/`.
</rules>

<requirements>
- FR8, FR9, FR10: Load Person Profile by ID, display portrait/placeholder, biographical metadata, TVmaze source link, separated Cast and Crew series credits, and cross-navigate from any credited series to `/series/:id`.
- FR11, FR12: Display persisted watchlist entries with localized AKA title, progress summary, next unwatched episode indicator, status filter tabs (`All`, `Want to Watch`, `Watching`, `Watched`), status change, and remove actions.
- FR22, FR24: Full `en`/`pt-BR` localization, partial degradation handling for credits, and TVmaze attribution links.
</requirements>

## Subtasks

- [x] 7.1 Implement `frontend/src/services/personService.ts`, `frontend/src/hooks/usePersonProfile.ts`, and `frontend/src/hooks/useWatchlist.ts` (status filtering, status mutation, removal, locale sync, and error/retry state).
- [x] 7.2 Implement `frontend/src/components/person/` (`PersonHeader.tsx`, `PersonBioList.tsx`, `SeriesCreditCard.tsx`, `PersonCreditsList.tsx`) handling missing portraits, empty credits, and partial degradation (`castCredits: null` or `crewCredits: null`) gracefully, linking every credited series to `/series/:id`.
- [x] 7.3 Implement `frontend/src/components/watchlist/` (`WatchlistFilterTabs.tsx`, `WatchlistCard.tsx`) reusing `ProgressBar.tsx` and supporting keyboard-accessible status tabs, inline status updates, and removal.
- [x] 7.4 Compose `frontend/src/views/PersonProfileView.tsx` and `frontend/src/views/WatchlistView.tsx`, connect `/people/:id` and `/watchlist` in `frontend/src/App.tsx`, and verify full frontend checks (`npm test` ≥ 80% coverage, `npm run lint`, `npm run typecheck`, `npm run build`).

## Implementation details

Refer to [techspec.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/techspec.md):
- **System architecture → Component overview (Frontend)**
- **Implementation design → Data models (`PersonProfile`, `WatchlistItem`)**
- **Implementation design → API endpoints (`GET /api/people/:id`, `GET /api/watchlist`, `PATCH /api/watchlist/:seriesId`, `DELETE /api/watchlist/:seriesId`)**

## Related acceptance criteria

- AC-05
- AC-06
- AC-11
- AC-13
- AC-14
- AC-15

## Task tests

### Unit tests

- [x] UT-12 - Frontend `SeriesProfileView` and `PersonProfileView` render metadata, cast/crew links, episode toggles, and TVmaze attribution (PersonProfileView & WatchlistView scope)

### Integration tests

Not applicable for this task (covered on backend in Tasks 2.0–3.0).

### E2E tests

Not applicable for this task (covered in Task 8.0).

## Relevant files

- `frontend/src/services/personService.ts`
- `frontend/src/hooks/usePersonProfile.ts`
- `frontend/src/hooks/useWatchlist.ts`
- `frontend/src/components/person/PersonHeader.tsx`
- `frontend/src/components/person/PersonBioList.tsx`
- `frontend/src/components/person/SeriesCreditCard.tsx`
- `frontend/src/components/person/PersonCreditsList.tsx`
- `frontend/src/components/watchlist/WatchlistFilterTabs.tsx`
- `frontend/src/components/watchlist/WatchlistCard.tsx`
- `frontend/src/views/PersonProfileView.tsx`
- `frontend/src/views/WatchlistView.tsx`
- `frontend/src/App.tsx`
