# Code review report - NEXT BINGE WATCH

## Summary

- Date: 2026-11-25
- Branch: N/A (workspace is not a git repository)
- Status: **APPROVED**

## Rule compliance

| Rule | Status | Notes |
| --- | --- | --- |
| `AGENTS.md` | OK | Independent `frontend/` and `backend/` apps preserved; Vite `/api` + `/health` proxy and `VITE_API_URL` supported; all required test, lint, typecheck, and build commands pass with 0 errors and 0 warnings. Authorized deviation: `en` + `pt-BR` localization per PRD. |
| `.agents/rules/code-standards.md` | OK | Verified via TypeScript AST audit across all non-test `.ts`/`.tsx` files in `backend/src` and `frontend/src`: 0 files > 100 lines, 0 functions/methods/components > 30 lines, 0 blank lines inside functions, 0 inline comments, and 0 magic HTTP status literals in `AppError` call sites. Only 1 function has > 3 parameters: Express 5's mandatory 4-argument error handler signature `(err, req, res, _next)` in `backend/src/routes/errorMiddleware.ts:41`. |
| `.agents/rules/javascript-typescript.md` | OK | Zero `any` usages, strict `===`/`!==`, `const` by default, explicit types and `Promise<T>`, immutable state updates, and 0 ESLint errors/warnings. |
| `.agents/rules/node.md` | OK | Pure `async/await` I/O via `@libsql/client` and `fetch`, zero synchronous fs/DB calls in request handlers, `dotenv` validation with `.env.example`, idempotent `SIGTERM`/`SIGINT` graceful shutdown, centralized `logger.ts` (zero `console.*` outside logger), acyclic module dependencies. |
| `.agents/rules/tests.md` | OK | Vitest configured with ≥ 80% coverage thresholds on all 4 metrics in both apps (`93.73%` stmts / `80.08%` branches backend; `95.59%` stmts / `85.53%` branches frontend); regression tests added for discovery degradation; Playwright E2E suite isolated under root `e2e/`. |
| `.agents/rules/folder-structure.md` | OK | Unidirectional `routes → services → data` (backend) and `views → components/hooks → services` (frontend); 3-tier Design System cleanly separated under `styles/` and `components/ds/`; unused template files removed. |
| `.agents/skills/react/SKILL.md` | OK | Granular React 19 components and custom hooks all ≤ 30 lines (shared `useAsyncResource` and `useSeriesMutations` extracted), zero JSX prop spreading (`{...props}`), `useEffect` restricted to external synchronization with `AbortController` cleanup, Tailwind CSS + CSS token styling, WCAG 2.1 AA semantic HTML and `aria-*` attributes. |

## TechSpec alignment

| Technical decision | Implemented | Notes |
| --- | --- | --- |
| Embedded SQLite via `@libsql/client` (`file:...`, `:memory:` in tests) | YES | Implemented in `backend/src/data/database.ts` with `PRAGMA foreign_keys = ON` and cascade deletes. |
| BFF over TVmaze with 5s timeout, 429 retry, TTL cache, and partial degradation | YES | Implemented in `tvmazeHttp.ts`, `tvmazeHttpUtils.ts`, `tvmazeClient.ts`, `ttlCache.ts`, `seriesService.ts`, `personService.ts`, and hardened in `recommendationService.ts` so discovery timeouts degrade cleanly when watchlist picks exist. |
| Deferred `pt-BR` AKA resolution (`BR` → `PT`) on Series Profile & Watchlist | YES | Implemented in `akaResolver.ts`, `seriesService.ts`, `watchlistService.ts`, and reused in `searchService.ts`. |
| `react-router-dom` + typed `en`/`pt-BR` dictionary i18n with browser detection | YES | Implemented in `App.tsx`, `detectLocale.ts`, `en.ts`, `ptBR.ts`, and `I18nContext.tsx`. |
| Exclusive backend communication + `/health` DB check + CC BY-SA attribution | YES | Verified 0 direct `api.tvmaze.com` references in `frontend/src`; `FooterAttribution` and profiles link back to TVmaze. |
| 3-Tier Futuristic Cyber-Neon Design System (`DESIGN.md`) | YES | Implemented via `styles/tokens.css`, `styles/genreThemes.ts`, `GenreThemeContext.tsx`, `tailwind.config.js`, and `components/ds/` (`CyberBackground`, `HudPanel`, `NeonButton`, `NeonBadge`). |

## Verified tasks

| Task | Status | Notes |
| --- | --- | --- |
| 1.0 Backend Foundation, SQLite Persistence, and i18n Infrastructure | COMPLETE | All subtasks and `UT-09`, `IT-07` verified. |
| 2.0 Backend TVmaze Client, Search, Series Profile, and Person Profile APIs | COMPLETE | All subtasks and `UT-01`–`UT-05`, `UT-08`, `IT-01`–`IT-03` verified. |
| 3.0 Backend Watchlist, Episode/Season Tracking, Preferences, and Next Binge Watch APIs | COMPLETE | All subtasks and `UT-06`, `UT-07` (plus discovery-degradation regression), `IT-04`–`IT-06` verified. |
| 4.0 Frontend Foundation, Routing, i18n (`en`/`pt-BR`), API Client, and Shared Layout | COMPLETE | All subtasks and `UT-10`, `UT-13` verified. |
| 5.0 Frontend Home View, Unified Search, and Next Binge Watch Spotlight | COMPLETE | All subtasks and `UT-11` verified. |
| 6.0 Frontend Series Profile View, Cast/Crew Navigation, and Season/Episode Tracker | COMPLETE | All subtasks and `UT-12` (SeriesProfileView) verified. |
| 7.0 Frontend Person Profile View and Watchlist View | COMPLETE | All subtasks and `UT-12` (PersonProfileView & WatchlistView) verified. |
| 8.0 End-to-End Test Suite (Playwright) and Full Verification | COMPLETE | All subtasks and `E2E-01`–`E2E-05` verified. |

## Tests

- Total tests: 68 automated tests (42 backend + 22 frontend + 4 Playwright E2E specs)
- Passing: 68
- Failing: 0
- Coverage:
  - Backend: **93.73%** statements, **80.08%** branches, **97.94%** functions, **93.76%** lines (threshold ≥ 80%)
  - Frontend: **95.59%** statements, **85.53%** branches, **96.55%** functions, **96.27%** lines (threshold ≥ 80%)

## Issues found

| Severity | File | Line | Description | Suggestion |
| --- | --- | --- | --- | --- |
| Medium | `backend/src/services/recommendationService.ts` | 40 | `getNextBinge` awaited TVmaze's `/shows?page=0` discovery catalog unconditionally; a discovery timeout failed the entire endpoint even when valid local `watching`/`want_to_watch` picks already existed in SQLite. | **Fixed during review:** isolated discovery catalog loading so upstream failures log a warning and degrade gracefully whenever watchlist picks are available, while still propagating upstream errors when no fallback exists. Added regression suite `backend/src/services/recommendationResilience.test.ts`. |
| Low | `backend/src/routes/errorMiddleware.ts`, `watchlistRoutes.ts`, `services/recommendationService.ts`, `seriesService.ts` | — | Four backend functions exceeded the 30-line limit (31–47 lines). | **Fixed during review:** extracted `buildErrorReply`/`logRequestError`, `registerCrudRoutes`/`registerEpisodeRoutes`, `recommendationPicks.ts`, and `seriesProfileMapper.ts` so every backend function is ≤ 30 lines. |
| Low | `backend/src/services/episodeTrackingService.ts`, `recommendationDiscovery.ts`, `watchlistMapper.ts`, `types/error.ts` | — | Functions/constructors accepted 4–5 positional parameters, and `new AppError(...)` repeated literal HTTP status codes across 30+ call sites. | **Fixed during review:** replaced positional params with typed input objects (`EpisodeChangeInput`, `DiscoveryInput`, `WatchlistItemInput`) and derived `AppError.statusCode` from `ERROR_STATUS_BY_CODE` (reducing constructor to 3 params). |
| Low | `frontend/src/hooks/useNextBinge.ts`, `usePersonProfile.ts`, `useSearch.ts`, `useSeriesProfile.ts`, `useWatchlist.ts`, `useApiHealth.ts`, `i18n/I18nContext.tsx`, `styles/GenreThemeContext.tsx` | — | Six frontend hooks/providers exceeded 30 lines (34–68 lines), two state helpers took 4 positional params, and eight files contained blank lines inside function bodies. | **Fixed during review:** extracted shared `useAsyncResource`, `useSeriesMutations`, `asyncErrors`, `watchlistStateHelpers`, and `usePersistedLocale`; converted `seriesStateHelpers` to named parameter objects (`EpisodeChange`, `SeasonChange`); removed all blank lines inside functions. |

## Strengths

- Strict, AST-verified compliance with every rule in `AGENTS.md`, `.agents/rules/`, and `.agents/skills/react/SKILL.md` (zero files > 100 lines, zero functions/components > 30 lines, zero blank lines inside functions, zero `any`, zero JSX prop spreading, zero inline comments, zero direct browser calls to TVmaze).
- Hardened BFF resilience: TTL caching, in-flight deduplication, bounded `429` retry, partial degradation on Series/Person profiles, and watchlist-first graceful degradation on Next Binge recommendations when discovery fails.
- Clean 3-tier Cyber-Neon Design System (`tokens.css` + `genreThemes.ts` → Tailwind semantic tokens → `components/ds/` primitives) with genre-reactive theming and `prefers-reduced-motion` support.
- Fast, reliable test pyramid exceeding 80% coverage across every metric in both apps (`93.73%` backend, `95.59%` frontend) plus all 4 Playwright E2E specs passing cleanly.

## Recommendations

- Consider migrating `backend/vitest.config.ts` to `vitest.config.mts` in a future maintenance pass to silence Vite's CJS config loader notice.

## Conclusion

The code review is **APPROVED**. The discovery-degradation bug and all AST-detected code-standard violations have been resolved and verified with regression tests, full builds, lint, typecheck, coverage gates (≥ 80%), and Playwright E2E tests.
