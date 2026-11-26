# Task 6.0: Frontend Series Profile View, Cast/Crew Navigation, and Season/Episode Tracker

## Overview

Implement the Series Profile screen (`/series/:id`), displaying rich series metadata (including `pt-BR` localized AKA title alongside the original title), sanitized synopsis, canonical TVmaze link, watchlist add/remove/status controls, interactive season and episode watched toggles with progress bar, and clickable Cast and Crew grids linking directly to Person Profiles (`/people/:id`).

<skills>
### Skill compliance

- `.agents/skills/react/SKILL.md`: Load and follow all React 19 rules — granular components ≤ 30 lines, explicit props, data fetching and mutations encapsulated in `useSeriesProfile` hook, Tailwind CSS styling, accessible accordion/checkbox/status controls, and semantic landmarks.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules under `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- `code-standards.md`: Keep files ≤ 100 lines, functions/components ≤ 30 lines, ≤ 3 parameters, guard clauses, no blank lines inside functions.
- `javascript-typescript.md`: Zero `any`, explicit types, immutable state updates when toggling episodes/seasons, ESLint clean.
- `tests.md`: ≥ 80% coverage with Vitest + Testing Library covering profile rendering, AKA display, partial degradation (`crew: null`), cast/crew links, and episode/season toggling.
- `folder-structure.md`: Keep backend calls in `services/`, state orchestration in `hooks/`, UI components in `components/series/` and `components/watchlist/ProgressBar.tsx`, and screen composition in `views/SeriesProfileView.tsx`.
</rules>

<requirements>
- FR4, FR5, FR6, FR7: Load Series Profile by ID, display full metadata, sanitized synopsis, TVmaze link, Cast (with characters), Crew (with roles), and cross-navigate from any cast/crew member to `/people/:id`.
- FR11, FR13, FR14, FR15: Add/remove series from watchlist, switch watch status (`Want to Watch`, `Watching`, `Watched`), toggle individual episodes or entire seasons watched/unwatched, and show updated completion progress and next unwatched episode.
- FR22, FR24: Surface localized `pt-BR` AKA title when present and display clickable TVmaze source link.
</requirements>

## Subtasks

- [x] 6.1 Implement `frontend/src/services/seriesService.ts`, `frontend/src/services/watchlistService.ts`, and `frontend/src/hooks/useSeriesProfile.ts` (fetching by ID + locale, optimistic/synced watchlist status updates, single-episode and full-season toggles, error & retry state).
- [x] 6.2 Implement `frontend/src/components/watchlist/ProgressBar.tsx` and `frontend/src/components/series/` header & tracking components (`SeriesHeader.tsx`, `SeriesMetaList.tsx`, `WatchlistControls.tsx`) with localized AKA display, TVmaze attribution link, and accessible status selectors.
- [x] 6.3 Implement `frontend/src/components/series/` cast/crew and episode components (`PersonCreditCard.tsx`, `CastGrid.tsx`, `CrewGrid.tsx`, `EpisodeRow.tsx`, `SeasonEpisodeList.tsx`) handling empty/partial-degradation (`crew: null`) states cleanly and linking cast/crew cards to `/people/:id`.
- [x] 6.4 Compose `frontend/src/views/SeriesProfileView.tsx`, connect `/series/:id` in `frontend/src/App.tsx`, and run `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` in `frontend/`.

## Implementation details

Refer to [techspec.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/techspec.md):
- **System architecture → Component overview (Frontend)**
- **Implementation design → Data models (`SeriesProfile`, `SeriesTrackingState`, partial degradation variant)**
- **Implementation design → API endpoints (`GET /api/series/:id`, `POST/PATCH/DELETE /api/watchlist*`, `PUT /api/watchlist/:seriesId/episodes/:episodeId`, `PUT /api/watchlist/:seriesId/seasons/:seasonNumber`)**

## Related acceptance criteria

- AC-03
- AC-04
- AC-06
- AC-07
- AC-11
- AC-13
- AC-14
- AC-15

## Task tests

### Unit tests

- [x] UT-12 - Frontend `SeriesProfileView` and `PersonProfileView` render metadata, cast/crew links, episode toggles, and TVmaze attribution (SeriesProfileView scope)

### Integration tests

Not applicable for this task (covered on backend in Tasks 2.0–3.0).

### E2E tests

Not applicable for this task (covered in Task 8.0).

## Relevant files

- `frontend/src/services/seriesService.ts`
- `frontend/src/services/watchlistService.ts`
- `frontend/src/hooks/useSeriesProfile.ts`
- `frontend/src/components/watchlist/ProgressBar.tsx`
- `frontend/src/components/series/SeriesHeader.tsx`
- `frontend/src/components/series/SeriesMetaList.tsx`
- `frontend/src/components/series/WatchlistControls.tsx`
- `frontend/src/components/series/PersonCreditCard.tsx`
- `frontend/src/components/series/CastGrid.tsx`
- `frontend/src/components/series/CrewGrid.tsx`
- `frontend/src/components/series/EpisodeRow.tsx`
- `frontend/src/components/series/SeasonEpisodeList.tsx`
- `frontend/src/views/SeriesProfileView.tsx`
- `frontend/src/App.tsx`
