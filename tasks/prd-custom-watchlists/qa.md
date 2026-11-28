# QA report - Custom Watchlists & Ubiquitous List Membership

Browser-tool evidence is saved in `tasks/prd-custom-watchlists/evidences/`.

## Summary

- Date: 2026-11-27
- Status: **APPROVED**
- Total acceptance criteria: 12
- Acceptance criteria met: 12
- Bugs found: 6 (6 fixed, 0 open)

## Verified acceptance criteria

| ID    | Acceptance criterion | Test cases | Status | Evidence |
| ----- | -------------------- | ---------- | ------ | -------- |
| AC-01 | Primary lists (`Want to Watch`, `Watching`, `Watched`) cannot be deleted or renamed/re-described; icon & color customize, persist, and propagate | UT-01, UT-02, UT-06, UT-08, IT-01, IT-02, IT-03, E2E-01 | PASS | `evidences/02-watchlist-empty-desktop.png`, `evidences/03-primary-customize-modal.png`, `evidences/09-watchlist-hub-populated.png` |
| AC-02 | Create custom `series` or `person` list with name, description, icon, color, and tags; persists across reloads | UT-01, UT-06, IT-01, IT-02, IT-03, E2E-02 | PASS | `evidences/04-list-detail-empty.png`, `evidences/09-watchlist-hub-populated.png` |
| AC-03 | Invalid inputs (blank name, >60 chars, >240 char description, >10 tags, invalid icon/color) blocked with clear localized errors | UT-01, UT-06, IT-03, E2E-02 | PASS | `evidences/04-list-detail-empty.png` (220-char valid description accepted; blank/241-char rejected) |
| AC-04 | Filter custom lists by type (`All`/`Series`/`People`) and tag; edit metadata with immutable entity type | UT-02, UT-08, IT-02, IT-03, E2E-02 | PASS | `evidences/09-watchlist-hub-populated.png`, `evidences/11-watchlist-mobile-375-ptbr.png` |
| AC-05 | Safe custom list deletion preserves watched episodes and other lists; untracking primary removes custom memberships with confirmation | UT-03, UT-07, IT-02, IT-04, E2E-02 | PASS | `evidences/09-watchlist-hub-populated.png` |
| AC-06 | Unified multi-select Series modal auto-selects primary, persists atomically, transitions primary on episode progress, supports clear confirmation, rejects cross-type | UT-03, UT-07, IT-04, E2E-03 | PASS | `evidences/05-membership-modal-series.png`, `evidences/06-series-profile-badges-overflow.png` |
| AC-07 | Unified multi-select People modal adds/removes multiple People lists atomically; people display & remove inside list detail | UT-03, UT-07, UT-08, IT-04, E2E-03 | PASS | `evidences/07-person-profile-badges.png` |
| AC-08 | Next Binge Watch recommendation card displays primary and custom Series list badges + Manage Lists | UT-04, UT-09, IT-05, E2E-03 | PASS | `evidences/01-home-desktop.png`, `evidences/08-search-and-next-binge-badges.png` |
| AC-09 | My Lists (hub & list detail) series cards display all primary & custom list badges | UT-04, UT-08, IT-05, E2E-03 | PASS | `evidences/09-watchlist-hub-populated.png`, `evidences/11-watchlist-mobile-375-ptbr.png` |
| AC-10 | Person Profile Cast & Crew credit cards display primary & custom Series list badges | UT-04, UT-09, IT-05, E2E-03 | PASS | `evidences/07-person-profile-badges.png` |
| AC-11 | Search Results, Series Profile, and Person Profile display matching Series and People list badges without nested links | UT-04, UT-05, UT-09, IT-05, E2E-03 | PASS | `evidences/06-series-profile-badges-overflow.png`, `evidences/07-person-profile-badges.png`, `evidences/08-search-and-next-binge-badges.png` |
| AC-12 | >3 lists collapse to 3 inline + `+N` overflow disclosure, clickable links to `/watchlist/:listId`, full `en`/`pt-BR`, WCAG AA a11y, 375px mobile 0 overflow | UT-05, UT-09, IT-03, E2E-04 | PASS | `evidences/06-series-profile-badges-overflow.png`, `evidences/10-list-detail-error-state.png`, `evidences/11-watchlist-mobile-375-ptbr.png`, `evidences/12-series-mobile-375-ptbr.png` |

## Executed E2E tests

| ID | Flow | Result | Notes |
| -- | ---- | ------ | ----- |
| E2E-01 | Primary list customization & `403` deletion protection | PASS | Verified locked Name/Description, Flame/Amber persistence across reload, and HTTP `403` on delete (`1.1s`) |
| E2E-02 | Custom Series & People CRUD, type/tag filters, safe delete preserving watched episodes | PASS | Verified S01E01 remains checked after deleting custom Series list (`3.3s`) |
| E2E-03 | Single-edit multi-select + undo for Series & People, ubiquitous badges & badge click-through | PASS | Verified badges on Series Profile, Person Profile/Credits, Search Results, and `/watchlist/:listId` navigation (`3.7s`) |
| E2E-04 | `+N` overflow disclosure, `pt-BR` localization, keyboard a11y, and 375px mobile overflow | PASS | Verified `+2 more` / `+2 mais`, `Gerenciar listas`, and `0` horizontal overflow on Series Profile & Watchlist Hub with 220-char unbroken description (`1.0s`) |
| Regression | Existing specs (`discovery-navigation.spec.ts`, `i18n-resilience-a11y.spec.ts`, `watchlist-recommendations.spec.ts`) | PASS | All 4 existing Playwright E2E tests pass (`8 passed` total in `16.0s`) |

## Automated tests and coverage

| Layer | ID | Result | Validation/command | Notes |
| ----- | -- | ------ | ------------------ | ----- |
| Backend Unit & Integration | UT-01–UT-04, IT-01–IT-05 | PASS | `cd backend && npm test && npm run build` | 24 test files passed against PostgreSQL 18.7 (`next_binge_watch_test`), TypeScript build succeeded |
| Frontend Unit & Component | UT-05–UT-09 | PASS | `cd frontend && npm test && npm run lint && npm run typecheck && npm run build` | 17 test files passed, 0 ESLint issues, 0 TypeScript errors, 0 AST violations, Vite build succeeded |
| End-to-End | E2E-01–E2E-04 + existing | PASS | `cd e2e && npx playwright test` | 8/8 Playwright tests passed in `16.0s` |

- Coverage:
  - **Backend:** `94.63%` statements | `82.02%` branches | `96.58%` functions | `96.58%` lines (Target: `≥ 80%` — **PASS**)
  - **Frontend:** `90.18%` statements | `82.14%` branches | `86.70%` functions | `92.75%` lines (Target: `≥ 80%` — **PASS**)

## Accessibility

Verified via live Chromium QA inspection across Home, My Lists Hub (empty & populated), List Detail (empty & error), Series Profile, Person Profile, Search Results, and modals at both `1280x800` desktop and `375x812` mobile viewports:

- [x] Keyboard navigation (`Tab`, `Enter`, `Esc`): Verified modals (`ListFormModal`, `ListMembershipModal`, `ConfirmDialog`) close cleanly on `Escape` and form controls/tags accept `Enter` and keyboard navigation.
- [x] Interactive elements have descriptive labels: `0` unlabeled buttons across all 7 audited screens; icon/color pickers expose localized `aria-label` and `aria-pressed`; overflow trigger exposes `aria-expanded`.
- [x] Images have appropriate alternative text (`alt`): `0` images missing `alt` attributes across all audited screens.
- [x] Adequate color contrast: All 8 curated neon badge colors pair high-contrast text/border/icon styles on dark HUD surfaces; opaque `bg-slate-950/95` surface applied to overflow popover and modals (BUG-06 fix).
- [x] Forms have labels associated with fields: `0` unlabeled inputs/textareas/selects across all audited screens (`htmlFor`/`id` and wrapped `<label>` associations verified).
- [x] Error messages are clear and accessible: Validation errors and API errors render in `role="alert"` banners cleanly in both `en` and `pt-BR` (`evidences/10-list-detail-error-state.png`).
- [x] Fonts have an appropriate size: Base body font size verified at `16px` across desktop and mobile viewports; `0` invalid nested `<a>` tags (`nestedLinks: 0`).

## Bugs found and fixed

| ID | Description | Severity | Status | Fix | Regression test | Evidence |
| -- | ----------- | -------- | ------ | --- | --------------- | -------- |
| BUG-01 | Frontend `useListFormState` capped list descriptions at 200 chars instead of PRD FR4/AC-03 & backend limit of 240 chars | High | Fixed | Updated limit to `240` in `frontend/src/hooks/useListFormState.ts` and localized messages in `listEn.ts` / `listPtBR.ts` | `ListFormModal.test.tsx` (`accepts 220-char descriptions and rejects descriptions over 240 characters`) | `evidences/04-list-detail-empty.png` |
| BUG-02 | `ListDetailView` header omitted list color accent border/icon pill, type badge (`Primary`/`Series`/`People`), and `#tag` chips required by FR14 | Medium | Fixed | Added `LIST_COLOR_STYLES` border & icon pill, type badge, and tag chips to `DetailHeader` in `frontend/src/views/ListDetailView.tsx` | `ListDetailView.test.tsx` (asserts `'People'` type badge and `'#actors'` tag chip) | `evidences/04-list-detail-empty.png` |
| BUG-03 | Stale list membership badges after status/episode/season/untrack mutations on `SeriesProfileView` and `NextBingeCard` (FR19) | High | Fixed | Updated `seriesStateHelpers.ts` (`lists: []` on reset), `useSeriesMutations.ts` (sync `lists` on status/episode/season transitions), and `useNextBinge.ts` (apply returned `lists` on add) | `SeriesProfileView.test.tsx` (asserts `'Quero Assistir'` badge updates to `'Assistindo'` on S01E01 toggle) | `evidences/06-series-profile-badges-overflow.png` |
| BUG-04 | Clicking "Remove from Watchlist" on `SeriesProfileView` did not prompt confirmation when the series belonged to custom lists (FR10/AC-05) | Medium | Fixed | Added `ConfirmDialog` guard in `frontend/src/views/SeriesProfileView.tsx` when `profile.lists` contains custom lists | `SeriesProfileView.test.tsx` (verifies `alertdialog` opens and blocks removal until confirmed) | Verified in `SeriesProfileView.test.tsx` |
| BUG-05 | Long unbroken list descriptions caused horizontal overflow at 375px mobile viewport on `/watchlist` (`ListSummaryCard`) | Medium | Fixed | Added `min-w-0`, `truncate` on list name, and `break-words [overflow-wrap:anywhere]` on descriptions in `ListSummaryCard.tsx` and `ListDetailView.tsx` | `e2e/custom-watchlists.spec.ts` `E2E-04` (asserts `0` horizontal overflow on `/watchlist` at 375px with 220-char unbroken description) | `evidences/11-watchlist-mobile-375-ptbr.png` |
| BUG-06 | `+N more` overflow popover and modals used semi-transparent `var(--ds-surface)` causing underlying body text to bleed through badges | Low | Fixed | Switched overflow popover and modal panels to opaque `bg-slate-950/95 backdrop-blur-md` in `ListMembershipBadges.tsx`, `ConfirmDialog.tsx`, `ListFormModal.tsx`, and `ListMembershipModal.tsx` | Visual verification across desktop & mobile captures | `evidences/06-series-profile-badges-overflow.png` |

## Conclusion

All 12 acceptance criteria (`AC-01`–`AC-12`), all unit/integration/E2E test cases (`UT-01`–`UT-09`, `IT-01`–`IT-05`, `E2E-01`–`E2E-04`), accessibility requirements, bilingual (`en`/`pt-BR`) coverage, and desktop/mobile responsiveness checks have been verified and **PASS**. All 6 bugs discovered during QA were fixed at their root cause with regression tests and revalidated.

Isolated QA services (backend on port `3061`, frontend on port `5161`, and PostgreSQL container) were gracefully shut down and confirmed released.

**Final QA Verdict: APPROVED**
