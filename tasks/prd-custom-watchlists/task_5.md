# Task 5.0: Frontend My Lists Hub (`/watchlist`), List Detail (`/watchlist/:listId`), and Ubiquitous Badges Rollout

## Overview

Evolve `WatchlistView` into the unified **My Lists** hub (3 protected primary progress lists + custom lists grid with type/tag filters + "New List" CTA), add `ListDetailView` at `/watchlist/:listId`, refactor `SearchResultCard` and `SeriesCreditCard` to avoid nested links, and integrate `ListMembershipBadges` and `ListMembershipModal` across all five series surfaces and both person surfaces.

<skills>
### Skill compliance

- **`react` (`.agents/skills/react/SKILL.md`):** Load and follow all React 19 standards: every component ≤ 30 lines, explicit props without `{...props}`, `useEffect` only for external synchronization, strict HTML5 semantics (no nested `<a>` tags when rendering clickable badges on cards), Tailwind CSS + Cyber-Neon Design System tokens, and WCAG 2.1 AA accessibility.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- Keep all `.ts`/`.tsx` files ≤ 100 lines, functions/components ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, and zero `any` (`code-standards.md`, `javascript-typescript.md`).
- Keep views thin; delegate state/fetching to hooks and API calls to `services/` (`folder-structure.md`, `react` skill).
- Verify `npm test` (≥ 80% coverage across all metrics), `npm run lint`, `npm run typecheck`, and `npm run build` in `frontend/` (`AGENTS.md`, `tests.md`).
</rules>

<requirements>
- **FR2, FR3, FR5–FR8, FR14, FR21:** Unified **My Lists** hub at `/watchlist` and list detail view at `/watchlist/:listId` supporting primary list icon/color customization, custom list CRUD, type/tag filters, Series & People item cards, and safe delete / untrack confirmation dialogs.
- **FR12, FR13, FR15–FR19:** Display `ListMembershipBadges` across Search Results, "Next Binge Watch" Recommendation, Series Profile, My Lists (primary & custom Series lists), Person Profile Cast/Crew Credits, and Person Profile/Search for People, plus "Manage Lists" modal triggers on Series Profile, Next Binge card, and Person Profile.
</requirements>

## Subtasks

- [x] 5.1 Implement `ListSummaryCard.tsx`, `ListHubFilters.tsx`, `PersonListCard.tsx`, and `ListDetailView.tsx`, and register `<Route path="/watchlist/:listId" element={<ListDetailView />} />` in `frontend/src/App.tsx`.
- [x] 5.2 Evolve `frontend/src/views/WatchlistView.tsx` into the unified **My Lists** hub (3 protected primary lists with customize icon/color, custom lists grid with type/tag filters + "New List" CTA, and tracked series overview with `WatchlistCard` badges and untrack confirmation).
- [x] 5.3 Refactor `SearchResultCard.tsx` and `SeriesCreditCard.tsx` from outer `<Link>` to `<article>` with inner `<Link>` (preventing nested `<a>` elements) and wire `ListMembershipBadges` + `ListMembershipModal` across `NextBingeCard.tsx` / `HomeView.tsx`, `SeriesHeader.tsx` / `SeriesProfileView.tsx`, and `PersonHeader.tsx` / `PersonProfileView.tsx`.
- [x] 5.4 Add `ListDetailView.test.tsx` (`UT-08`) and update `HomeView.test.tsx`, `SeriesProfileView.test.tsx`, `PersonProfileView.test.tsx`, and `WatchlistView.test.tsx` (`UT-08`, `UT-09`); run `cd frontend && npm test && npm run lint && npm run typecheck`, and `npm run build`.

## Implementation details

Follow `tasks/prd-custom-watchlists/techspec.md` sections:
- **System architecture → Component overview** (My Lists hub, `ListDetailView`, modified cards/headers)
- **Technical considerations → Key decisions** (refactoring `SearchResultCard` & `SeriesCreditCard` to `<article>` wrappers)
- **Testing approach** (`UT-08`, `UT-09`)

## Related acceptance criteria

- AC-01
- AC-04
- AC-08
- AC-09
- AC-10
- AC-11
- AC-12

## Task tests

### Unit tests (if applicable)

- [x] UT-08 - `WatchlistView` & `ListDetailView` render primary lists, custom lists, type/tag filters
- [x] UT-09 - `NextBingeCard`, `SearchResultCard`, `SeriesProfileView`, `PersonProfileView` show badges

### Integration tests (if applicable)

Not applicable for this task (covered in Tasks 1–3 and Task 6).

### E2E tests (if applicable)

Not applicable for this task (covered in Task 6.0).

## Relevant files

- `frontend/src/App.tsx`
- `frontend/src/views/{WatchlistView,ListDetailView,HomeView,SeriesProfileView,PersonProfileView}.tsx`
- `frontend/src/components/lists/{ListSummaryCard,ListHubFilters,PersonListCard}.tsx`
- `frontend/src/components/search/SearchResultCard.tsx`
- `frontend/src/components/recommendation/NextBingeCard.tsx`
- `frontend/src/components/series/{SeriesHeader,WatchlistControls}.tsx`
- `frontend/src/components/person/{PersonHeader,SeriesCreditCard}.tsx`
- `frontend/src/components/watchlist/WatchlistCard.tsx`
- `frontend/src/views/{ListDetailView,WatchlistView,HomeView,SeriesProfileView,PersonProfileView}.test.tsx`
