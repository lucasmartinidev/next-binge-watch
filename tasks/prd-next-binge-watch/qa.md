# QA report - NEXT BINGE WATCH

Browser-tool evidence is saved in `tasks/prd-next-binge-watch/evidences/`.

## Summary

- Date: 2026-11-25
- Status: **APPROVED**
- Total acceptance criteria: 15
- Acceptance criteria met: 15
- Bugs found: 1 (fixed and revalidated)

## Verified acceptance criteria

| ID | Acceptance criterion | Test cases | Status | Evidence |
| --- | --- | --- | --- | --- |
| AC-01 | Partial show search returns matching shows and opens Series Profile by ID | UT-03, IT-01, UT-11, E2E-01 | PASS | [02-search-results.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/02-search-results.png) |
| AC-02 | Person search and content-type scope filtering (`People` / `Series` / `All`) | UT-03, IT-01, UT-11, E2E-01 | PASS | [02-search-results.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/02-search-results.png) |
| AC-03 | Empty and no-match search states display localized guidance | UT-01, UT-11, E2E-05 | PASS | E2E-05 (`No results found`) |
| AC-04 | Series Profile metadata, seasons/episodes, cast/crew, and TVmaze link | UT-01, UT-02, UT-04, IT-02, UT-12, E2E-01 | PASS | [03-series-profile.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/03-series-profile.png) |
| AC-05 | Show-to-person cross-navigation from cast/crew to Person Profile | UT-05, IT-03, UT-12, E2E-01 | PASS | [04-person-profile.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/04-person-profile.png) |
| AC-06 | Person-to-show cross-navigation from cast/crew credits to Series Profile | UT-05, IT-03, UT-12, E2E-01 | PASS | [04-person-profile.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/04-person-profile.png) |
| AC-07 | Watchlist status persistence and filtering across reloads | UT-06, IT-04, E2E-02 | PASS | [05-watchlist-pt-br.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/05-watchlist-pt-br.png) |
| AC-08 | Episode and full-season progress tracking with automatic status sync | UT-04, UT-06, IT-02, IT-04, UT-12, E2E-02 | PASS | [03-series-profile.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/03-series-profile.png) |
| AC-09 | "Next Binge Watch" recommendations across empty, queued, and active states | UT-07, IT-05, UT-11, E2E-03 | PASS | [01-home-desktop.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/01-home-desktop.png) |
| AC-10 | Browser locale detection (`pt-BR` / `en` fallback), manual switching, and localized errors | UT-09, UT-10, IT-06, E2E-04 | PASS | [05-watchlist-pt-br.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/05-watchlist-pt-br.png) |
| AC-11 | Exclusive backend communication (zero direct browser calls to TVmaze) and API status indicator | UT-13, IT-07, E2E-01 | PASS | [01-home-desktop.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/01-home-desktop.png) |
| AC-12 | Upstream rate-limit, timeout, and error resilience with retry action | UT-08, IT-07, UT-13, E2E-05 | PASS | [06-error-state.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/06-error-state.png) |
| AC-13 | Visible TVmaze CC BY-SA attribution and canonical links across views | UT-12, UT-13, E2E-01 | PASS | [01-home-desktop.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/01-home-desktop.png) |
| AC-14 | Accessibility and responsiveness across desktop (1280px) and mobile (375px) viewports | UT-11, UT-13, E2E-05 | PASS | [07-mobile-375px.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/07-mobile-375px.png) |
| AC-15 | Keyboard navigability, semantic landmarks, and labeled interactive controls | UT-11, UT-12, UT-13, E2E-05 | PASS | [05-watchlist-pt-br.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/05-watchlist-pt-br.png) |

## Executed E2E tests

| ID | Flow | Result | Notes |
| --- | --- | --- | --- |
| E2E-01 | Search partial title, filter scope, navigate Series ↔ Person, verify TVmaze attribution & zero direct TVmaze calls | PASS | Executed in `e2e/discovery-navigation.spec.ts` |
| E2E-02 | Add series to Watchlist, toggle episode & full season, reload, verify SQLite persistence & status filters | PASS | Executed in `e2e/watchlist-recommendations.spec.ts` |
| E2E-03 | Verify "Next Binge Watch" recommendation on empty watchlist and active watching state, plus cycling | PASS | Executed in `e2e/watchlist-recommendations.spec.ts` |
| E2E-04 | Auto-detect `pt-BR`, fallback `fr-FR` → `en`, manual switch + reload persistence, localized backend errors | PASS | Executed in `e2e/i18n-resilience-a11y.spec.ts` |
| E2E-05 | Empty search state, simulated `502` error recovery with retry, 375px & 1280px overflow & Tab focus checks | PASS | Executed in `e2e/i18n-resilience-a11y.spec.ts` |

## Automated tests and coverage

| Layer | ID | Result | Validation/command | Notes |
| --- | --- | --- | --- | --- |
| Backend Unit & Integration | UT-01–UT-09, IT-01–IT-07 | PASS | `cd backend && npm test && npm run build` | 16 test files, 40/40 tests passed |
| Frontend Unit & Component | UT-10–UT-13, DS | PASS | `cd frontend && npm test && npm run lint && npm run typecheck && npm run build` | 10 test files, 22/22 tests passed; 0 lint errors, 0 warnings |
| E2E | E2E-01–E2E-05 | PASS | `cd e2e && npx playwright test` | 4 spec files, 4/4 tests passed |

- Coverage:
  - Backend: **93.41%** statements, **80.28%** branches, **97.82%** functions, **93.42%** lines (target: ≥ 80%).
  - Frontend: **94.11%** statements, **82.76%** branches, **97.10%** functions, **94.19%** lines (target: ≥ 80%).

## Accessibility

- [x] Keyboard navigation (Tab, Enter, Esc)
- [x] Interactive elements have descriptive labels (`unlabeledButtons: 0` across all 7 audited views)
- [x] Images have appropriate alternative text (`missingAlt: 0` across all 7 audited views)
- [x] Adequate color contrast (high-contrast foreground/background tokens, non-color-only API & watch status labels)
- [x] Forms have labels associated with fields (`unlabeledInputs: 0` across all 7 audited views)
- [x] Error messages are clear and accessible (`role="alert"` and `role="status"` live regions)
- [x] Fonts have an appropriate size (16px base body font size)

## Bugs found and fixed

| ID | Description | Severity | Status | Fix | Regression test | Evidence |
| --- | --- | --- | --- | --- | --- | --- |
| BUG-01 | Poster `<Link>` in `WatchlistCard.tsx` lacked an explicit `aria-label`, causing automated accessibility audit to flag an unlabeled interactive link on `/watchlist`. | Medium | Fixed | Added `aria-label={displayName}` to the poster `<Link>` in `frontend/src/components/watchlist/WatchlistCard.tsx`. | Added assertion `expect(screen.getAllByRole('link', { name: 'Breaking Bad' })).toHaveLength(2)` in `frontend/src/views/WatchlistView.test.tsx`. | [05-watchlist-pt-br.png](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/evidences/05-watchlist-pt-br.png) |

## Conclusion

QA is **APPROVED**. All 15 PRD acceptance criteria, 13 unit test suites, 7 integration test suites, Design System token/primitive tests, and 5 E2E flows pass with zero console/page errors, zero direct browser calls to TVmaze, full `en`/`pt-BR` localization, and ≥ 80% coverage in both backend and frontend.
