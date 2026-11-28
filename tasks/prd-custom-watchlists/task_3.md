# Task 3.0: Backend List HTTP Routes and Ubiquitous `lists[]` Hydration Across All Catalog & Tracking Endpoints

## Overview

Expose the custom list CRUD and atomic batch membership HTTP endpoints in `listRoutes.ts`, wire them in `app.ts`, and hydrate `lists: ListBadgeSummary[]` via O(1) batch lookups across every existing series and person endpoint (`Search`, `Next Binge Watch`, `Series Profile`, `Watchlist`, and `Person Profile` including cast/crew credits).

<skills>
### Skill compliance

- No implementation skills in `.agents/skills/` apply (backend HTTP routes and services only; `react` skill is not applicable).
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- Keep routes thin (input parsing and HTTP status/response only; business rules stay in services) (`folder-structure.md`).
- Preserve backwards compatibility on all existing `/api/*` endpoints while adding `lists: ListBadgeSummary[]` (`AGENTS.md`, TechSpec).
- Keep all `.ts` files ≤ 100 lines, functions ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, and zero `any` (`code-standards.md`, `javascript-typescript.md`).
- Run `npm test` (≥ 80% coverage across all metrics) and `npm run build` in `backend/` (`AGENTS.md`, `tests.md`).
</rules>

<requirements>
- **FR1–FR14:** Expose `GET/POST /api/lists`, `GET/PATCH/DELETE /api/lists/:listId`, `DELETE /api/lists/:listId/items/:itemId`, `PUT /api/series/:seriesId/lists`, and `PUT /api/people/:personId/lists`.
- **FR15, FR16, FR19:** Attach accurate, localized `lists: ListBadgeSummary[]` to `SearchResultItem` (series & person), `NextBingeRecommendation`, `SeriesProfile`, `WatchlistItem`, `PersonSeriesCredit` (cast & crew), and `PersonProfile`.
</requirements>

## Subtasks

- [x] 3.1 Create `backend/src/routes/listRoutes.ts` and register it with `UserListRepository`, `ListMembershipRepository`, `ListMembershipService`, and `UserListService` inside `backend/src/app.ts`.
- [x] 3.2 Add `lists: ListBadgeSummary[]` to `backend/src/types/{search,series,person,recommendation,watchlist}.ts` and update `SearchService`, `RecommendationService`, `SeriesService`, `PersonService`, and `WatchlistService` (plus mappers) to batch-hydrate `lists[]` via `ListMembershipService` (`UT-04`).
- [x] 3.3 Update affected existing backend unit/integration tests and add `backend/src/routes/listRoutes.test.ts` covering HTTP CRUD, primary protection (`403`), duplicates (`409`), atomic `PUT /api/series/:id/lists` & `PUT /api/people/:id/lists` (`IT-03`, `IT-04`), and ubiquitous `lists[]` hydration across all 5 series surfaces and 2 person surfaces (`IT-05`).
- [x] 3.4 Run `cd backend && npm test && npm run build` and verify 100% passing tests, ≥ 80% coverage across all metrics, and clean `tsc` compilation.

## Implementation details

Follow `tasks/prd-custom-watchlists/techspec.md` sections:
- **Implementation design → API endpoints** (all `/api/lists*`, `/api/series/:seriesId/lists`, `/api/people/:personId/lists`, and extended existing endpoints)
- **Testing approach** (`UT-04`, `IT-03`, `IT-04`, `IT-05`)

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

## Task tests

### Unit tests (if applicable)

- [x] UT-04 - Existing backend services hydrate `lists[]` on Search, Series, Person, Watchlist & NextBinge

### Integration tests (if applicable)

- [x] IT-03 - HTTP CRUD `/api/lists*` including primary protection (`403`), duplicates (`409`), filters
- [x] IT-04 - Atomic `PUT /api/series/:id/lists` & `PUT /api/people/:id/lists` multi-select + FR10 sync
- [x] IT-05 - Batch hydration across `/api/search`, `/recommendations/next-binge`, `/series/:id`, `/people/:id`, `/watchlist`

### E2E tests (if applicable)

Not applicable for this task (covered in Task 6.0).

## Relevant files

- `backend/src/routes/listRoutes.ts`
- `backend/src/routes/listRoutes.test.ts`
- `backend/src/app.ts`
- `backend/src/types/{search,series,person,recommendation,watchlist}.ts`
- `backend/src/services/{searchService,recommendationService,recommendationPicks,recommendationDiscovery,seriesService,seriesProfileMapper,personService,watchlistService,watchlistMapper}.ts`
- `backend/src/routes/{catalogRoutes,trackingAndRecommendationRoutes}.test.ts`
- `backend/src/services/{searchService,seriesService,personService,watchlistService,recommendationService}.test.ts`
