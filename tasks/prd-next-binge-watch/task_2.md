# Task 2.0: Backend TVmaze Client, Search, Series Profile, and Person Profile APIs

## Overview

Implement the backend TVmaze integration layer and catalog endpoints (`GET /api/search`, `GET /api/series/:id`, `GET /api/people/:id`), including 5-second timeouts, single bounded retry on HTTP `429`, in-memory TTL caching, HTML synopsis sanitization, Brazilian/Portuguese AKA resolution, graceful partial degradation for auxiliary sub-resources (`crew`, `akas`, secondary person credits), and watchlist/episode progress merging on Series Profiles.

<skills>
### Skill compliance

No frontend/React skills apply to this backend-only task.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules under `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- `code-standards.md`: Keep `.ts` files/classes ≤ 100 lines, functions ≤ 30 lines, ≤ 3 parameters, guard clauses, no blank lines inside functions, extracted constants, and no unnecessary comments.
- `javascript-typescript.md`: Zero `any` (use `unknown` + runtime type guards when parsing TVmaze payloads), strict comparisons, explicit return types.
- `node.md`: Non-blocking `async/await` HTTP calls, centralized logger (`warn` on `429` retry and partial degradation, `error` on exhausted failures), acyclic module dependencies (`routes → services → data`).
- `tests.md`: ≥ 80% test coverage with Vitest; mock only TVmaze HTTP calls while exercising real `:memory:` SQLite in integration tests.
- `folder-structure.md`: Keep HTTP validation/wiring in `routes/`, business/mapping rules in `services/`, and TVmaze HTTP client in `data/`.
</rules>

<requirements>
- FR1, FR2, FR3, FR4: Partial search for series and people with `all | series | person` scope filtering and empty-query validation.
- FR5, FR6, FR7: Series Profile by ID with poster, original & localized AKA title, subtype, metadata, sanitized synopsis, cast, crew, seasons/episodes, tracking state, and canonical TVmaze URL.
- FR8, FR9, FR10: Person Profile by ID with bio metadata, separated cast & crew series credits, and canonical TVmaze URL.
- FR21, FR22, FR24: Localized backend errors, `pt-BR` AKA resolution, and TVmaze canonical attribution URLs.
</requirements>

## Subtasks

- [x] 2.1 Implement `backend/src/data/tvmazeClient.ts` with `TVMAZE_BASE_URL`, 5-second `AbortSignal.timeout`, single bounded retry on HTTP `429`, TTL caching (5 min search/profiles, 30 min discovery page), and runtime payload guards.
- [x] 2.2 Implement `backend/src/services/htmlSanitizer.ts` and `backend/src/services/akaResolver.ts` (`BR` first, fallback `PT`, `null` for `en` or absent AKA).
- [x] 2.3 Implement `backend/src/services/searchService.ts` and `backend/src/routes/searchRoutes.ts` (`GET /api/search`), reusing cached/persisted `pt-BR` AKAs without per-result AKA fan-out.
- [x] 2.4 Implement `backend/src/services/seriesService.ts` and `backend/src/routes/seriesRoutes.ts` (`GET /api/series/:id`), combining `?embed[]=episodes&embed[]=cast` with `Promise.allSettled` `crew`/`akas` partial degradation and SQLite tracking merge.
- [x] 2.5 Implement `backend/src/services/personService.ts` and `backend/src/routes/personRoutes.ts` (`GET /api/people/:id`), combining person details with `Promise.allSettled` cast/crew credit endpoints, wire all routes in `backend/src/app.ts`, and verify unit + integration tests and build.

## Implementation details

Refer to [techspec.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/techspec.md):
- **Implementation design → Primary interfaces (`TvmazeClient`, `SearchService`, `SeriesService`, `PersonService`)**
- **Implementation design → Data models (`SearchResultItem`, `SearchResponse`, `SeriesProfile`, `PersonProfile`, TVmaze API to contract mapping, Fixed parameters at the source)**
- **Implementation design → API endpoints (`GET /api/search`, `GET /api/series/:id`, `GET /api/people/:id`)**
- **Integration points**

## Related acceptance criteria

- AC-01
- AC-02
- AC-03
- AC-04
- AC-05
- AC-11
- AC-12
- AC-13
- AC-14

## Task tests

### Unit tests

- [x] UT-01 - `htmlSanitizer` strips HTML tags and decodes entities safely
- [x] UT-02 - `akaResolver` selects `BR` AKA first, falls back to `PT`, returns `null` for `en` or absent AKA
- [x] UT-03 - `searchService` merges and normalizes show and person results for `all`, `series`, and `person` scopes
- [x] UT-04 - `seriesService` calculates episode progress, next unwatched episode, and handles `crew`/`akas` partial degradation
- [x] UT-05 - `personService` categorizes cast and crew credits and degrades gracefully when one credit feed fails
- [x] UT-08 - `tvmazeClient` retries once on HTTP `429`, maps `404`/`5xx`/timeout to typed errors, and caches hits within TTL

### Integration tests

- [x] IT-01 - `GET /api/search` validates `q`/`type`, proxies mocked TVmaze, and returns localized errors in `en` and `pt-BR`
- [x] IT-02 - `GET /api/series/:id` combines mocked TVmaze data with real in-memory SQLite watchlist/episode state
- [x] IT-03 - `GET /api/people/:id` returns cast and crew credits and handles upstream partial degradation
- [x] IT-07 - Upstream HTTP `429`/timeout/`500` scenarios map cleanly through `errorMiddleware` and `/health` reports DB status

### E2E tests

Not applicable for this task (covered in Task 8.0).

## Relevant files

- `backend/src/data/tvmazeClient.ts`
- `backend/src/services/htmlSanitizer.ts`
- `backend/src/services/akaResolver.ts`
- `backend/src/services/searchService.ts`
- `backend/src/services/seriesService.ts`
- `backend/src/services/personService.ts`
- `backend/src/routes/searchRoutes.ts`
- `backend/src/routes/seriesRoutes.ts`
- `backend/src/routes/personRoutes.ts`
- `backend/src/app.ts`
