# Task 3.0: Backend Watchlist, Episode/Season Tracking, Preferences, and Next Binge Watch APIs

## Overview

Implement persistent single-user watchlist management, single-episode and full-season progress toggling with automatic status synchronization, user language preference persistence, and the 3-tier "Next Binge Watch" recommendation engine with localized rationales and `excludeIds` cycling.

<skills>
### Skill compliance

No frontend/React skills apply to this backend-only task.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules under `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- `code-standards.md`: Keep `.ts` files/classes ≤ 100 lines, functions ≤ 30 lines, ≤ 3 parameters, guard clauses, no blank lines inside functions, extracted constants.
- `javascript-typescript.md`: Zero `any`, explicit types, immutable collection operations (copy before sorting recommendations).
- `node.md`: Async transactional SQLite queries via `@libsql/client`, centralized logging, acyclic module dependencies.
- `tests.md`: ≥ 80% coverage across unit and Supertest integration tests using isolated `:memory:` SQLite.
- `folder-structure.md`: Business rules in `services/`, HTTP parsing/validation in `routes/`, SQL in `data/`.
</rules>

<requirements>
- FR11, FR12: Add, list (with status filter), update status (`want_to_watch`, `watching`, `watched`), and delete watchlist series persisted on the backend.
- FR13, FR14, FR15: Toggle individual episodes or entire seasons watched/unwatched, compute completion counts/percentage/next unwatched episode, and auto-sync watch status transitions.
- FR16, FR17, FR18: Compute prioritized "Next Binge Watch" recommendations across active watchers, queued lists, and empty watchlists with localized rationales and cycling (`excludeIds`).
- FR19, FR20, FR21, FR22: Persist and retrieve user language preference (`en` | `pt-BR`) and persist resolved `pt-BR` AKA titles on saved watchlist series.
</requirements>

## Subtasks

- [x] 3.1 Implement `backend/src/services/watchlistService.ts` (add/upsert with TVmaze metadata + `pt-BR` AKA lookup, list with status filter, update status, delete cascade, single-episode & atomic full-season toggle, and auto status synchronization).
- [x] 3.2 Implement `backend/src/routes/watchlistRoutes.ts` (`GET /api/watchlist`, `POST /api/watchlist`, `PATCH /api/watchlist/:seriesId`, `DELETE /api/watchlist/:seriesId`, `PUT /api/watchlist/:seriesId/episodes/:episodeId`, `PUT /api/watchlist/:seriesId/seasons/:seasonNumber`).
- [x] 3.3 Implement `backend/src/services/preferencesService.ts` and `backend/src/routes/preferencesRoutes.ts` (`GET /api/preferences`, `PUT /api/preferences`).
- [x] 3.4 Implement `backend/src/services/recommendationService.ts` (3-tier priority: `watching` with next episode → highest-rated `want_to_watch` → genre-matched or top-rated TVmaze `/shows?page=0` discovery, with `excludeIds` cycling and localized reasons) and `backend/src/routes/recommendationRoutes.ts` (`GET /api/recommendations/next-binge`).
- [x] 3.5 Register routes in `backend/src/app.ts` and run full backend validation (`npm test` with ≥ 80% coverage and `npm run build`).

## Implementation details

Refer to [techspec.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/techspec.md):
- **Implementation design → Primary interfaces (`WatchlistService`, `RecommendationService`, `PreferencesService`)**
- **Implementation design → Data models (`WatchlistItem`, `SeriesTrackingState`, `NextBingeResponse`, `UserPreferences`)**
- **Implementation design → API endpoints (`/api/watchlist*`, `/api/recommendations/next-binge`, `/api/preferences`)**

## Related acceptance criteria

- AC-06
- AC-07
- AC-08
- AC-09
- AC-10
- AC-11

## Task tests

### Unit tests

- [x] UT-06 - `watchlistService` auto-transitions status on episode and full-season toggles
- [x] UT-07 - `recommendationService` ranks `watching` > `want_to_watch` > genre discovery > empty-watchlist top picks and honors `excludeIds`

### Integration tests

- [x] IT-04 - Watchlist CRUD + episode & season toggle endpoints persist across requests in SQLite
- [x] IT-05 - `GET /api/recommendations/next-binge` responds appropriately for active watchers, queued lists, and empty SQLite DB
- [x] IT-06 - `GET/PUT /api/preferences` persists and retrieves language preference and rejects invalid locales

### E2E tests

Not applicable for this task (covered in Task 8.0).

## Relevant files

- `backend/src/services/watchlistService.ts`
- `backend/src/services/preferencesService.ts`
- `backend/src/services/recommendationService.ts`
- `backend/src/routes/watchlistRoutes.ts`
- `backend/src/routes/preferencesRoutes.ts`
- `backend/src/routes/recommendationRoutes.ts`
- `backend/src/app.ts`
