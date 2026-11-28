# Technical Specification

## Summary

This specification defines the architecture, PostgreSQL 18.7 schema migration, REST API contracts, React 19 UI components, and testing plan for **Custom Watchlists (Personal Lists)** and **Ubiquitous List Membership Identification** as defined in `tasks/prd-custom-watchlists/prd.md`.

The design models the **3 protected primary Series lists** (`want_to_watch`, `watching`, `watched`) alongside user-created **Series-only** and **People-only** custom lists in a unified `user_lists` table backed by two typed join tables (`custom_list_series` and `custom_list_people`). Database-level foreign keys (`custom_list_series.series_id → watchlist_items.series_id ON DELETE CASCADE`) and transactional batch endpoints (`PUT /api/series/:seriesId/lists`, `PUT /api/people/:personId/lists`) guarantee the primary-list invariant (`FR10`) and atomic single-edit multi-list updates (`FR12`, `FR13`). Batch SQL lookups (`ANY($1::int[])`) hydrate compact `lists: ListBadgeSummary[]` arrays onto all five series surfaces (Search, Next Binge Watch Recommendation, Series Profile, My Lists, and Person Cast/Crew Credits) and two person surfaces (Person Profile and Search) without N+1 queries, while evolving `/watchlist` into a unified **My Lists** hub with `/watchlist/:listId` detail routes and a reusable accessible `ListMembershipModal`.

## System architecture

### Component overview

Both applications preserve strict unidirectional flows (`config → routes → services → data → types` in `backend/`; `views → components/hooks → services → backend` in `frontend/`) and zero direct browser calls to TVmaze.

```text
PostgreSQL 18.7
  ├── user_lists (3 seeded system rows + custom series/person lists)
  ├── watchlist_items (primary status + cached show metadata)
  │     ├── watched_episodes (FK ON DELETE CASCADE)
  │     └── custom_list_series (FK user_lists + FK watchlist_items ON DELETE CASCADE)
  └── custom_list_people (FK user_lists ON DELETE CASCADE + cached person metadata)

Backend Services
  ListMembershipService (batch ANY($1::int[]) lookup) ──► hydrates `lists[]` on:
    ├── SearchService (series + people)
    ├── RecommendationService (Next Binge spotlight)
    ├── SeriesService (Series Profile)
    ├── WatchlistService & UserListService (My Lists primary + custom detail)
    └── PersonService (Person Profile + castCredits + crewCredits)

Frontend Views & Shared UI
  ├── /watchlist        ─► WatchlistView (My Lists Hub: 3 Primary Lists + Custom Lists CRUD & filters)
  ├── /watchlist/:listId ─► ListDetailView (Primary or Custom Series/People list detail)
  ├── Shared Components ─► ListMembershipBadges (3 badges + '+N' overflow, clickable links)
  │                        ListMembershipModal (unified batch multi-select editor)
  │                        ListFormModal (create/edit custom list or customize primary icon/color)
  │                        ConfirmDialog (reusable accessible confirmation for delete/untrack)
```

**New backend components:**
- `backend/migrations/<timestamp>_custom-watchlists.ts`: Reversible `node-pg-migrate` migration creating `user_lists`, `custom_list_series`, `custom_list_people`, indexes, and seeding the 3 system rows (`want_to_watch`, `watching`, `watched`).
- `backend/src/types/list.ts`: Domain contracts (`ListEntityType`, `ListIconId`, `ListColorId`, `ListBadgeSummary`, `UserListSummary`, `CustomListDetail`, `CreateListInput`, `UpdateListInput`, `UpdateSeriesListsInput`, `UpdatePersonListsInput`).
- `backend/src/config/listCatalog.ts`: Curated allow-lists for `LIST_ICON_IDS` (16 icons), `LIST_COLOR_IDS` (8 high-contrast neon colors), default primary list icon/color mappings, and reserved primary list names (`en` & `pt-BR`).
- `backend/src/data/userListRepository.ts`: Parameterized PostgreSQL CRUD for `user_lists` (including item count aggregation and case-insensitive uniqueness checks).
- `backend/src/data/listMembershipRepository.ts`: Parameterized PostgreSQL batch lookup and transactional membership sync for `custom_list_series` and `custom_list_people`.
- `backend/src/services/listValidation.ts`: Pure validation helpers for list metadata (name length, reserved names, description length, curated icon/color allow-lists, tag count/length/deduplication).
- `backend/src/services/listMembershipService.ts`: Resolves localized `ListBadgeSummary[]` maps for batches of `seriesIds` or `personIds`, and executes atomic multi-list updates (`updateSeriesLists`, `updatePersonLists`) enforcing `FR10` and `FR9`.
- `backend/src/services/userListService.ts`: Business logic for listing/filtering (`type`, `tag`), detail loading (primary & custom), creating custom lists, updating custom lists or primary icon/color (blocking forbidden primary mutations), deleting custom lists, and removing single items.
- `backend/src/routes/listRoutes.ts`: Express 5 router exposing `/api/lists*`, `/api/series/:seriesId/lists`, and `/api/people/:personId/lists`.

**Modified backend components:**
- `backend/src/types/error.ts`, `backend/src/i18n/enMessages.ts`, `backend/src/i18n/ptBrMessages.ts`: Add `CONFLICT` (`409`), `FORBIDDEN` (`403`), and localized list validation/protection error keys.
- `backend/src/types/{search,series,person,recommendation,watchlist}.ts`: Add `lists: ListBadgeSummary[]` to `SearchResultItem`, `SeriesProfile`, `PersonProfile`, `PersonSeriesCredit`, `NextBingeRecommendation`, and `WatchlistItem`.
- `backend/src/services/{searchService,seriesService,seriesProfileMapper,personService,recommendationService,recommendationPicks,recommendationDiscovery,watchlistService,watchlistMapper}.ts`: Hydrate `lists` via `ListMembershipService` in batch.
- `backend/src/app.ts`: Wire `UserListRepository`, `ListMembershipRepository`, `ListMembershipService`, `UserListService`, and `createListRouter`.
- `backend/src/data/testDatabase.ts`: Reset custom lists and restore default primary list icon/color metadata between tests without deleting the 3 seeded system rows.
- `backend/src/services/inMemoryRepositories.ts`: Extend in-memory test doubles with `InMemoryUserListRepository` and `InMemoryListMembershipRepository`.

**New frontend components:**
- `frontend/src/types/list.ts`: Mirror backend list & membership types.
- `frontend/src/styles/listPalette.ts`: Curated mapping from `ListColorId` → high-contrast Tailwind/CSS color tokens (`≥ 4.5:1` contrast) and `ListIconId` → `lucide-react` icon components + localized accessible labels.
- `frontend/src/services/listService.ts`: HTTP client methods for `/api/lists*`, `PUT /api/series/:id/lists`, and `PUT /api/people/:id/lists`.
- `frontend/src/hooks/{useLists,useListDetail,useListMembershipEditor}.ts`: Encapsulated state, loading, error, filtering, and atomic save hooks.
- `frontend/src/components/lists/ListIcon.tsx`: Renders curated icon by `ListIconId`.
- `frontend/src/components/lists/ListMembershipBadges.tsx`: Reusable strip rendering up to 3 clickable list badges (primary list first for series) + accessible `+N` overflow disclosure.
- `frontend/src/components/lists/ListMembershipModal.tsx` (+ subcomponents `PrimaryStatusSection.tsx`, `CustomListCheckboxGroup.tsx`): Unified accessible modal for single-edit multi-select assignment/undo of primary & custom lists (for both series and people), with auto-primary selection and inline confirmation on clearing primary status.
- `frontend/src/components/lists/ListFormModal.tsx` (+ subcomponents `IconPickerGrid.tsx`, `ColorPickerGrid.tsx`, `TagChipInput.tsx`): Accessible modal for creating/editing custom lists and customizing icon/color on primary lists.
- `frontend/src/components/lists/ListSummaryCard.tsx`, `ListHubFilters.tsx`, `PersonListCard.tsx`: Cards and filters for the My Lists hub and People list detail.
- `frontend/src/components/common/ConfirmDialog.tsx`: Reusable accessible confirmation dialog (`Escape`, focus management) for custom list deletion and series untracking.
- `frontend/src/views/ListDetailView.tsx`: Detail view for `/watchlist/:listId` (handles both primary Series lists and custom Series/People lists).

**Modified frontend components:**
- `frontend/src/App.tsx`: Add `<Route path="/watchlist/:listId" element={<ListDetailView />} />`.
- `frontend/src/views/WatchlistView.tsx`: Evolve into the unified **My Lists** hub showing the 3 primary progress lists (with customize icon/color + quick navigation), custom lists grid (with type & tag filters + "New List" CTA), and the all-tracked series quick view with status tabs preserved for full backwards compatibility.
- `frontend/src/components/search/SearchResultCard.tsx` & `frontend/src/components/person/SeriesCreditCard.tsx`: Convert outer wrapper from `<Link>` to `<article>` with inner `<Link>` on poster/title so sibling clickable `ListMembershipBadges` never create invalid nested `<a>` elements.
- `frontend/src/components/recommendation/NextBingeCard.tsx`: Display `ListMembershipBadges` and a **"Manage Lists"** trigger opening `ListMembershipModal`.
- `frontend/src/components/series/SeriesHeader.tsx` & `WatchlistControls.tsx`: Display `ListMembershipBadges` and **"Manage Lists"** button opening `ListMembershipModal` (syncing both status/tracking and custom lists cleanly).
- `frontend/src/components/person/PersonHeader.tsx`: Display `ListMembershipBadges` (People lists) and **"Manage Lists"** button opening `ListMembershipModal`.
- `frontend/src/components/watchlist/WatchlistCard.tsx`: Display `ListMembershipBadges` and trigger confirmation when untracking a series that belongs to custom Series lists.
- `frontend/src/i18n/{en,ptBR}.ts`: Add all bilingual (`en` and `pt-BR`) copy for primary lists, custom list CRUD, pickers, tags, multi-select modal, confirmations, and errors.

## Implementation design

### Primary interfaces

```ts
// backend/src/data/userListRepository.ts
UserListRepository(db: DatabaseClient)
  listAllWithCounts(filters: { entityType?: ListEntityType; tag?: string }) -> Promise<StoredUserList[]>
  findById(listId: string) -> Promise<StoredUserList | null>
  findByLowerName(lowerName: string, excludeId?: string) -> Promise<StoredUserList | null>
  create(input: CreateStoredListInput) -> Promise<StoredUserList>
  update(listId: string, patch: UpdateStoredListInput) -> Promise<StoredUserList | null>
  deleteCustomById(listId: string) -> Promise<boolean>
```

```ts
// backend/src/data/listMembershipRepository.ts
ListMembershipRepository(db: DatabaseClient)
  findSeriesMemberships(seriesIds: number[]) -> Promise<Map<number, StoredSeriesListMembership>>
  findPersonMemberships(personIds: number[]) -> Promise<Map<number, StoredUserList[]>>
  listSeriesByCustomListId(listId: string) -> Promise<StoredWatchlistRow[]>
  listPeopleByCustomListId(listId: string) -> Promise<StoredCustomListPerson[]>
  replaceSeriesCustomLists(input: { client: PoolClient; seriesId: number; listIds: string[] }) -> Promise<void>
  replacePersonCustomLists(input: { person: StoredPersonSnapshot; listIds: string[] }) -> Promise<void>
  removeSeriesFromCustomList(listId: string, seriesId: number) -> Promise<boolean>
  removePersonFromCustomList(listId: string, personId: number) -> Promise<boolean>
```

```ts
// backend/src/services/listMembershipService.ts
ListMembershipService(userListRepo, membershipRepo, watchlistRepo, watchedEpisodeRepo, tvmaze, db)
  getSeriesBadgesMap(seriesIds: number[], locale: Locale) -> Promise<Map<number, ListBadgeSummary[]>>
  getPersonBadgesMap(personIds: number[]) -> Promise<Map<number, ListBadgeSummary[]>>
  updateSeriesLists(input: UpdateSeriesListsCommand) -> Promise<UpdateSeriesListsResponse>
  updatePersonLists(input: UpdatePersonListsCommand) -> Promise<UpdatePersonListsResponse>
```

```ts
// backend/src/services/userListService.ts
UserListService(userListRepo, membershipRepo, watchlistService, listMembershipService)
  listAll(input: { type?: ListEntityType; tag?: string; locale: Locale }) -> Promise<UserListsResponse>
  getDetail(input: { listId: string; locale: Locale }) -> Promise<ListDetailResponse>
  createCustomList(input: CreateListInput & { locale: Locale }) -> Promise<UserListSummary>
  updateList(input: UpdateListCommand) -> Promise<UserListSummary>
  deleteCustomList(listId: string) -> Promise<void>
  removeItemFromCustomList(input: { listId: string; itemId: number }) -> Promise<void>
```

```ts
// frontend/src/services/listService.ts
listService
  getLists(params: { type?: ListEntityType; tag?: string; locale: Locale; signal?: AbortSignal }) -> Promise<UserListsResponse>
  getListDetail(params: { listId: string; locale: Locale; signal?: AbortSignal }) -> Promise<ListDetailResponse>
  createList(input: CreateListPayload, locale: Locale) -> Promise<UserListSummary>
  updateList(listId: string, input: UpdateListPayload, locale: Locale) -> Promise<UserListSummary>
  deleteList(listId: string, locale: Locale) -> Promise<void>
  removeListItem(listId: string, itemId: number, locale: Locale) -> Promise<void>
  updateSeriesLists(seriesId: number, input: UpdateSeriesListsPayload, locale: Locale) -> Promise<UpdateSeriesListsResponse>
  updatePersonLists(personId: number, input: UpdatePersonListsPayload, locale: Locale) -> Promise<UpdatePersonListsResponse>
```

### Data models

#### `user_lists` - PostgreSQL table for primary and custom list metadata

| Field         | Type          | Required | Description                                                                                 |
| ------------- | ------------- | -------- | ------------------------------------------------------------------------------------------- |
| `id`          | `TEXT` (PK)   | yes      | Stable key (`'want_to_watch'`, `'watching'`, `'watched'`) for system lists; UUID for custom. |
| `is_system`   | `BOOLEAN`     | yes      | `TRUE` for the 3 protected primary lists; `FALSE` for user-created lists.                   |
| `system_key`  | `TEXT` (UNIQ) | no       | `'want_to_watch' \| 'watching' \| 'watched'` when `is_system = TRUE`; `NULL` otherwise.     |
| `entity_type` | `TEXT` (CHK)  | yes      | Strictly `'series'` or `'person'`; immutable after creation.                                |
| `name`        | `TEXT`        | yes      | List display name (1–60 chars); unique case-insensitively (`UNIQUE (LOWER(name))`).         |
| `description` | `TEXT`        | no       | Optional description (max 240 chars); fixed for system lists.                               |
| `icon`        | `TEXT`        | yes      | Curated `ListIconId` allow-list value.                                                      |
| `color`       | `TEXT`        | yes      | Curated `ListColorId` allow-list value.                                                     |
| `tags`        | `JSONB`       | yes      | Array of 0–10 normalized tag strings (`'[]'::jsonb` for system lists); GIN indexed.         |
| `created_at`  | `TIMESTAMPTZ` | yes      | Creation timestamp (`NOW()`).                                                               |
| `updated_at`  | `TIMESTAMPTZ` | yes      | Last modification timestamp (`NOW()`).                                                      |

```sql
CREATE TABLE user_lists (
  id TEXT PRIMARY KEY,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  system_key TEXT UNIQUE CHECK (system_key IS NULL OR system_key IN ('want_to_watch', 'watching', 'watched')),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('series', 'person')),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX idx_user_lists_name_lower ON user_lists (LOWER(name));
CREATE INDEX idx_user_lists_entity_type ON user_lists (entity_type, is_system DESC, updated_at DESC);
CREATE INDEX idx_user_lists_tags_gin ON user_lists USING GIN (tags);
```

#### `custom_list_series` - PostgreSQL join table for custom Series list memberships

| Field       | Type           | Required | Description                                                                            |
| ----------- | -------------- | -------- | -------------------------------------------------------------------------------------- |
| `list_id`   | `TEXT` (FK)    | yes      | References `user_lists(id) ON DELETE CASCADE` (custom `series` lists only).            |
| `series_id` | `INTEGER` (FK) | yes      | References `watchlist_items(series_id) ON DELETE CASCADE` (enforces `FR10` invariant). |
| `added_at`  | `TIMESTAMPTZ`  | yes      | Timestamp when series was added to the custom list (`NOW()`).                          |

```sql
CREATE TABLE custom_list_series (
  list_id TEXT NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  series_id INTEGER NOT NULL REFERENCES watchlist_items(series_id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (list_id, series_id)
);
CREATE INDEX idx_custom_list_series_series_id ON custom_list_series (series_id);
```

#### `custom_list_people` - PostgreSQL table for custom People list memberships

| Field        | Type          | Required | Description                                                              |
| ------------ | ------------- | -------- | ------------------------------------------------------------------------ |
| `list_id`    | `TEXT` (FK)   | yes      | References `user_lists(id) ON DELETE CASCADE` (custom `person` lists).   |
| `person_id`  | `INTEGER`     | yes      | TVmaze person ID; composite PK `(list_id, person_id)`.                   |
| `name`       | `TEXT`        | yes      | Cached person name for fast People list rendering.                       |
| `image_url`  | `TEXT`        | no       | Cached portrait URL (`NULL` when unavailable).                           |
| `country`    | `TEXT`        | no       | Cached country name (`NULL` when unavailable).                           |
| `tvmaze_url` | `TEXT`        | yes      | Canonical TVmaze person URL for CC BY-SA attribution.                    |
| `added_at`   | `TIMESTAMPTZ` | yes      | Timestamp when person was added (`NOW()`).                               |

```sql
CREATE TABLE custom_list_people (
  list_id TEXT NOT NULL REFERENCES user_lists(id) ON DELETE CASCADE,
  person_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  image_url TEXT,
  country TEXT,
  tvmaze_url TEXT NOT NULL,
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (list_id, person_id)
);
CREATE INDEX idx_custom_list_people_person_id ON custom_list_people (person_id);
```

#### Curated allow-lists (`ListIconId` and `ListColorId`)

| Allow-list    | Allowed values                                                                                                                                            | Default primary list mapping                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `ListIconId`  | `bookmark`, `play`, `check-circle`, `star`, `heart`, `flame`, `tv`, `film`, `sparkles`, `clock`, `trophy`, `users`, `user-check`, `clapperboard`, `compass`, `rocket` | `want_to_watch` → `bookmark`; `watching` → `play`; `watched` → `check-circle`       |
| `ListColorId` | `cyan`, `violet`, `pink`, `amber`, `emerald`, `orange`, `sky`, `yellow`                                                                                   | `want_to_watch` → `cyan`; `watching` → `amber`; `watched` → `emerald`               |

#### `ListBadgeSummary` - compact list membership badge attached to series & person responses

| Field       | Type                | Required | Description                                                          |
| ----------- | ------------------- | -------- | -------------------------------------------------------------------- |
| `id`        | `string`            | yes      | List ID (`'want_to_watch'`, `'watching'`, `'watched'`, or UUID).     |
| `name`      | `string`            | yes      | Localized display name (for primary lists) or user-defined name.     |
| `icon`      | `ListIconId`        | yes      | Curated icon identifier.                                             |
| `color`     | `ListColorId`       | yes      | Curated high-contrast neon color identifier.                         |
| `isSystem`  | `boolean`           | yes      | `true` for the 3 primary progress lists; `false` for custom lists.   |
| `systemKey` | `WatchStatus\|null` | yes      | Primary status key when `isSystem` is `true`; `null` otherwise.      |

```text
{
  "id": "watching",
  "name": "Watching",
  "icon": "play",
  "color": "amber",
  "isSystem": true,
  "systemKey": "watching"
}
```

#### `UserListSummary` - list card payload returned by `GET /api/lists`

| Field         | Type                  | Required | Description                                                        |
| ------------- | --------------------- | -------- | ------------------------------------------------------------------ |
| `id`          | `string`              | yes      | List ID.                                                           |
| `isSystem`    | `boolean`             | yes      | `true` for the 3 primary lists.                                    |
| `systemKey`   | `WatchStatus \| null` | yes      | Primary status key or `null`.                                      |
| `entityType`  | `'series' \| 'person'`| yes      | Strict list entity type.                                           |
| `name`        | `string`              | yes      | Localized system name or custom name.                              |
| `description` | `string \| null`      | yes      | Localized system description or custom description (`null` if empty). |
| `icon`        | `ListIconId`          | yes      | Curated icon identifier.                                           |
| `color`       | `ListColorId`         | yes      | Curated high-contrast neon color identifier.                       |
| `tags`        | `string[]`            | yes      | Free-form normalized tags (`[]` for primary lists).                |
| `itemCount`   | `number`              | yes      | Number of series or people currently in the list.                  |
| `updatedAt`   | `string`              | yes      | ISO-8601 UTC timestamp.                                            |

```text
{
  "id": "8c1f2e90-54f1-4a7d-9b34-3e5e5e73b21a",
  "isSystem": false,
  "systemKey": null,
  "entityType": "series",
  "name": "Weekend Sci-Fi",
  "description": "Mind-bending futuristic shows to binge",
  "icon": "rocket",
  "color": "cyan",
  "tags": ["sci-fi", "weekend"],
  "itemCount": 4,
  "updatedAt": "2026-11-27T20:30:00.000Z"
}
```

#### `ListDetailResponse` - discriminated payload returned by `GET /api/lists/:listId`

| Field  | Type                                | Required | Description                                                          |
| ------ | ----------------------------------- | -------- | -------------------------------------------------------------------- |
| `list` | `UserListSummary`                   | yes      | Full list metadata and current item count.                           |
| `items`| `WatchlistItem[] \| PersonListItem[]` | yes    | Series items (with shared tracking + `lists[]`) or Person items (with `lists[]`). |

```text
{
  "list": {
    "id": "8c1f2e90-54f1-4a7d-9b34-3e5e5e73b21a",
    "isSystem": false,
    "systemKey": null,
    "entityType": "person",
    "name": "Favorite Creators",
    "description": "Showrunners and directors I follow",
    "icon": "clapperboard",
    "color": "yellow",
    "tags": ["creators", "drama"],
    "itemCount": 1,
    "updatedAt": "2026-11-27T20:35:00.000Z"
  },
  "items": [
    {
      "personId": 14229,
      "name": "Bryan Cranston",
      "imageUrl": "https://static.tvmaze.com/uploads/images/medium_portrait/195/488839.jpg",
      "country": "United States",
      "tvmazeUrl": "https://www.tvmaze.com/people/14229/bryan-cranston",
      "addedAt": "2026-11-27T20:35:10.000Z",
      "lists": [
        { "id": "8c1f2e90-54f1-4a7d-9b34-3e5e5e73b21a", "name": "Favorite Creators", "icon": "clapperboard", "color": "yellow", "isSystem": false, "systemKey": null }
      ]
    }
  ]
}
```

#### `UpdateSeriesListsResponse` & `UpdatePersonListsResponse` - atomic batch update contracts

| Type                        | Fields                                                         | Description                                                    |
| --------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------- |
| `UpdateSeriesListsResponse` | `seriesId: number`, `tracking: SeriesTrackingState`, `lists: ListBadgeSummary[]` | Updated tracking/primary state and full ordered list badges. |
| `UpdatePersonListsResponse` | `personId: number`, `lists: ListBadgeSummary[]`                | Full updated custom People list badges for the person.         |

```text
{
  "seriesId": 169,
  "tracking": {
    "inWatchlist": true,
    "status": "want_to_watch",
    "watchedEpisodes": 0,
    "totalEpisodes": 62,
    "progressPercent": 0,
    "nextEpisode": { "id": 12192, "season": 1, "number": 1, "name": "Pilot", "airdate": "2008-01-20" }
  },
  "lists": [
    { "id": "want_to_watch", "name": "Want to Watch", "icon": "bookmark", "color": "cyan", "isSystem": true, "systemKey": "want_to_watch" },
    { "id": "8c1f2e90-54f1-4a7d-9b34-3e5e5e73b21a", "name": "Weekend Sci-Fi", "icon": "rocket", "color": "cyan", "isSystem": false, "systemKey": null }
  ]
}
```

#### `ApiErrorResponse` - added error codes (extending existing envelope)

| Code               | HTTP | Meaning                                                                                       |
| ------------------ | ---- | --------------------------------------------------------------------------------------------- |
| `VALIDATION_ERROR` | 400  | Invalid name/description/icon/color/tags, wrong entity type, or cross-type list assignment.   |
| `FORBIDDEN`        | 403  | Attempt to delete a primary list or edit a primary list's name, description, tags, or type.   |
| `NOT_FOUND`        | 404  | List, series, person, or list membership not found.                                           |
| `CONFLICT`         | 409  | Duplicate custom list name (case-insensitive) or reserved primary list name collision.        |

```text
{
  "error": {
    "code": "FORBIDDEN",
    "message": "Primary lists cannot be deleted or renamed; only their icon and color can be updated."
  }
}
```

### API endpoints

#### Overview

| Method   | Route                             | Description                                                                        |
| -------- | --------------------------------- | ---------------------------------------------------------------------------------- |
| `GET`    | `/api/lists`                      | List the 3 primary lists and custom lists (optional `type` and `tag` filters).     |
| `POST`   | `/api/lists`                      | Create a new custom Series-only or People-only list.                               |
| `GET`    | `/api/lists/:listId`              | Fetch list metadata and all items with their membership badges.                    |
| `PATCH`  | `/api/lists/:listId`              | Update custom list metadata, or icon/color only for primary lists.                 |
| `DELETE` | `/api/lists/:listId`              | Delete a custom list safely (preserves primary lists & watched episodes).          |
| `DELETE` | `/api/lists/:listId/items/:itemId`| Remove a single series or person from a custom list.                               |
| `PUT`    | `/api/series/:seriesId/lists`     | Atomically update a series' primary list and custom Series list memberships.       |
| `PUT`    | `/api/people/:personId/lists`     | Atomically update a person's custom People list memberships.                       |

> **Extended existing endpoints (backwards-compatible additive field):** `GET /api/search`, `GET /api/series/:id`, `GET /api/people/:id`, `GET /api/watchlist`, and `GET /api/recommendations/next-binge` retain identical existing fields and additionally return `lists: ListBadgeSummary[]` on every series item/credit/profile/recommendation and on person items/profiles.

---

#### `GET /api/lists`

Returns the 3 primary progress lists and user-created custom lists with live item counts and available tags.

**Query parameters**

| Parameter | Type   | Default | Rules                                                      |
| --------- | ------ | ------- | ---------------------------------------------------------- |
| `type`    | string | `all`   | Optional filter for custom lists: `all`, `series`, `person`. |
| `tag`     | string | `-`     | Optional case-insensitive tag filter for custom lists.     |
| `lang`    | string | `en`    | `en` or `pt-BR`; localizes primary list names/descriptions.|

**Responses**

| Status | Body                | When                          |
| ------ | ------------------- | ----------------------------- |
| `200`  | `UserListsResponse` | Success (`primaryLists`, `customLists`, `availableTags`). |
| `400`  | `ApiErrorResponse`  | Invalid `type` query value.   |

**Example - success**

```http
GET /api/lists?type=series&tag=sci-fi&lang=en
```

```text
{
  "primaryLists": [
    { "id": "want_to_watch", "isSystem": true, "systemKey": "want_to_watch", "entityType": "series", "name": "Want to Watch", "description": "Series queued to watch next", "icon": "bookmark", "color": "cyan", "tags": [], "itemCount": 2, "updatedAt": "2026-11-27T20:00:00.000Z" }
  ],
  "customLists": [
    { "id": "8c1f2e90-54f1-4a7d-9b34-3e5e5e73b21a", "isSystem": false, "systemKey": null, "entityType": "series", "name": "Weekend Sci-Fi", "description": "Mind-bending futuristic shows", "icon": "rocket", "color": "cyan", "tags": ["sci-fi", "weekend"], "itemCount": 4, "updatedAt": "2026-11-27T20:30:00.000Z" }
  ],
  "availableTags": ["sci-fi", "weekend"]
}
```

---

#### `POST /api/lists`

Creates a new custom list strictly typed as `series` or `person`.

**Body**

| Parameter     | Type     | Default | Rules                                                                              |
| ------------- | -------- | ------- | ---------------------------------------------------------------------------------- |
| `name`        | string   | `-`     | Required, trimmed, 1–60 chars, unique (case-insensitive), not a reserved primary name. |
| `description` | string   | `null`  | Optional, trimmed, max 240 chars.                                                  |
| `entityType`  | string   | `-`     | Required: `'series'` or `'person'`.                                                |
| `icon`        | string   | `-`     | Required, member of `LIST_ICON_IDS`.                                               |
| `color`       | string   | `-`     | Required, member of `LIST_COLOR_IDS`.                                              |
| `tags`        | string[] | `[]`    | Optional, max 10 tags, each 1–24 chars after trim, deduplicated case-insensitively. |

**Responses**

| Status | Body               | When                                          |
| ------ | ------------------ | --------------------------------------------- |
| `201`  | `UserListSummary`  | Custom list created.                          |
| `400`  | `ApiErrorResponse` | Validation failure on any field.              |
| `409`  | `ApiErrorResponse` | Name collides with existing or primary list.  |

---

#### `PATCH /api/lists/:listId`

Updates metadata for a custom list, or updates **only** `icon` and/or `color` for a primary list.

**Body**

| Parameter     | Type     | Default | Rules                                                                                |
| ------------- | -------- | ------- | ------------------------------------------------------------------------------------ |
| `name`        | string   | `-`     | Custom lists only (1–60 chars, unique). Rejected with `403` on primary lists.        |
| `description` | string   | `-`     | Custom lists only (max 240 chars or `null`). Rejected with `403` on primary lists.   |
| `icon`        | string   | `-`     | Allowed on both primary and custom lists (`LIST_ICON_IDS`).                          |
| `color`       | string   | `-`     | Allowed on both primary and custom lists (`LIST_COLOR_IDS`).                         |
| `tags`        | string[] | `-`     | Custom lists only (max 10 tags). Rejected with `403` on primary lists.               |
| `entityType`  | string   | `-`     | Always immutable (`400`/`403` if caller attempts to change `entityType`).            |

**Responses**

| Status | Body               | When                                                      |
| ------ | ------------------ | --------------------------------------------------------- |
| `200`  | `UserListSummary`  | List updated cleanly.                                     |
| `400`  | `ApiErrorResponse` | Invalid icon, color, name, description, or tags.          |
| `403`  | `ApiErrorResponse` | Attempted forbidden field edit on a primary list.         |
| `404`  | `ApiErrorResponse` | `listId` does not exist.                                  |
| `409`  | `ApiErrorResponse` | Renamed custom list collides with another/primary list.   |

---

#### `DELETE /api/lists/:listId`

Safely deletes a custom list and its memberships without affecting `watchlist_items`, `watched_episodes`, or other custom lists.

**Responses**

| Status | Body               | When                                        |
| ------ | ------------------ | ------------------------------------------- |
| `204`  | Empty              | Custom list deleted.                        |
| `403`  | `ApiErrorResponse` | Attempted deletion of a primary list.       |
| `404`  | `ApiErrorResponse` | `listId` does not exist.                    |

---

#### `GET /api/lists/:listId` and `DELETE /api/lists/:listId/items/:itemId`

- `GET /api/lists/:listId?lang=en|pt-BR` returns `ListDetailResponse` (`200`) or `404`. For primary lists (`want_to_watch`, `watching`, `watched`), items are loaded via `WatchlistService.list({ status, locale })` with each item's full `lists[]` hydrated.
- `DELETE /api/lists/:listId/items/:itemId` removes a single series or person from a custom list (`204`), rejecting primary list IDs (`403` — untracking from a primary list must go through `DELETE /api/watchlist/:seriesId` or `PUT /api/series/:seriesId/lists` with `primaryStatus: null`).

---

#### `PUT /api/series/:seriesId/lists`

Atomically applies a series' primary status (`Want to Watch` / `Watching` / `Watched` / untracked) and exact set of custom Series list memberships in **one PostgreSQL transaction**.

**Body**

| Parameter       | Type                 | Default | Rules                                                                                       |
| --------------- | -------------------- | ------- | ------------------------------------------------------------------------------------------- |
| `primaryStatus` | `WatchStatus \| null`| `-`     | `'want_to_watch'`, `'watching'`, `'watched'`, or `null` (untrack).                          |
| `customListIds` | `string[]`           | `-`     | Array of custom `series` list IDs; deduplicated; rejects primary IDs, unknown IDs, or `person` lists. |

**Responses**

| Status | Body                        | When                                                                  |
| ------ | --------------------------- | --------------------------------------------------------------------- |
| `200`  | `UpdateSeriesListsResponse` | All additions, removals, and primary status updates committed cleanly.|
| `400`  | `ApiErrorResponse`          | Invalid status, non-array `customListIds`, or cross-type `person` list.|
| `404`  | `ApiErrorResponse`          | Series not found on TVmaze or unknown custom list ID.                 |

> **Invariant enforcement (`FR10`):** If `customListIds.length > 0` and `primaryStatus === null`, the backend resolves the series' existing primary status (or derives it from watched progress / defaults to `'want_to_watch'`), ensuring no series can ever belong to a custom Series list without a primary list. If `primaryStatus === null` and `customListIds.length === 0`, the series is removed from `watchlist_items` (cascading to `watched_episodes` and `custom_list_series`).

---

#### `PUT /api/people/:personId/lists`

Atomically replaces a person's custom People list memberships in **one PostgreSQL transaction**.

**Body**

| Parameter       | Type       | Default | Rules                                                                              |
| --------------- | ---------- | ------- | ---------------------------------------------------------------------------------- |
| `customListIds` | `string[]` | `-`     | Array of custom `person` list IDs; deduplicated; rejects `series` lists or unknown IDs. |

**Responses**

| Status | Body                        | When                                                             |
| ------ | --------------------------- | ---------------------------------------------------------------- |
| `200`  | `UpdatePersonListsResponse` | All additions and removals committed cleanly.                    |
| `400`  | `ApiErrorResponse`          | Non-array `customListIds` or cross-type `series` list supplied.  |
| `404`  | `ApiErrorResponse`          | Person not found on TVmaze (when adding) or unknown custom list. |

---

## Integration points

- **PostgreSQL 18.7 (`pg.Pool` transactions):**
  - `PUT /api/series/:seriesId/lists` and `PUT /api/people/:personId/lists` acquire a `PoolClient` via `db.connect()`, run `BEGIN` → mutations → `COMMIT`, call `ROLLBACK` on any error, and always release the client inside `finally`.
  - Batch membership queries use `WHERE series_id = ANY($1::int[])` and `WHERE person_id = ANY($1::int[])` so loading Search (20+ results) or Person Credits (50+ credits) executes only O(1) constant SQL queries regardless of item count.
- **TVmaze API (via existing `TvmazeClient`):**
  - Only called during `PUT /api/series/:seriesId/lists` when adding a previously untracked series (to cache show title, poster, genres, rating, episode count, and `pt-BR` AKA), or during `PUT /api/people/:personId/lists` when adding a person to ≥ 1 list (to cache portrait, name, country, TVmaze URL). Removing or clearing memberships requires zero upstream calls.
- **`node-pg-migrate`:**
  - Second migration (`backend/migrations/<timestamp>_custom-watchlists.ts`) runs cleanly on top of `1764200000000_initial-schema.ts` and rolls back cleanly without affecting the initial tables.

## Testing approach

Target coverage: **≥ 80%** across lines, branches, functions, and statements in both `backend/` and `frontend/` (enforced by Vitest thresholds per `.agents/rules/tests.md`).

### Unit tests

| ID    | Test case name                                                                              | Acceptance criteria | Expected result                                                                                     |
| ----- | ------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| UT-01 | `listValidation` validates name, description, curated icon/color, tags, and reserved names  | AC-01, AC-02, AC-03 | Accepts valid payloads; rejects blank/oversized/duplicate/reserved names, invalid icons/colors, >10 tags. |
| UT-02 | `UserListService` enforces primary list protection (no delete, icon/color-only PATCH)       | AC-01, AC-04        | Throws `FORBIDDEN` (403) on primary delete or name/desc/tags edit; persists icon/color changes.     |
| UT-03 | `ListMembershipService` enforces FR10 invariant, cross-type rejection, and badge ordering   | AC-05, AC-06, AC-07 | Primary badge always first; adding untracked series to custom list assigns `want_to_watch`; cross-type throws 400. |
| UT-04 | Existing backend services hydrate `lists[]` on Search, Series, Person, Watchlist & NextBinge| AC-08–AC-11         | Batch lookup attaches localized primary + custom list badges cleanly across all 5 series & 2 person surfaces. |
| UT-05 | `ListMembershipBadges` renders ≤ 3 badges + `+N` overflow and links to `/watchlist/:listId` | AC-11, AC-12        | Displays primary list first, caps at 3 inline chips + accessible `+N` disclosure, links accurately. |
| UT-06 | `ListFormModal` validates inputs, tag chips, icon/color pickers, and primary lock mode      | AC-01, AC-02, AC-03 | Locks name/description/type/delete in primary mode; enforces client & server error display in `en`/`pt-BR`. |
| UT-07 | `ListMembershipModal` supports batch multi-select, auto-primary selection & clear confirm   | AC-05, AC-06, AC-07 | Single save submits additions + removals atomically; checking custom auto-selects primary; clearing shows warning. |
| UT-08 | `WatchlistView` & `ListDetailView` render primary lists, custom lists, type/tag filters     | AC-01, AC-04, AC-09 | Filters by type & tag, opens create/edit/delete modals, displays Series & People list items cleanly. |
| UT-09 | `NextBingeCard`, `SearchResultCard`, `SeriesProfileView`, `PersonProfileView` show badges   | AC-08–AC-12         | All 5 series surfaces and 2 person surfaces render badges without nested `<a>` tags; modals save & refresh. |

### Integration tests

| ID    | Test case name                                                                              | Acceptance criteria | Expected result                                                                                     |
| ----- | ------------------------------------------------------------------------------------------- | ------------------- | --------------------------------------------------------------------------------------------------- |
| IT-01 | Custom watchlists migration (`up` → `down` → `up`) seeds 3 primary lists & cleans up on down| AC-01, AC-02        | Creates `user_lists`, `custom_list_series`, `custom_list_people`, seeds 3 system rows, rolls back cleanly. |
| IT-02 | `UserListRepository` & `ListMembershipRepository` CRUD, unique lower(name), & FK cascades   | AC-01–AC-05         | Verifies case-insensitive uniqueness, safe custom delete preserving `watched_episodes`, and primary delete cascade. |
| IT-03 | HTTP CRUD `/api/lists*` including primary protection (`403`), duplicates (`409`), filters   | AC-01–AC-04, AC-12  | Validates `en`/`pt-BR` errors, type/tag filtering, primary icon/color customization, and safe delete. |
| IT-04 | Atomic `PUT /api/series/:id/lists` & `PUT /api/people/:id/lists` multi-select + FR10 sync   | AC-05, AC-06, AC-07 | Single PUT adds + removes multiple lists atomically, auto-creates primary row, rejects cross-type with 400. |
| IT-05 | Batch hydration across `/api/search`, `/recommendations/next-binge`, `/series/:id`, `/people/:id`, `/watchlist` | AC-08–AC-11 | All 5 series surfaces and 2 person surfaces return accurate localized `lists[]` with customized icons/colors. |

### E2E tests

| ID     | Test case name                                                                             | Acceptance criteria | Expected result                                                                                     |
| ------ | ------------------------------------------------------------------------------------------ | ------------------- | --------------------------------------------------------------------------------------------------- |
| E2E-01 | Customize primary list icon & color, verify protection and badge propagation               | AC-01, AC-12        | Primary lists cannot be deleted/renamed; customized icon/color persists and updates badges across views. |
| E2E-02 | Custom Series & People list CRUD, type/tag filters, and safe deletion preserving episodes  | AC-02–AC-05         | Create, filter, edit, and delete custom lists with confirmation while preserving watched episodes & other lists. |
| E2E-03 | Unified multi-select modal for Series & People + ubiquitous badges across all 5 surfaces   | AC-06–AC-11         | Single edit adds/removes multiple lists; badges appear on Recommendation, Search, Series Profile, My Lists, and Person Credits; clicking a badge opens `/watchlist/:listId`. |
| E2E-04 | Overflow `+N` disclosure, bilingual `en`/`pt-BR` localization, keyboard a11y & 375px mobile| AC-11, AC-12        | >3 lists collapse cleanly to `3 + N`; full `pt-BR`/`en` copy; keyboard Escape/Tab/Space works; 0 overflow at 375px. |

## Development sequencing

### Build order

1. **PostgreSQL migration & list catalog (`backend/`):** Create `<timestamp>_custom-watchlists.ts` migration seeding the 3 primary lists, add `types/list.ts`, `config/listCatalog.ts`, new error codes/messages (`CONFLICT`, `FORBIDDEN`, localized `en`/`pt-BR`), and update `testDatabase.ts` so primary system rows stay seeded across test resets (`IT-01`).
2. **Backend repositories & services:** Implement `UserListRepository`, `ListMembershipRepository`, `listValidation.ts`, `ListMembershipService`, `UserListService`, and `inMemoryRepositories.ts` doubles (`UT-01`–`UT-03`, `IT-02`).
3. **Backend HTTP routes & ubiquitous badge hydration:** Add `listRoutes.ts`, wire `app.ts`, and hydrate `lists[]` across `SearchService`, `RecommendationService`, `SeriesService`, `PersonService`, and `WatchlistService` (`UT-04`, `IT-03`–`IT-05`).
4. **Frontend shared primitives & modals:** Add `types/list.ts`, `styles/listPalette.ts`, `services/listService.ts`, `ConfirmDialog`, `ListIcon`, `ListMembershipBadges`, `ListFormModal`, and `ListMembershipModal` + hooks (`UT-05`–`UT-07`).
5. **Frontend views & ubiquitous badge rollout:** Evolve `WatchlistView` into My Lists hub, add `ListDetailView` (`/watchlist/:listId`), refactor `SearchResultCard` and `SeriesCreditCard` to avoid nested links, integrate `ListMembershipBadges` + `ListMembershipModal` across Home/Recommendation, Search, Series Profile, My Lists, and Person Profile/Credits, and complete `en`/`pt-BR` i18n (`UT-08`, `UT-09`).
6. **Playwright E2E & full verification:** Update/add Playwright specs (`E2E-01`–`E2E-04`) and verify all backend, frontend, and E2E suites + ≥ 80% coverage + accessibility.

### Technical dependencies

- Local PostgreSQL 18.7 container running via `backend/compose.yaml` (`npm run db:up`) for `node-pg-migrate`, backend integration tests, and Playwright E2E.
- Existing `lucide-react` icon package in `frontend/` (already installed — zero new frontend dependencies required!).

## Monitoring and observability

- **Structured Logging (`backend/src/config/logger.ts`):**
  - `warn`: Validation errors (`400`), forbidden primary-list mutation attempts (`403`), duplicate list name conflicts (`409`), and not-found lookups (`404`) logged via `errorMiddleware.ts` with route, code, and status code.
  - `error`: Transaction rollback errors or unexpected PostgreSQL failures logged with sanitized context (never exposing connection strings or credentials).
- **Health Check (`GET /health`):** Unchanged; continues probing live PostgreSQL connectivity (`SELECT 1`).

## Technical considerations

### Key decisions

- **Unified `user_lists` table with stable system keys (`'want_to_watch'`, `'watching'`, `'watched'`):**
  - *Rationale:* Allows primary and custom lists to share a single visual customization model (icon + color), unified `/watchlist/:listId` URLs, and consistent `ListBadgeSummary` payloads without duplicating badge rendering logic.
- **Database-enforced `FR10` invariant via `FOREIGN KEY (series_id) REFERENCES watchlist_items(series_id) ON DELETE CASCADE`:**
  - *Rationale:* Makes orphaned custom Series memberships impossible even under concurrent writes, guarantees deleting a custom list never touches `watchlist_items` or `watched_episodes`, and guarantees untracking a series cleans up custom Series memberships atomically.
- **Transactional `PUT /api/series/:seriesId/lists` & `PUT /api/people/:personId/lists` replacing memberships in one round-trip:**
  - *Rationale:* Directly satisfies the single-edit multi-select UX requirement (add + remove across multiple lists atomically), prevents partial-failure states when toggling 5 lists at once, and eliminates redundant per-checkbox HTTP chatter.
- **Batch `ANY($1::int[])` membership hydration on backend responses:**
  - *Rationale:* Prevents N+1 SQL queries when rendering Search results or a prolific actor's 60-show filmography, while keeping frontend components simple (they receive `lists[]` directly on every DTO with zero extra client fetches).
- **Refactoring `SearchResultCard` and `SeriesCreditCard` to `<article>` wrappers with inner `<Link>`:**
  - *Rationale:* Clickable list badges (`<Link to="/watchlist/:listId">`) cannot be nested inside an outer `<Link>` without violating HTML5 specs and breaking screen readers/keyboard navigation.
- **Preserving `/watchlist` hub URL + adding `/watchlist/:listId`:**
  - *Rationale:* Keeps existing bookmarks, header route, and Playwright E2E navigation 100% backwards-compatible while providing clean deep links to every primary and custom list.

### Known risks

- **`resetTestDatabase` accidentally deleting seeded system rows:** Running `TRUNCATE TABLE user_lists` in tests would wipe the 3 seeded primary lists (`want_to_watch`, `watching`, `watched`). *Mitigation:* `resetTestDatabase` truncates `custom_list_series, custom_list_people, watched_episodes, watchlist_items, user_preferences CASCADE`, executes `DELETE FROM user_lists WHERE is_system = FALSE`, and restores the 3 system rows' default `icon` and `color`.
- **Component & file size limits (`≤ 100` lines/file, `≤ 30` lines/component):** Modals (`ListFormModal`, `ListMembershipModal`) and `WatchlistView` can easily exceed 30 lines if monolithic. *Mitigation:* Decompose into focused subcomponents (`IconPickerGrid`, `ColorPickerGrid`, `TagChipInput`, `PrimaryStatusSection`, `CustomListCheckboxGroup`, `ListSummaryCard`, `ListHubFilters`) and custom hooks (`useLists`, `useListDetail`, `useListMembershipEditor`).
- **Existing E2E / unit test regressions when evolving `WatchlistView` and `WatchlistControls`:** Existing tests interact with `/watchlist` and Series Profile status controls. *Mitigation:* Keep the status filter tabs / primary list views accessible and update existing view tests cleanly alongside new unit/integration/E2E coverage.
- **Neon color contrast on dark HUD surfaces:** Custom list badges must stay readable across all 8 curated colors. *Mitigation:* Pre-verify every color token pair in `listPalette.ts` against `--ds-surface` (`rgba(11, 16, 30, 0.78)`) for WCAG 2.1 AA contrast (`≥ 4.5:1`) and never rely on color alone (always pair color + icon + text).

### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and incorporated:
- **`AGENTS.md`:** Preserves independent `backend/` and `frontend/` directories with no root `package.json`; all PostgreSQL schema changes go through reversible `node-pg-migrate` TypeScript migrations in `backend/migrations/`; all user-facing strings and API errors localized in `en` and `pt-BR`; all required test, lint, typecheck, and build commands verified in both apps.
- **`code-standards.md`:** Every `.ts`/`.tsx` file ≤ 100 lines, every function/method/component ≤ 30 lines, ≤ 3 parameters (use named parameter objects), max 3 nested `if`/`else`, zero blank lines inside functions, zero unnecessary comments, constants extracted for limits/allow-lists, zero hardcoded credentials.
- **`javascript-typescript.md`:** Zero `any`, `const` by default, strict `===`/`!==`, explicit types and `Promise<T>`, `unknown` in `catch` blocks, immutable updates, 0 ESLint errors/warnings.
- **`node.md`:** Pure `async/await` PostgreSQL queries and transactions, centralized `logger.ts`, clean `finally` release of `PoolClient`, acyclic module dependencies (`config → routes → services → data → types`).
- **`tests.md`:** ≥ 80% coverage enforced by Vitest across lines, branches, functions, and statements in both `backend/` and `frontend/`; FIRST principle with fast isolated unit tests, real PostgreSQL integration tests on `next_binge_watch_test`, and Playwright E2E tests in root `e2e/`.
- **`folder-structure.md`:** New backend modules organized cleanly under `backend/src/{config,routes,services,data,types}` and `backend/migrations/`; new frontend modules under `frontend/src/{components/lists,components/common,hooks,services,styles,types,views}`.

### Skill compliance

- **`react` (`.agents/skills/react/SKILL.md`):** Explicitly loaded and applied to all frontend components and hooks:
  - Granular functional components strictly ≤ 30 lines each (`ListIcon`, `ListMembershipBadges`, `ListMembershipModal`, `PrimaryStatusSection`, `CustomListCheckboxGroup`, `ListFormModal`, `IconPickerGrid`, `ColorPickerGrid`, `TagChipInput`, `ConfirmDialog`, `ListSummaryCard`, `ListHubFilters`, `PersonListCard`, `ListDetailView`).
  - Explicit props only — zero JSX prop spreading (`{...props}`).
  - Custom hooks prefixed with `use` (`useLists`, `useListDetail`, `useListMembershipEditor`), `useEffect` restricted solely to external synchronization (fetching, `Escape` key listeners), zero derived-state effects, immutable functional state updaters.
  - Strict separation of HTTP access in `services/listService.ts` from visual components.
  - Full WCAG 2.1 AA semantics (`role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-pressed`, `aria-checked`, `aria-expanded`, descriptive `aria-label`s, visible focus rings) and Tailwind CSS + Design System tokens (`DESIGN.md`).

### Relevant and dependent files

**New backend files:**
- `backend/migrations/<timestamp>_custom-watchlists.ts`
- `backend/src/config/listCatalog.ts`
- `backend/src/types/list.ts`
- `backend/src/data/userListRepository.ts`
- `backend/src/data/listMembershipRepository.ts`
- `backend/src/services/listValidation.ts`
- `backend/src/services/listMembershipService.ts`
- `backend/src/services/userListService.ts`
- `backend/src/routes/listRoutes.ts`
- Co-located tests: `listValidation.test.ts`, `userListService.test.ts`, `listMembershipService.test.ts`, `listRepositories.test.ts`, `listRoutes.test.ts`

**Modified backend files:**
- `backend/src/app.ts`
- `backend/src/types/{error,search,series,person,recommendation,watchlist}.ts`
- `backend/src/i18n/{enMessages,ptBrMessages}.ts`
- `backend/src/data/testDatabase.ts`
- `backend/src/services/{inMemoryRepositories,searchService,seriesService,seriesProfileMapper,personService,recommendationService,recommendationPicks,recommendationDiscovery,watchlistService,watchlistMapper}.ts`

**New frontend files:**
- `frontend/src/types/list.ts`
- `frontend/src/styles/listPalette.ts`
- `frontend/src/services/listService.ts`
- `frontend/src/hooks/{useLists,useListDetail,useListMembershipEditor}.ts`
- `frontend/src/components/common/ConfirmDialog.tsx`
- `frontend/src/components/lists/{ListIcon,ListMembershipBadges,ListMembershipModal,PrimaryStatusSection,CustomListCheckboxGroup,ListFormModal,IconPickerGrid,ColorPickerGrid,TagChipInput,ListSummaryCard,ListHubFilters,PersonListCard}.tsx`
- `frontend/src/views/ListDetailView.tsx`
- Co-located tests: `ListMembershipBadges.test.tsx`, `ListFormModal.test.tsx`, `ListMembershipModal.test.tsx`, `ListDetailView.test.tsx`

**Modified frontend & E2E files:**
- `frontend/src/App.tsx`
- `frontend/src/i18n/{en,ptBR}.ts`
- `frontend/src/types/{search,series,person,recommendation,watchlist}.ts`
- `frontend/src/views/{WatchlistView,HomeView,SeriesProfileView,PersonProfileView}.tsx`
- `frontend/src/components/search/SearchResultCard.tsx`
- `frontend/src/components/recommendation/NextBingeCard.tsx`
- `frontend/src/components/series/{SeriesHeader,WatchlistControls}.tsx`
- `frontend/src/components/person/{PersonHeader,SeriesCreditCard}.tsx`
- `frontend/src/components/watchlist/WatchlistCard.tsx`
- `e2e/custom-watchlists.spec.ts` (new Playwright E2E spec) & regression verification of existing `e2e/*.spec.ts`
