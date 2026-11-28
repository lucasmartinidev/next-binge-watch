# Product Requirements Document (PRD)

## Overview

**NEXT BINGE WATCH** currently tracks TV series using a single flat Watchlist with three progress statuses (`Want to Watch`, `Watching`, `Watched`) and episode progress, with no way for users to customize list appearance, organize shows into thematic collections, or curate lists of favorite actors, directors, writers, and creators. As a user's library grows, users cannot group titles by mood or occasion (such as "Weekend Sci-Fi" or "Watch with Family"), and when browsing recommendations, search results, or an actor's filmography, they cannot tell at a glance whether a series is already tracked or which specific lists include it.

This feature introduces a unified **My Lists** system combining **3 built-in primary series lists**—**`Want to Watch`**, **`Watching`**, and **`Watched`** (which cannot be deleted or renamed, cannot have their description changed, and allow customizing only their **icon** and **color**)—with full CRUD for **Custom Lists** supporting name, description, curated icon, high-contrast neon color, free-form tags, and strict single-entity typing (**Series-only** or **People-only**). Any series placed in a custom Series list is **always guaranteed to also belong to exactly one of the 3 primary lists** according to its episode progress. Furthermore, everywhere a series is displayed across the application (Search Results, "Next Binge Watch" Recommendation spotlight, Series Profile, My Lists, and a Person's Cast/Crew Credits list), the app automatically checks all user lists and identifies every primary and custom list containing that series—and displays custom People list memberships for people on Person Profiles and in Search Results.

## Objectives

### Business and Product Goals
- Elevate the existing watch statuses into **3 protected primary series lists** (`Want to Watch`, `Watching`, `Watched`) with customizable icon and color, unified alongside unlimited **custom Series-only and People-only lists**.
- Guarantee strict consistency between custom Series lists and watch-progress tracking: every series in a custom list always belongs to one of the 3 primary lists based on its progress, with shared episode tracking across all lists.
- Eliminate "Have I already saved this?" friction by displaying clear, color- and icon-coded list membership badges everywhere a series appears across the app (Search, Recommendations, Series Profile, My Lists, and Person Profile Credits) as well as for people on Person Profiles and Search Results.
- Preserve full bilingual (`en` and `pt-BR`) coverage, Cyber-Neon Design System visual harmony, and WCAG 2.1 Level AA accessibility across desktop and mobile viewports.

### Success Criteria and Key Metrics
- **Protected Primary Lists Integrity:** 100% of attempts to delete or alter the name, description, or entity type of the 3 primary lists (`Want to Watch`, `Watching`, `Watched`) are blocked in both UI and backend, while 100% of icon and color customizations persist and immediately propagate to all badges.
- **Primary-List Membership Invariant:** 100% of series belonging to any custom Series list simultaneously belong to exactly one of the 3 primary lists (`Want to Watch`, `Watching`, or `Watched`) matching their episode watch progress.
- **Full Custom List Lifecycle:** 100% of users can create, view, filter (by type and tag), edit (name, description, icon, color, tags), and safely delete custom Series-only and People-only lists, with 100% persistence across reloads and server restarts.
- **Strict Type Integrity:** 100% of cross-type additions (adding a person to a Series list or a series to a People list) are rejected by both UI and backend validation.
- **Ubiquitous Membership Visibility:** 100% of series renderings across all five required surfaces (Search Results, "Next Binge Watch" Recommendation, Series Profile, My Lists, and Person Profile Cast/Crew Credits) accurately display the series' primary list badge and all custom Series list badges; 100% of person renderings on Person Profile and Search Results accurately display custom People list badges.
- **Safe Custom List Deletion:** 100% of custom list deletions preserve watched episode progress, primary list membership, and memberships in other custom lists.
- **Responsiveness & Quality:** 95% of list CRUD and membership toggle actions complete within 300 ms locally; 100% of new UI strings and backend errors are localized in `en` and `pt-BR`; 0 critical/serious WCAG 2.1 Level AA violations.

## User stories

- **US1 (Customize Primary Lists):** As a viewer, I want to view the 3 primary progress lists (`Want to Watch`, `Watching`, `Watched`) in My Lists and customize their icon and color (without accidentally deleting them or changing their name/description) so that they match my personal visual coding across the entire app.
- **US2 (Create Custom List):** As a viewer, I want to create a custom list with a name, optional description, icon, color, free-form tags, and a strict type (*Series* or *People*) so that I can organize shows or talent around my own themes.
- **US3 (Browse, Filter & Edit Custom Lists):** As a viewer, I want to browse all my lists, filter custom lists by type (*All*, *Series*, *People*) or by tag, and edit a custom list's metadata (name, description, icon, color, tags) at any time so that my collections stay organized.
- **US4 (Safe Delete Custom List):** As a viewer, I want to delete a custom list after confirming my intent without losing my episode watch progress, my primary status list membership, or memberships in other custom lists.
- **US5 (Batch Multi-List Management & Primary-List Sync for Series):** As a binge watcher, I want a single multi-select list selector where I can simultaneously pick or clear a series' primary list (`Want to Watch`, `Watching`, or `Watched`) and check/uncheck multiple custom Series lists—saving all additions and removals in one edit—so that managing list memberships is fast and always consistent with my watch progress.
- **US6 (Batch Multi-List Management for People):** As a fan of specific actors, directors, and creators, I want a single multi-select list selector on a Person Profile where I can check multiple custom People lists and uncheck existing ones in one edit (as well as remove people from inside a People list) so that curating talent lists is effortless.
- **US7 (Spot List Membership Everywhere for Series):** As a viewer browsing the "Next Binge Watch" recommendation, Search results, a Series Profile, My Lists, or an actor/director's filmography (Person Credits), I want to see immediately if a series is in any of my watchlists and *which* exact primary and custom lists it belongs to (with each list's icon, color, and name) so that I always have full context at a glance.
- **US8 (Spot People List Membership & Cross-Navigate):** As a viewer inspecting a Person Profile or Search results, I want to see which custom People lists a person belongs to, and I want clicking any list badge (on a series or person) to jump straight to that list.

## Core features

### 1. Three Protected Primary Series Lists (`Want to Watch`, `Watching`, `Watched`)
Treats the three core watch-progress lists as first-class, non-deletable system lists with customizable visual identity (icon and color) while locking their semantic name, description, and type.

At a high level, the **My Lists** hub prominently features the 3 primary lists (`Want to Watch` / `Quero Assistir`, `Watching` / `Assistindo`, `Watched` / `Assistida`) with item counts and visual customization controls. Users can update only the **icon** and **color** of each primary list using the same curated icon picker and high-contrast neon palette used by custom lists. Any attempt to delete a primary list or change its name, description, or entity type is disallowed.

- **FR1:** The application must always provide 3 built-in, non-deletable primary Series lists corresponding to watch progress: **`Want to Watch`**, **`Watching`**, and **`Watched`**.
- **FR2:** Primary lists must disallow deletion and disallow editing their name, description, tags, or entity type (both in the UI and via backend validation), while allowing the user to customize and persist their **icon** (from the curated icon set) and **color** (from the curated high-contrast neon palette).
- **FR3:** Primary lists must preserve full compatibility with existing status transitions, episode/season progress tracking, and "Next Binge Watch" recommendation tiers.

### 2. Custom Lists CRUD (Series-Only and People-Only)
Allows users to create, inspect, filter, update, and safely delete personalized lists alongside the 3 primary series lists.

At a high level, users open a creation/edit form from **My Lists** to configure a custom list's metadata—name, optional description, entity type (chosen on creation and locked afterward), curated icon, curated high-contrast neon color, and free-form tag chips.

- **FR4:** Users must be able to create a custom list specifying:
  - **Name** (required, trimmed, 1–60 characters)
  - **Description** (optional, up to 240 characters)
  - **List Type** (required on creation: `series` or `people`; immutable after creation)
  - **Icon** (required, selected from a curated set of 12–16 predefined icons)
  - **Color** (required, selected from a curated high-contrast neon palette aligned with the Cyber-Neon Design System)
  - **Tags** (optional, up to 10 free-form tags per list, max 24 characters per tag, case-insensitively deduplicated)
- **FR5:** Users must be able to view all primary and custom lists in the **My Lists** hub displaying each list's icon, color accent, name, description preview, type badge (*Series* / *People*), tags (for custom lists), and item count.
- **FR6:** Users must be able to filter custom lists by type (*All*, *Series*, *People*) and by tag.
- **FR7:** Users must be able to edit a custom list's name, description, icon, color, and tags while keeping its entity type immutable.
- **FR8:** Users must be able to delete a custom list only after an explicit confirmation prompt; deleting a custom list must remove only that list and its memberships without affecting episode watch progress, primary list membership, or memberships in other custom lists.

### 3. Typed Membership Management & Primary-List Invariant
Enforces strict single-entity typing for every list and guarantees that any series added to a custom Series list always belongs to one of the 3 primary progress lists.

At a high level, adding an untracked series to a custom Series list automatically places it into **`Want to Watch`** (or into **`Watching`** / **`Watched`** if episode progress already dictates it). Changing episode progress or watch status moves the series between the 3 primary lists while preserving all custom Series list memberships. Removing a series from a custom list only removes that custom membership; removing/untracking a series completely from its primary list requires confirmation when it belongs to custom Series lists and removes it from those custom lists as well so the invariant is never violated.

- **FR9:** All lists must enforce strict entity typing: **Series-only** lists (including the 3 primary lists and custom Series lists) accept only TV series, and **People-only** lists accept only people. Cross-type additions must be rejected with a clear localized error message.
- **FR10 (Primary-List Invariant):** Whenever a series belongs to one or more custom Series lists, it **must also belong to exactly one** of the 3 primary lists (`Want to Watch`, `Watching`, or `Watched`) determined by its watch progress:
  - Adding a currently untracked series to a custom Series list automatically assigns it to **`Want to Watch`** (or **`Watching`** / **`Watched`** according to its watched episode count).
  - Updating episode or season progress automatically keeps the series in the matching primary list while preserving all custom Series list memberships.
  - Untracking/removing a series from its primary list removes it from all custom Series lists it belonged to (with explicit confirmation if it is in custom lists) so no series can exist in a custom list without a primary list.
- **FR11:** A single series may belong to multiple custom Series lists simultaneously with shared watch status and episode completion progress; a single person may belong to zero, one, or multiple custom People lists simultaneously.
- **FR12 (Unified Multi-Select List Selector for Series):** Users must have a unified multi-select list selector (accessible from the **Series Profile** and **"Next Binge Watch" Recommendation** card) that displays the 3 primary lists (single-choice with option to clear/deselect) and all custom Series lists (multi-select checkboxes), allowing the user to **add new list memberships and undo/remove existing ones across multiple lists in a single save/edit action**:
  - Checking a custom Series list while no primary list is selected automatically selects the matching primary list (`Want to Watch`, or `Watching`/`Watched` per episode progress) within the selector before saving.
  - Clearing/deselecting the primary list clears all custom Series list selections (with a clear inline warning/confirmation if the series had custom lists or watched episodes) to uphold FR10.
  - Users must also be able to remove a series directly from inside a custom Series list view.
- **FR13 (Unified Multi-Select List Selector for People):** Users must have the same unified multi-select list selector on the **Person Profile** (scoped to custom People lists), allowing the user to **select multiple lists and unselect existing ones in a single save/edit action**, in addition to removing people directly from inside a custom People list view.
- **FR14:** Opening any list detail view (primary or custom) must display the list's icon, color accent, name, description, type badge, tags (for custom lists), allowed actions (icon/color edit only for primary lists; full edit/delete for custom lists), and its items:
  - For **Series lists**: series cards with poster, title (localized AKA when applicable), watch status & episode progress summary, membership badges identifying the primary and custom lists the series belongs to, and removal controls.
  - For **People lists**: person cards with portrait/placeholder, name, key metadata (e.g., country), link to Person Profile, and a remove-from-list action.

### 4. Ubiquitous Watchlist Membership Identification
Guarantees that whenever a series is displayed anywhere in the application—standalone or in a list—the user sees which primary list (`Want to Watch`, `Watching`, or `Watched`) and which custom Series lists it belongs to, and provides matching People-list identification on Person Profiles and Search Results.

- **FR15:** Every series display across the application must verify membership across the 3 primary lists and all custom Series lists and display color- and icon-coded badges identifying every list the series belongs to:
  - **Search Results:** Every series card displays its primary list badge (if tracked) and all custom Series list badges.
  - **"Next Binge Watch" Recommendation Spotlight:** The recommended series displays its primary list badge (if tracked) and all custom Series list badges.
  - **Series Profile:** Displays all primary and custom Series list badges prominently in the header alongside controls to change watch status and toggle custom Series lists.
  - **My Lists (Primary Lists & Custom Series Lists):** Every series card displays badges identifying all watchlists (its primary list and all custom Series lists) that the series belongs to.
  - **Person Profile Credits (Cast & Crew Acting/Production List):** Every credited series card in a person's cast and crew filmography displays badges identifying all primary and custom Series lists containing that series.
- **FR16:** Every person display on **Person Profile** and in **Search Results** must check membership across all custom People lists and display badges identifying every custom People list containing that person (icon + color + list name).
- **FR17:** When an item belongs to more than 3 lists, the UI must render the first 3 badges (prioritizing the primary status list first for series) plus a compact `+N` overflow indicator that reveals all remaining list names accessibly without breaking card layout.
- **FR18:** Clicking any list membership badge must navigate directly to that primary list or custom list view.
- **FR19:** Creating, editing (including changing a primary list's icon/color), or deleting lists, as well as adding/removing items or updating episode progress, must immediately reflect in membership badges across views without stale state.

### 5. Bilingual Support & Navigation Integration
Ensures all primary and custom list flows align with the existing bilingual (`en` and `pt-BR`) experience and Cyber-Neon Design System.

- **FR20:** All new navigation labels, primary list names/descriptions, form fields, validation errors, confirmation dialogs, curated icon/color accessible labels, type badges (*Series* / *People* and *Séries* / *Pessoas*), empty states, and backend error messages must be fully localized in both `en` and `pt-BR`.
- **FR21:** The main header navigation must provide clear access to **My Lists** (`Minhas Listas`), exposing both the 3 primary progress lists and all custom lists.

## Acceptance criteria

- **AC-01 (US1, FR1, FR2, FR20):** Given the user opens **My Lists**, when viewing the 3 primary lists (`Want to Watch`, `Watching`, `Watched`), then none of them offer delete or name/description editing; when the user changes a primary list's icon or color, then the new icon and color persist in PostgreSQL and immediately update all badges for that primary list across the app; and any direct API attempt to delete a primary list or modify its name, description, or type is rejected with a localized error.
- **AC-02 (US2, FR4, FR5, FR20):** Given the user opens **My Lists**, when they create a new custom list with a valid name, description, type (`series` or `people`), curated icon, curated color, and tags, then the list persists in PostgreSQL, appears immediately with all chosen metadata, and survives reloads and server restarts.
- **AC-03 (US2, FR4, FR20):** Given the user submits the custom list form with invalid inputs (blank name, name > 60 chars, description > 240 chars, > 10 tags, invalid icon/color, or missing type), when submitted, then saving is prevented and clear, accessible localized error messages are displayed in `en` or `pt-BR`.
- **AC-04 (US3, FR6, FR7):** Given multiple custom lists exist across both `series` and `people` types with distinct tags, when the user filters by type (*All*, *Series*, *People*) or by tag, then only matching custom lists are shown; when the user edits a custom list's name, description, icon, color, or tags, then updates persist and propagate immediately while its entity type remains locked.
- **AC-05 (US4, FR8, FR10):** Given a series belongs to a primary list (with watched episodes) and two custom Series lists (`List A` and `List B`), when the user deletes `List A` after confirming the prompt, then `List A` and its memberships are removed while the series stays in its primary list and `List B` with 100% of its watched episodes intact; and when the user explicitly removes/untracks the series from its primary list (confirming removal from custom lists), then it is removed from its primary list and all custom Series lists so no orphaned custom membership remains.
- **AC-06 (US5, FR9, FR10, FR11, FR12):** Given an untracked series and multiple custom Series lists exist, when the user opens the unified multi-select list selector on the Series Profile or "Next Binge Watch" card and selects two custom Series lists in one edit, then the matching primary list (`Want to Watch`) is automatically selected and all memberships persist atomically upon saving; when episodes are marked watched, the series transitions `Want to Watch` → `Watching` → `Watched` while staying in all its custom lists with shared progress; when the user reopens the selector and simultaneously switches the primary list and checks/unchecks custom lists in a single edit, then all additions and removals are applied atomically; when clearing the primary list in the selector and confirming, all custom Series memberships are cleared together; and cross-type additions (person into Series list or series into People list) are rejected.
- **AC-07 (US6, FR9, FR11, FR13, FR14):** Given multiple custom People lists exist, when the user opens the unified multi-select list selector on a Person Profile, checks multiple custom People lists, and saves, then the person appears inside all selected custom People lists with portrait, name, metadata, and profile link; when the user reopens the selector and simultaneously unchecks an existing list while checking another in a single edit, then all removals and additions persist atomically across reloads; and people can also be removed directly from inside a custom People list view.
- **AC-08 (US7, FR15):** Given a series belongs to a primary list (`Want to Watch`, `Watching`, or `Watched`) and one or more custom Series lists, when the user views that series in the **"Next Binge Watch" Recommendation** spotlight, then badges displaying the primary list and each custom Series list (icon, color, and name) are accurately rendered on the recommendation card.
- **AC-09 (US7, FR15):** Given a series belongs to a primary list and one or more custom Series lists, when the user views **My Lists** (either a primary list or a custom Series list containing that series), then each series card displays badges identifying the lists (primary and custom) that series belongs to.
- **AC-10 (US7, FR15):** Given an actor, director, or writer is credited on a series that belongs to a primary list and/or custom Series lists, when the user opens that **Person Profile** and inspects their **Cast/Crew Credits (Acting/Production list)**, then every credited series card accurately displays badges for its primary list and all custom Series lists.
- **AC-11 (US7, US8, FR15, FR16):** Given series and people belong to lists, when the user runs a **Search** or opens a **Series Profile** or **Person Profile**, then series results/profiles display all matching primary and custom Series list badges and person results/profiles display all matching custom People list badges.
- **AC-12 (US7, US8, FR17, FR18, FR19, FR20, FR21):** Given a series belongs to 4 or more lists (primary + custom), when rendered on any card, then the primary list plus 2 custom list badges and a `+N` overflow indicator are shown with accessible access to all list names; clicking any badge navigates directly to that list; and all workflows localize cleanly in `en` and `pt-BR` across desktop (1280px+) and mobile (375px) viewports with zero WCAG 2.1 Level AA critical/serious violations and zero horizontal overflow.

## User experience

### User Profiles and Needs
- **Organizer / Collector:** Wants the 3 core watch-status lists to feel cohesive with their custom lists (customizable icons and neon colors) while creating unlimited tagged Series and People collections.
- **Active Binge Watcher:** Expects adding a show to any custom list to automatically track it in `Want to Watch` / `Watching` / `Watched` with unified episode progress and zero duplicate bookkeeping.
- **Explorer / Talent Fan:** Wants immediate, scannable list badges across Recommendations, Search, My Lists, Series Profiles, and Person filmographies so they never lose sight of what is already in their lists.

### Main Flows and Interactions
1. **Customizing Primary Lists:** Navigate to **My Lists** → see the 3 primary lists (`Want to Watch`, `Watching`, `Watched`) with their current icons, neon colors, and item counts → click **Customize** on a primary list → pick a new icon and/or color (name/description read-only, no delete button) → save → all badges for that primary list update immediately app-wide.
2. **Creating & Managing Custom Lists:** In **My Lists**, filter custom lists by type (*All*, *Series*, *People*) or tag → click **New List** → fill name, optional description, type (*Series* or *People*), icon, neon color, and tags → save → open list to inspect items, edit metadata, or delete with confirmation.
3. **Batch-Managing Series Lists in One Edit:** On a **Series Profile** or **"Next Binge Watch"** card, open the unified **Manage Lists** multi-select selector → pick/change (or clear) the primary list (`Want to Watch`, `Watching`, `Watched`) and check/uncheck any combination of custom Series lists (checking a custom list auto-selects the matching primary list; clearing the primary list clears custom selections with confirmation) → click **Save** once to apply all additions and removals atomically → badges update immediately app-wide.
4. **Batch-Managing People Lists in One Edit:** On a **Person Profile**, open the unified **Manage Lists** multi-select selector → check new custom People lists and uncheck existing ones → click **Save** once to apply all additions and removals atomically → person appears/disappears in those lists and badges update immediately on Person Profile and Search results.
5. **Cross-Navigating via List Badges:** Clicking any primary or custom list badge on a series or person card navigates directly to that list view.

### UI/UX and Accessibility Requirements
- **Design System Alignment (`DESIGN.md`):** Primary list cards, custom list cards, forms, icon/color pickers, tag chips, and membership badges must use the existing 3-tier Cyber-Neon Design System tokens and primitives (`HudPanel`, `NeonButton`, `NeonBadge`) so every curated neon color achieves WCAG 2.1 AA contrast (`≥ 4.5:1` for text) on dark HUD surfaces.
- **Keyboard & Screen Reader Accessibility:**
  - Icon pickers, color pickers, and list-assignment checkboxes/toggles must be fully keyboard-operable (`Tab`, `Enter`, `Space`, `Escape`) with visible focus rings and descriptive `aria-label` / `aria-pressed` / `aria-checked` attributes.
  - Confirmation dialogs (for deleting a custom list or untracking a series present in custom lists) must manage focus cleanly and support `Escape` to cancel.
  - Membership badges must never rely on color alone—every badge pairs color with an icon and readable text label.
- **Responsive Design:** All list hubs, primary/custom cards, forms, pickers, tag filters, and badge strips must adapt cleanly down to `375px` mobile viewports with ≥ 40px touch targets for primary controls and zero horizontal overflow.

## High-level technical constraints

- **Persistence & Schema Evolution:** Primary list visual settings (icon and color), custom list definitions, tags, and typed item memberships must be persisted in **PostgreSQL 18.7** via reversible **`node-pg-migrate`** TypeScript migrations in `backend/migrations/`.
- **Backend Exclusivity:** The frontend must retrieve and mutate all catalog, primary list, and custom list data exclusively through the Express 5 backend API (zero direct browser calls to `api.tvmaze.com`).
- **Invariant Enforcement:** The primary-list invariant (every series in a custom Series list also belongs to exactly one of `Want to Watch`, `Watching`, or `Watched`) and primary-list mutation restrictions (no delete, no name/description/type change) must be enforced authoritatively on the backend, not only in the UI.
- **Performance & Query Efficiency:** Resolving list memberships across multi-item surfaces (Search results, Person Credits, My Lists, Recommendations) must batch-lookup memberships efficiently in PostgreSQL without N+1 queries; 95% of list CRUD and membership toggle requests must complete within 300 ms locally.
- **Data Integrity & Security:** Strict server-side validation for metadata limits, curated icon/color allow-lists, tag count/length limits, and entity type matching, using parameterized PostgreSQL queries and localized API error payloads (`en` and `pt-BR`).
- **Quality & Standards:** Must adhere to `AGENTS.md`, `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`), and `.agents/skills/react/SKILL.md`, maintaining ≥ 80% coverage across all metrics in both `backend/` and `frontend/`, plus Playwright E2E coverage in `e2e/`.

## Out of scope

- **Deleting or Renaming Primary Lists:** Removing or altering the name/description/type of `Want to Watch`, `Watching`, or `Watched` (only their icon and color are customizable).
- **Mixed-Type Lists:** Lists containing both series and people in the same list.
- **Multi-User Accounts, Sharing & Collaboration:** User authentication, shareable URLs, collaborative editing, or CSV/JSON import/export.
- **Custom Free-Form Color Pickers or Custom Uploaded Icons:** Arbitrary hex color inputs or uploaded image icons (curated high-contrast neon palette and curated icon set only).
- **Drag-and-Drop Manual Reordering & Per-List Notes:** Custom manual item ordering or per-list custom notes/ratings.
- **Per-List Independent Watch Status:** Separate watch statuses or separate episode progress per custom list for the same series.
- **Recommendation Algorithm Overhaul for People Lists:** Using custom People lists to alter the "Next Binge Watch" series recommendation ranking tiers.
