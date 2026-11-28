# Code review report - Custom Watchlists & Ubiquitous List Membership

## Summary

- Date: 2026-11-27
- Branch: `feat/create-watchlist`
- Status: **APPROVED**

## Rule compliance

| Rule | Status | Notes |
| ---- | ------ | ----- |
| `code-standards.md` | OK | 0 non-test `.ts`/`.tsx` files > 100 lines, 0 functions > 30 lines, 0 blank lines inside functions, 0 inline comments, ≤ 3 parameters across all functions (only Express 5's required 4-arg `errorMiddleware.ts:41`). Fixed 3 file-length findings during review. |
| `javascript-typescript.md` | OK | 0 `any` usages, 0 `var`, strict `===`/`!==`, explicit types and `Promise<T>`, `unknown` catch handling, 0 ESLint errors/warnings, 0 TypeScript errors. |
| `node.md` | OK | Pure `async/await` with PostgreSQL transactions (`BEGIN`/`COMMIT`/`ROLLBACK` + `finally` client release), 0 sync I/O calls, centralized `logger.ts` (0 stray `console.*`), acyclic `routes → services → data → types` layering. |
| `folder-structure.md` | OK | Independent `backend/`, `frontend/`, and root `e2e/` with no root `package.json`; UI components do not call `fetch` or `api.tvmaze.com` directly; all HTTP calls isolated in `frontend/src/services/`. |
| `tests.md` | OK | Vitest coverage exceeds ≥ 80% threshold across all 4 metrics in both `backend/` and `frontend/`; real PostgreSQL 18.7 integration tests (`next_binge_watch_test`); Playwright E2E suite in `e2e/`. |
| `react` skill (`.agents/skills/react/SKILL.md`) | OK | Every component ≤ 30 lines, 0 JSX prop spreads (`{...props}`), custom `use*` hooks with `useEffect` restricted to external sync (`useEscapeKey`, `useAsyncResource`, modal open reset), no nested `<a>` links, WCAG 2.1 AA semantics, Cyber-Neon Tailwind tokens. |

## TechSpec alignment

| Technical decision | Implemented | Notes |
| ------------------ | ----------- | ----- |
| Unified `user_lists` table with 3 seeded primary rows (`want_to_watch`, `watching`, `watched`) + `custom_list_series` & `custom_list_people` | YES | Reversible migration `backend/migrations/1764300000000_custom-watchlists.ts` verified `up → down → up`. |
| DB-enforced FR10 invariant (`custom_list_series.series_id → watchlist_items.series_id ON DELETE CASCADE`) | YES | Enforced at PostgreSQL schema level and transactionally in `ListMembershipService`. |
| Atomic `PUT /api/series/:seriesId/lists` & `PUT /api/people/:personId/lists` single-edit endpoints | YES | Replaces memberships atomically inside PostgreSQL transactions; rejects cross-type with `400` and primary delete/rename with `403`. |
| Batch `ANY($1::int[])` membership hydration onto all 5 series surfaces & 2 person surfaces | YES | Hydrated on Search, Next Binge Watch, Series Profile, Watchlist/My Lists, and Person Profile & Credits without N+1 queries. |
| `/watchlist` My Lists hub + `/watchlist/:listId` detail route + reusable `ListMembershipBadges`, `ListFormModal`, `ListMembershipModal`, `ConfirmDialog` | YES | Preserves `/watchlist` backwards compatibility while adding primary customization, custom CRUD, type/tag filters, and detail views. |
| Refactor `SearchResultCard` & `SeriesCreditCard` to `<article>` with inner `<Link>` | YES | Prevents nested `<a>` tags when rendering clickable `ListMembershipBadges`. |
| Bilingual `en` / `pt-BR` localization across UI & API errors | YES | Full `en`/`pt-BR` dictionaries in `backend/src/i18n/` and `frontend/src/i18n/`. |

## Verified tasks

| Task | Status | Notes |
| ---- | ------ | ----- |
| 1.0 PostgreSQL Custom Watchlists Schema Migration, List Catalog, Error Localization, and Test DB Reset | COMPLETE | Migration, catalog, localized errors, test DB reset, `IT-01` & `UT-01` verified (marked `UT-01` checkbox in `task_1.md`). |
| 2.0 Backend Repositories, Validation, Primary Protection, and Atomic Multi-List Services | COMPLETE | `UserListRepository`, `ListMembershipRepository`, `listValidation`, `UserListService`, `ListMembershipService`, `UT-01`–`UT-03`, `IT-02` verified. |
| 3.0 Backend List HTTP Routes and Ubiquitous `lists[]` Hydration Across All Catalog & Tracking Endpoints | COMPLETE | `listRoutes.ts`, `app.ts` wiring, hydration across all 5 series & 2 person surfaces, `UT-04`, `IT-03`–`IT-05` verified. |
| 4.0 Frontend List Palette, API Client, Shared Hooks, Confirmation Dialog, Badges, and Modals | COMPLETE | Types, palette, `listService`, hooks, `ConfirmDialog`, `ListMembershipBadges`, `ListFormModal`, `ListMembershipModal`, `UT-05`–`UT-07` verified. |
| 5.0 Frontend My Lists Hub (`/watchlist`), List Detail (`/watchlist/:listId`), and Ubiquitous Badges Rollout | COMPLETE | `WatchlistView`, `ListDetailView`, `ListDetailHeader`, card refactors, badge & modal rollout, `UT-08`, `UT-09` verified. |
| 6.0 Playwright End-to-End Test Suite (`e2e/custom-watchlists.spec.ts`) and Full Regression Verification | COMPLETE | `E2E-01`–`E2E-04` and all 4 existing E2E specs pass against PostgreSQL 18.7. |

## Tests

- Total tests: **105** (`58` backend Vitest + `39` frontend Vitest + `8` Playwright E2E)
- Passing: **105**
- Failing: **0**
- Coverage:
  - **Backend:** `94.49%` statements | `81.90%` branches | `96.89%` functions | `96.61%` lines (Target: `≥ 80%`)
  - **Frontend:** `90.18%` statements | `82.14%` branches | `86.70%` functions | `92.75%` lines (Target: `≥ 80%`)

## Issues found

| Severity | File | Line | Description | Suggestion |
| -------- | ---- | ---- | ----------- | ---------- |
| Low | `frontend/src/types/list.ts` | 1–103 | Exceeded the 100-line file limit (`103` lines, `code-standards.md`) | **Fixed during review:** formatted `ListIconId` union cleanly, reducing file to `91` lines. |
| Low | `frontend/src/views/ListDetailView.tsx` | 1–106 | Exceeded the 100-line file limit (`106` lines, `code-standards.md`) | **Fixed during review:** extracted `frontend/src/components/lists/ListDetailHeader.tsx`, reducing `ListDetailView.tsx` to `59` lines. |
| Low | `backend/src/services/inMemoryListRepositories.ts` | 1–190 | Test-double helper exceeded the 100-line file limit (`190` lines, `code-standards.md`) | **Fixed during review:** split into `inMemoryUserListRepository.ts` (`80` lines), `inMemoryListMembershipRepository.ts` (`78` lines), and `inMemoryListRepositories.ts` (`18` lines). |
| Low | `tasks/prd-custom-watchlists/task_1.md` | 53 | `UT-01` task test checkbox was left unchecked even though `listValidation.test.ts` was implemented and passing | **Fixed during review:** marked `[x]`. |

## Strengths

- Clean database-level integrity (`ON DELETE CASCADE` from `watchlist_items` to `custom_list_series`) prevents orphaned custom Series memberships by construction.
- Batch `ANY($1::int[])` queries keep list badge hydration constant-time across Search results and Person Credits without N+1 queries.
- Granular React 19 decomposition: every component, hook, and helper across the entire codebase is ≤ 30 lines, strictly typed, with zero prop spreading and full WCAG 2.1 AA semantics.
- High automated test confidence: 105 passing tests across unit, PostgreSQL integration, and Playwright E2E layers, all exceeding 80% coverage.

## Recommendations

- None blocking; all review findings were resolved and revalidated. Optionally, future iterations could add keyboard arrow-key navigation inside `IconPickerGrid` / `ColorPickerGrid` radio/grid groups for enhanced power-user ergonomics.

## Conclusion

The implementation of **Custom Watchlists & Ubiquitous List Membership** is fully aligned with the TechSpec, satisfies all project coding/React/Node/testing standards with zero remaining violations, and passes all 105 backend, frontend, and Playwright E2E tests with coverage above 80% across every metric. The PostgreSQL container started for review verification was gracefully shut down (`npm run db:down`).

**Final Review Verdict: APPROVED**
