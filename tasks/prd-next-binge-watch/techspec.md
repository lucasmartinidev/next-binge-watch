# Technical Specification

## Summary

This specification defines the technical architecture for **NEXT BINGE WATCH**, derived from [prd.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/prd.md). The solution preserves the existing two-application architecture (`frontend/` and `backend/`) while introducing a clean backend-for-frontend (BFF) layer that mediates all interactions with the keyless TVmaze API (`https://api.tvmaze.com`), persists single-user watchlist, episode progress, and language preferences in a local embedded SQLite database via `@libsql/client`, and returns display-ready, localized JSON payloads (`en` and `pt-BR`) to the React 19 frontend.

To stay within TVmaze's rate limit (20 requests per 10 seconds per IP) and achieve the PRD latency targets (p95 ≤ 1.5s for search/profiles, ≤ 300ms for watchlist operations), the backend implements an in-memory TTL cache, a 5-second upstream timeout with bounded single retry on HTTP `429`, and graceful partial degradation when auxiliary sub-resources (`crew`, `akas`, or secondary credits) fail. On the frontend, `react-router-dom` enables bookmarkable profile and watchlist routes (`/`, `/series/:id`, `/people/:id`, `/watchlist`), a lightweight typed i18n context handles browser language detection (`en` / `pt-BR`) and persistence, and Vite proxies `/api` and `/health` to the backend in development with `VITE_API_URL` override support for cross-origin deployments.

## System architecture

### Component overview

The architecture enforces unidirectional dependencies (`routes → services → data` in the backend and `views → components/hooks → services → backend` in the frontend), ensuring the browser never contacts TVmaze directly.

#### Backend (`backend/src/`)

- **Configuration & Infrastructure (`config/`, `i18n/`, `app.ts`, `index.ts`)**
  - `config/env.ts` *(new)*: Loads and validates `PORT`, `DATABASE_URL`, `TVMAZE_BASE_URL`, and `TVMAZE_TIMEOUT_MS` at startup via `dotenv`.
  - `config/logger.ts` *(new)*: Centralized JSON structured logger (sole adapter using `console.log`/`console.error`).
  - `i18n/messages.ts` *(new)*: Typed `en` and `pt-BR` catalogs for API error messages and recommendation rationales, plus locale resolution (`lang` query param → `Accept-Language` header → `'en'` fallback).
  - `app.ts` *(new)*: Express 5 application factory wiring CORS, JSON parsing, routes, and error middleware without binding a port (enabling isolated HTTP integration tests).
  - `index.ts` *(modified)*: Initializes env config and SQLite schema, starts the HTTP server, and handles idempotent `SIGTERM`/`SIGINT` graceful shutdown (closing the HTTP server and SQLite client within a 10s deadline).
- **Data Layer (`data/`)**
  - `data/database.ts` *(new)*: Async `@libsql/client` SQLite wrapper (`file:...` on disk, `:memory:` in tests), DDL bootstrap for `watchlist_items`, `watched_episodes`, and `user_preferences`, and `closeDatabase()`.
  - `data/ttlCache.ts` *(new)*: Generic bounded in-memory TTL cache (5 min for search/profiles, 30 min for TVmaze catalog discovery page).
  - `data/tvmazeClient.ts` *(new)*: HTTP adapter for `https://api.tvmaze.com` with 5s `AbortSignal.timeout`, bounded single retry on HTTP `429` (`Retry-After` / short backoff), and runtime validation of raw upstream payloads.
  - `data/watchlistRepository.ts` *(new)*: Async parameterized SQL queries for `watchlist_items` and `watched_episodes`.
  - `data/preferencesRepository.ts` *(new)*: Async parameterized SQL queries for `user_preferences`.
- **Service Layer (`services/`)**
  - `services/htmlSanitizer.ts` *(new)*: Strips HTML tags and decodes common HTML entities from TVmaze synopses into clean display text.
  - `services/akaResolver.ts` *(new)*: Selects Brazilian/Portuguese AKA titles (`country.code === 'BR'` first, then `'PT'`) when `lang === 'pt-BR'`.
  - `services/searchService.ts` *(new)*: Executes TVmaze show and/or people search based on `type` (`all | series | person`), normalizes records, and caches responses.
  - `services/seriesService.ts` *(new)*: Loads show details (`?embed[]=episodes&embed[]=cast`) plus parallel `crew` and `akas` (degrading gracefully if `crew` or `akas` fail), merges persisted watchlist status and watched episodes, and computes progress metrics and next unwatched episode.
  - `services/personService.ts` *(new)*: Loads person details plus parallel `castcredits?embed=show&embed=character` and `crewcredits?embed=show` (degrading gracefully if one credit feed fails) and maps normalized cast/crew filmography lists.
  - `services/watchlistService.ts` *(new)*: Manages adding, updating, listing, and deleting tracked series; toggles single episodes or full seasons; persists resolved `pt-BR` AKA titles and genres; synchronizes watch status transitions (`want_to_watch` → `watching` on first watched episode; `watching` → `watched` when all aired episodes are watched).
  - `services/recommendationService.ts` *(new)*: Produces ranked "Next Binge Watch" recommendations across three tiers (in-progress `watching` show with next unwatched episode → highest-rated `want_to_watch` show → genre-matched or top-rated TVmaze discovery pick) with localized rationales and `excludeIds` cycling.
  - `services/preferencesService.ts` *(new)*: Retrieves and updates persisted user language preference (`en | pt-BR`).
- **Route Layer (`routes/`)**
  - `routes/healthRoutes.ts` *(new)*: `GET /health` preserving `{ status, timestamp }` while verifying SQLite connectivity.
  - `routes/searchRoutes.ts` *(new)*: `GET /api/search`.
  - `routes/seriesRoutes.ts` *(new)*: `GET /api/series/:id`.
  - `routes/personRoutes.ts` *(new)*: `GET /api/people/:id`.
  - `routes/watchlistRoutes.ts` *(new)*: `GET /api/watchlist`, `POST /api/watchlist`, `PATCH /api/watchlist/:seriesId`, `DELETE /api/watchlist/:seriesId`, `PUT /api/watchlist/:seriesId/episodes/:episodeId`, `PUT /api/watchlist/:seriesId/seasons/:seasonNumber`.
  - `routes/recommendationRoutes.ts` *(new)*: `GET /api/recommendations/next-binge`.
  - `routes/preferencesRoutes.ts` *(new)*: `GET /api/preferences`, `PUT /api/preferences`.
  - `routes/errorMiddleware.ts` *(new)*: Maps typed `AppError` instances and unexpected errors to localized `ApiErrorResponse`.
- **Types (`types/`)**: Dedicated per-concept files (`locale.ts`, `error.ts`, `search.ts`, `series.ts`, `person.ts`, `watchlist.ts`, `recommendation.ts`, `preferences.ts`, `tvmaze.ts`).

#### Frontend (`frontend/src/`)

- **Build & Entry (`vite.config.ts`, `index.html`, `App.tsx`)**
  - `vite.config.ts` *(modified)*: Adds dev proxy for `/api` and `/health` to `http://localhost:3000` and configures Vitest (`jsdom` + 80% coverage threshold).
  - `index.html` *(modified)*: Sets application title to `NEXT BINGE WATCH`.
  - `App.tsx` *(modified)*: Configures `BrowserRouter`, `I18nProvider`, `AppLayout`, and screen routes (`/`, `/series/:id`, `/people/:id`, `/watchlist`, `*`).
- **Internationalization (`i18n/`)**
  - `i18n/detectLocale.ts` *(new)*: Resolves browser `navigator.languages` (`pt*` → `'pt-BR'`, else `'en'`).
  - `i18n/en.ts` & `i18n/ptBR.ts` *(new)*: Strongly typed, parity-checked translation dictionaries.
  - `i18n/I18nContext.tsx` *(new)*: Hydrates persisted backend language preference (falling back to browser detection when unset), updates `document.documentElement.lang`, and persists user toggles via `preferencesService`.
- **Services (`services/`)**: `apiClient.ts` (appends `lang` query param, honors `VITE_API_URL` when set, parses `ApiErrorResponse`), `healthService.ts`, `searchService.ts`, `seriesService.ts`, `personService.ts`, `watchlistService.ts`, `recommendationService.ts`, `preferencesService.ts`.
- **Hooks (`hooks/`)**: `useI18n.ts`, `useApiHealth.ts`, `useSearch.ts`, `useSeriesProfile.ts`, `usePersonProfile.ts`, `useWatchlist.ts`, `useNextBinge.ts`.
- **Views (`views/`)**: `HomeView.tsx`, `SeriesProfileView.tsx`, `PersonProfileView.tsx`, `WatchlistView.tsx`, `NotFoundView.tsx`.
- **Components (`components/`)**: Small (≤ 30 lines), single-responsibility components with explicit props and full WCAG 2.1 AA semantics grouped under `layout/` (`AppLayout`, `Header`, `LanguageSwitcher`, `ApiStatusBadge`, `FooterAttribution`), `common/` (`LoadingState`, `EmptyState`, `ErrorState`, `MediaImage`, `StatusBadge`), `search/` (`SearchForm`, `SearchScopeFilter`, `SearchResultCard`, `SearchResultList`), `recommendation/` (`NextBingeSection`, `NextBingeCard`), `series/` (`SeriesHeader`, `SeriesMetaList`, `WatchlistControls`, `CastGrid`, `CrewGrid`, `PersonCreditCard`, `SeasonEpisodeList`, `EpisodeRow`), `person/` (`PersonHeader`, `PersonBioList`, `PersonCreditsList`, `SeriesCreditCard`), and `watchlist/` (`WatchlistFilterTabs`, `WatchlistCard`, `ProgressBar`).
- **Types (`types/`)**: Dedicated per-concept files mirroring the backend contracts (`locale.ts`, `api.ts`, `search.ts`, `series.ts`, `person.ts`, `watchlist.ts`, `recommendation.ts`, `health.ts`).

#### High-level data flow

```text
Browser (React Views → Hooks → Services)
  │  HTTP + ?lang=en|pt-BR (via Vite proxy or VITE_API_URL)
  ▼
Express 5 Backend (Routes → Services)
  ├──► Data: TvmazeClient + TtlCache ──► https://api.tvmaze.com (CC BY-SA)
  └──► Data: WatchlistRepository / PreferencesRepository ──► Local SQLite (@libsql/client)
```

## Implementation design

### Primary interfaces

```ts
TvmazeClient
  searchShows(query: string) -> Promise<TvmazeShowSearchResult[]>
  searchPeople(query: string) -> Promise<TvmazePersonSearchResult[]>
  getShowWithEmbeds(id: number) -> Promise<TvmazeShowDetail | null>
  getShowCrew(id: number) -> Promise<TvmazeCrewMember[]>
  getShowAkas(id: number) -> Promise<TvmazeAka[]>
  getPerson(id: number) -> Promise<TvmazePerson | null>
  getPersonCastCredits(id: number) -> Promise<TvmazeCastCredit[]>
  getPersonCrewCredits(id: number) -> Promise<TvmazeCrewCredit[]>
  getShowsPage(page: number) -> Promise<TvmazeShow[]>
```

```ts
SearchService
  search(input: { query: string; type: SearchScope; locale: Locale }) -> Promise<SearchResponse>

SeriesService
  getSeriesProfile(input: { id: number; locale: Locale }) -> Promise<SeriesProfile>

PersonService
  getPersonProfile(input: { id: number; locale: Locale }) -> Promise<PersonProfile>
```

```ts
WatchlistService
  list(input: { status?: WatchStatus; locale: Locale }) -> Promise<WatchlistResponse>
  addSeries(input: { seriesId: number; status: WatchStatus; locale: Locale }) -> Promise<WatchlistItem>
  updateStatus(input: { seriesId: number; status: WatchStatus }) -> Promise<WatchlistItem>
  removeSeries(seriesId: number) -> Promise<void>
  toggleEpisode(input: { seriesId: number; episodeId: number; watched: boolean }) -> Promise<SeriesTrackingState>
  toggleSeason(input: { seriesId: number; seasonNumber: number; watched: boolean }) -> Promise<SeriesTrackingState>
```

```ts
RecommendationService
  getNextBinge(input: { locale: Locale; excludeIds: number[] }) -> Promise<NextBingeResponse>

PreferencesService
  getPreferences() -> Promise<UserPreferences>
  updatePreferences(input: { locale: Locale }) -> Promise<UserPreferences>
```

### Data models

All JSON contracts between the backend and frontend are display-ready. Missing or unavailable upstream fields from TVmaze are normalized to `null` (or `[]` for empty collections), and HTML summaries are stripped to plain text by the backend before serialization.

#### `SearchResultItem` - unified search card payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `number` | yes | TVmaze numeric identifier |
| `contentType` | `'series' \| 'person'` | yes | Discriminator used by UI badges and routing |
| `name` | `string` | yes | Primary show title or person name |
| `localizedName` | `string \| null` | yes | Resolved `pt-BR` AKA title when available in cache/watchlist, otherwise `null` |
| `imageUrl` | `string \| null` | yes | Medium artwork/portrait URL or `null` |
| `subtitle` | `string \| null` | yes | Concise context (e.g., show type/year or person country) |
| `status` | `string \| null` | yes | Show broadcast status (`Running`, `Ended`, etc.) or `null` for people |
| `rating` | `number \| null` | yes | Average TVmaze rating (0–10) or `null` |
| `premieredYear` | `string \| null` | yes | Four-digit premiere year for series or `null` |
| `genres` | `string[]` | yes | Series genres (empty array for people) |
| `tvmazeUrl` | `string` | yes | Canonical TVmaze URL for CC BY-SA attribution |

```text
{
  "id": 169,
  "contentType": "series",
  "name": "Breaking Bad",
  "localizedName": "Breaking Bad: A Química do Mal",
  "imageUrl": "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
  "subtitle": "Scripted · 2008",
  "status": "Ended",
  "rating": 9.2,
  "premieredYear": "2008",
  "genres": ["Drama", "Crime", "Thriller"],
  "tvmazeUrl": "https://www.tvmaze.com/shows/169/breaking-bad"
}
```

#### `SearchResponse` - unified search envelope

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `query` | `string` | yes | Trimmed search query executed |
| `type` | `'all' \| 'series' \| 'person'` | yes | Applied scope filter |
| `locale` | `'en' \| 'pt-BR'` | yes | Resolved request language |
| `total` | `number` | yes | Total number of items returned |
| `items` | `SearchResultItem[]` | yes | Ordered search results |

```text
{
  "query": "break",
  "type": "all",
  "locale": "pt-BR",
  "total": 2,
  "items": [
    {
      "id": 169,
      "contentType": "series",
      "name": "Breaking Bad",
      "localizedName": "Breaking Bad: A Química do Mal",
      "imageUrl": "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
      "subtitle": "Scripted · 2008",
      "status": "Ended",
      "rating": 9.2,
      "premieredYear": "2008",
      "genres": ["Drama", "Crime", "Thriller"],
      "tvmazeUrl": "https://www.tvmaze.com/shows/169/breaking-bad"
    }
  ]
}
```

#### `SeriesProfile` - full series profile payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `number` | yes | TVmaze show ID |
| `name` | `string` | yes | Original primary show title |
| `localizedName` | `string \| null` | yes | Brazilian/Portuguese AKA title when `locale === 'pt-BR'` and available, else `null` |
| `showType` | `string \| null` | yes | TVmaze classification (`Scripted`, `Animation`, `Documentary`, etc.) |
| `status` | `string \| null` | yes | Broadcast status (`Running`, `Ended`, `To Be Determined`, `In Development`) |
| `premiered` | `string \| null` | yes | ISO date (`YYYY-MM-DD`) or `null` |
| `ended` | `string \| null` | yes | ISO date (`YYYY-MM-DD`) or `null` |
| `genres` | `string[]` | yes | Genre labels |
| `rating` | `number \| null` | yes | Average rating (0–10) or `null` |
| `networkName` | `string \| null` | yes | Broadcast network or web channel name, or `null` |
| `imageUrl` | `string \| null` | yes | Poster image URL (prefers `original`, falls back to `medium`) or `null` |
| `summary` | `string \| null` | yes | Sanitized plain-text synopsis in TVmaze source language or `null` |
| `tvmazeUrl` | `string` | yes | Canonical TVmaze show URL |
| `cast` | `CastMember[]` | yes | Main cast list with person ID, name, imageUrl, characterName |
| `crew` | `CrewMember[] \| null` | yes | Crew list with person ID, name, imageUrl, role; `null` on partial degradation |
| `seasons` | `SeasonGroup[]` | yes | Episodes grouped by season number with watched flags |
| `tracking` | `SeriesTrackingState` | yes | Persisted watchlist status, progress counts, percentage, and next unwatched episode |
| `partialData` | `boolean` | yes | `true` if auxiliary sub-resources (`crew` or `akas`) failed gracefully |

```text
{
  "id": 169,
  "name": "Breaking Bad",
  "localizedName": "Breaking Bad: A Química do Mal",
  "showType": "Scripted",
  "status": "Ended",
  "premiered": "2008-01-20",
  "ended": "2013-09-29",
  "genres": ["Drama", "Crime", "Thriller"],
  "rating": 9.2,
  "networkName": "AMC",
  "imageUrl": "https://static.tvmaze.com/uploads/images/original_untouched/501/1253519.jpg",
  "summary": "Breaking Bad follows protagonist Walter White, a chemistry teacher who lives in New Mexico...",
  "tvmazeUrl": "https://www.tvmaze.com/shows/169/breaking-bad",
  "cast": [
    {
      "personId": 14229,
      "name": "Bryan Cranston",
      "imageUrl": "https://static.tvmaze.com/uploads/images/medium_portrait/195/488839.jpg",
      "characterName": "Walter White"
    }
  ],
  "crew": [
    {
      "personId": 31870,
      "name": "Vince Gilligan",
      "imageUrl": "https://static.tvmaze.com/uploads/images/medium_portrait/1/2868.jpg",
      "role": "Creator"
    }
  ],
  "seasons": [
    {
      "seasonNumber": 1,
      "watchedCount": 1,
      "totalCount": 7,
      "allWatched": false,
      "episodes": [
        {
          "id": 12192,
          "season": 1,
          "number": 1,
          "name": "Pilot",
          "airdate": "2008-01-20",
          "summary": "A high school chemistry teacher is diagnosed with terminal lung cancer.",
          "watched": true
        }
      ]
    }
  ],
  "tracking": {
    "inWatchlist": true,
    "status": "watching",
    "watchedEpisodes": 1,
    "totalEpisodes": 62,
    "progressPercent": 2,
    "nextEpisode": {
      "id": 12193,
      "season": 1,
      "number": 2,
      "name": "Cat's in the Bag...",
      "airdate": "2008-01-27"
    }
  },
  "partialData": false
}
```

> **Partial degradation on SeriesProfile:** When TVmaze returns the primary show payload (`?embed[]=episodes&embed[]=cast`) but the parallel `crew` or `akas` sub-request times out or returns HTTP `429`/`5xx`, the backend still responds with HTTP `200`, sets `partialData: true`, and normalizes the unavailable auxiliary field to `null` so the user can still inspect the show and track episodes.

```text
{
  "localizedName": null,
  "crew": null,
  "partialData": true
}
```

#### `PersonProfile` - full person profile payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `id` | `number` | yes | TVmaze person ID |
| `name` | `string` | yes | Person full name |
| `imageUrl` | `string \| null` | yes | Portrait URL or `null` |
| `country` | `string \| null` | yes | Country name or `null` |
| `birthday` | `string \| null` | yes | ISO date (`YYYY-MM-DD`) or `null` |
| `deathday` | `string \| null` | yes | ISO date (`YYYY-MM-DD`) or `null` |
| `gender` | `string \| null` | yes | Gender value from TVmaze or `null` |
| `tvmazeUrl` | `string` | yes | Canonical TVmaze person URL |
| `castCredits` | `PersonSeriesCredit[] \| null` | yes | Series where the person acted (`role` = character name); `null` on partial failure |
| `crewCredits` | `PersonSeriesCredit[] \| null` | yes | Series where the person worked as crew (`role` = crew type, e.g., Creator/Director/Writer); `null` on partial failure |
| `partialData` | `boolean` | yes | `true` if one of the credit sub-requests failed gracefully |

```text
{
  "id": 14229,
  "name": "Bryan Cranston",
  "imageUrl": "https://static.tvmaze.com/uploads/images/original_untouched/195/488839.jpg",
  "country": "United States",
  "birthday": "1956-03-07",
  "deathday": null,
  "gender": "Male",
  "tvmazeUrl": "https://www.tvmaze.com/people/14229/bryan-cranston",
  "castCredits": [
    {
      "seriesId": 169,
      "seriesName": "Breaking Bad",
      "imageUrl": "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
      "premieredYear": "2008",
      "role": "Walter White",
      "creditType": "cast"
    }
  ],
  "crewCredits": [
    {
      "seriesId": 169,
      "seriesName": "Breaking Bad",
      "imageUrl": "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
      "premieredYear": "2008",
      "role": "Producer",
      "creditType": "crew"
    }
  ],
  "partialData": false
}
```

#### `WatchlistItem` and `SeriesTrackingState` - persisted tracking payloads

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `seriesId` | `number` | yes | TVmaze show ID |
| `name` | `string` | yes | Original series title |
| `localizedName` | `string \| null` | yes | Brazilian/Portuguese AKA title (returned when `locale === 'pt-BR'`, else `null`) |
| `imageUrl` | `string \| null` | yes | Poster URL or `null` |
| `status` | `'want_to_watch' \| 'watching' \| 'watched'` | yes | User's watch status |
| `genres` | `string[]` | yes | Cached genre list used for recommendations |
| `rating` | `number \| null` | yes | TVmaze average rating or `null` |
| `watchedEpisodes` | `number` | yes | Count of watched episodes |
| `totalEpisodes` | `number` | yes | Total known aired/listed episodes |
| `progressPercent` | `number` | yes | Integer `0`–`100` completion percentage |
| `nextEpisode` | `EpisodePointer \| null` | yes | Next unwatched episode (`id`, `season`, `number`, `name`, `airdate`) or `null` |
| `tvmazeUrl` | `string` | yes | Canonical TVmaze show URL |
| `updatedAt` | `string` | yes | ISO-8601 timestamp of last update |

```text
{
  "seriesId": 169,
  "name": "Breaking Bad",
  "localizedName": "Breaking Bad: A Química do Mal",
  "imageUrl": "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
  "status": "watching",
  "genres": ["Drama", "Crime", "Thriller"],
  "rating": 9.2,
  "watchedEpisodes": 14,
  "totalEpisodes": 62,
  "progressPercent": 23,
  "nextEpisode": {
    "id": 12206,
    "season": 2,
    "number": 8,
    "name": "Better Call Saul",
    "airdate": "2009-04-26"
  },
  "tvmazeUrl": "https://www.tvmaze.com/shows/169/breaking-bad",
  "updatedAt": "2026-11-24T22:10:00.000Z"
}
```

#### `NextBingeResponse` - recommendation payload

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `locale` | `'en' \| 'pt-BR'` | yes | Language of the returned rationale |
| `recommendation` | `NextBingeRecommendation \| null` | yes | Highlighted pick (`seriesId`, `name`, `localizedName`, `imageUrl`, `rating`, `genres`, `summary`, `sourceTier`, `reason`, `inWatchlist`, `nextEpisode`, `tvmazeUrl`) |
| `hasMore` | `boolean` | yes | Whether another recommendation can be fetched via `excludeIds` |

```text
{
  "locale": "en",
  "recommendation": {
    "seriesId": 169,
    "name": "Breaking Bad",
    "localizedName": null,
    "imageUrl": "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
    "rating": 9.2,
    "genres": ["Drama", "Crime", "Thriller"],
    "summary": "Breaking Bad follows protagonist Walter White...",
    "sourceTier": "continue_watching",
    "reason": "Continue where you left off — S02E08 next",
    "inWatchlist": true,
    "nextEpisode": {
      "id": 12206,
      "season": 2,
      "number": 8,
      "name": "Better Call Saul",
      "airdate": "2009-04-26"
    },
    "tvmazeUrl": "https://www.tvmaze.com/shows/169/breaking-bad"
  },
  "hasMore": true
}
```

#### `UserPreferences` - persisted user settings

| Field | Type | Required | Description |
| --- | --- | --- | --- |
| `locale` | `'en' \| 'pt-BR' \| null` | yes | User-selected language (`null` until explicitly chosen, letting the frontend auto-detect from browser) |
| `updatedAt` | `string \| null` | yes | ISO-8601 timestamp or `null` |

```text
{
  "locale": "pt-BR",
  "updatedAt": "2026-11-24T22:15:00.000Z"
}
```

#### `ApiErrorResponse` - localized error envelope

| Code | HTTP | Meaning |
| --- | --- | --- |
| `VALIDATION_ERROR` | `400` | Missing or invalid query param, route ID, or request body |
| `NOT_FOUND` | `404` | Requested series, person, episode, or watchlist entry does not exist |
| `UPSTREAM_RATE_LIMITED` | `429` | TVmaze rate limit persisted after bounded retry |
| `UPSTREAM_UNAVAILABLE` | `502` | TVmaze returned an upstream 5xx or malformed payload |
| `UPSTREAM_TIMEOUT` | `504` | TVmaze request exceeded the 5-second timeout |
| `INTERNAL_ERROR` | `500` | Unexpected backend or persistence failure |

```text
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "O parâmetro de busca é obrigatório."
  }
}
```

#### TVmaze API to contract mapping

| Source (TVmaze API) | Destination (contract) |
| --- | --- |
| `show.id` / `person.id` | `id` / `seriesId` / `personId` |
| `show.name` / `person.name` | `name` |
| `akas[].name` where `country.code === 'BR'` (fallback `'PT'`) | `localizedName` (only when `locale === 'pt-BR'`) |
| `show.type` | `showType` |
| `show.status` | `status` |
| `show.premiered` / `show.ended` | `premiered` / `ended` (and 4-char `premieredYear`) |
| `show.rating.average` | `rating` |
| `show.network.name ?? show.webChannel.name` | `networkName` |
| `show.image.original ?? show.image.medium` | `imageUrl` (profiles prefer `original`; cards prefer `medium`) |
| `stripHtml(show.summary)` | `summary` |
| `show.url` / `person.url` | `tvmazeUrl` |
| `_embedded.cast[].{person, character}` | `cast[]` (`personId`, `name`, `imageUrl`, `characterName`) |
| `crew[].{type, person}` | `crew[]` (`personId`, `name`, `imageUrl`, `role`) |
| `_embedded.episodes[]` | `seasons[].episodes[]` |
| `castcredits[]._embedded.{show, character}` | `castCredits[]` |
| `crewcredits[].{type, _embedded.show}` | `crewCredits[]` |

#### Fixed parameters at the source

| API | Main parameters |
| --- | --- |
| **TVmaze Show Search** | `GET /search/shows?q={query}` |
| **TVmaze People Search** | `GET /search/people?q={query}` |
| **TVmaze Show Detail** | `GET /shows/{id}?embed[]=episodes&embed[]=cast` |
| **TVmaze Show Crew** | `GET /shows/{id}/crew` |
| **TVmaze Show AKAs** | `GET /shows/{id}/akas` |
| **TVmaze Person Detail** | `GET /people/{id}` |
| **TVmaze Person Cast Credits** | `GET /people/{id}/castcredits?embed[]=show&embed[]=character` |
| **TVmaze Person Crew Credits** | `GET /people/{id}/crewcredits?embed=show` |
| **TVmaze Discovery Catalog** | `GET /shows?page=0` |

#### Local SQLite database schema

| Table | Column | Type | Required | Description |
| --- | --- | --- | --- | --- |
| `watchlist_items` | `series_id` | `INTEGER PRIMARY KEY` | yes | TVmaze show ID |
| `watchlist_items` | `name` | `TEXT NOT NULL` | yes | Original series title |
| `watchlist_items` | `localized_name_pt_br` | `TEXT` | no | Cached Brazilian/Portuguese AKA title (`NULL` if unavailable) |
| `watchlist_items` | `image_url` | `TEXT` | no | Poster URL |
| `watchlist_items` | `status` | `TEXT NOT NULL` | yes | `'want_to_watch' \| 'watching' \| 'watched'` |
| `watchlist_items` | `genres_json` | `TEXT NOT NULL` | yes | JSON array of genre strings |
| `watchlist_items` | `rating` | `REAL` | no | Average rating |
| `watchlist_items` | `total_episodes` | `INTEGER NOT NULL` | yes | Cached total episode count |
| `watchlist_items` | `tvmaze_url` | `TEXT NOT NULL` | yes | Canonical TVmaze URL |
| `watchlist_items` | `created_at` | `TEXT NOT NULL` | yes | ISO-8601 creation timestamp |
| `watchlist_items` | `updated_at` | `TEXT NOT NULL` | yes | ISO-8601 update timestamp |
| `watched_episodes` | `series_id` | `INTEGER NOT NULL` | yes | FK referencing `watchlist_items(series_id)` with `ON DELETE CASCADE` |
| `watched_episodes` | `episode_id` | `INTEGER NOT NULL` | yes | TVmaze episode ID |
| `watched_episodes` | `season_number` | `INTEGER NOT NULL` | yes | Season number |
| `watched_episodes` | `episode_number` | `INTEGER NOT NULL` | yes | Episode number within season |
| `watched_episodes` | `watched_at` | `TEXT NOT NULL` | yes | ISO-8601 timestamp |
| `user_preferences` | `key` | `TEXT PRIMARY KEY` | yes | Preference key (e.g., `'locale'`) |
| `user_preferences` | `value` | `TEXT NOT NULL` | yes | Preference value (`'en'` or `'pt-BR'`) |
| `user_preferences` | `updated_at` | `TEXT NOT NULL` | yes | ISO-8601 timestamp |

```sql
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS watchlist_items (
  series_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  localized_name_pt_br TEXT,
  image_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('want_to_watch', 'watching', 'watched')),
  genres_json TEXT NOT NULL DEFAULT '[]',
  rating REAL,
  total_episodes INTEGER NOT NULL DEFAULT 0,
  tvmaze_url TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watched_episodes (
  series_id INTEGER NOT NULL,
  episode_id INTEGER NOT NULL,
  season_number INTEGER NOT NULL,
  episode_number INTEGER NOT NULL,
  watched_at TEXT NOT NULL,
  PRIMARY KEY (series_id, episode_id),
  FOREIGN KEY (series_id) REFERENCES watchlist_items(series_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_preferences (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
```

### API endpoints

#### Overview

| Method | Route | Description |
| --- | --- | --- |
| `GET` | `/health` | Backend and SQLite health check |
| `GET` | `/api/search` | Search TVmaze series and/or people by partial query |
| `GET` | `/api/series/:id` | Retrieve full series profile with cast, crew, episodes, AKA, and tracking state |
| `GET` | `/api/people/:id` | Retrieve full person profile with cast and crew series credits |
| `GET` | `/api/watchlist` | List persisted watchlist entries with progress and optional status filter |
| `POST` | `/api/watchlist` | Add a series to the watchlist (resolving TVmaze metadata and `pt-BR` AKA) |
| `PATCH` | `/api/watchlist/:seriesId` | Update a tracked series' watch status |
| `DELETE` | `/api/watchlist/:seriesId` | Remove a series and its watched episode history from the watchlist |
| `PUT` | `/api/watchlist/:seriesId/episodes/:episodeId` | Mark a single episode as watched or unwatched |
| `PUT` | `/api/watchlist/:seriesId/seasons/:seasonNumber` | Mark an entire season as watched or unwatched |
| `GET` | `/api/recommendations/next-binge` | Return the top "Next Binge Watch" pick with localized rationale |
| `GET` | `/api/preferences` | Retrieve persisted user preferences (language) |
| `PUT` | `/api/preferences` | Persist user language preference (`en` or `pt-BR`) |

> Every `/api/*` endpoint accepts an optional `lang` query parameter (`en` or `pt-BR`) with `Accept-Language` header fallback and `'en'` default. Invalid `lang` values fall back silently to `'en'` except on `PUT /api/preferences`, which validates explicitly.

---

#### `GET /health`

Reports backend liveness and verifies local SQLite readiness while preserving compatibility with the existing status indicator.

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `200` | `{ status, timestamp, database }` | Server and SQLite are operational |
| `503` | `{ status, timestamp, database }` | SQLite check failed |

**Example - success**

```http
GET /health
```

```text
{
  "status": "healthy",
  "timestamp": "2026-11-24T22:20:00.000Z",
  "database": "ok"
}
```

---

#### `GET /api/search`

Searches TVmaze shows and/or people by partial query string.

**Query parameters**

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `q` | `string` | - | Required, trimmed length 1–100 characters |
| `type` | `string` | `all` | Optional; must be `all`, `series`, or `person` |
| `lang` | `string` | `en` | Optional; `en` or `pt-BR` (falls back to `Accept-Language` then `en`) |

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `200` | `SearchResponse` | Search succeeded (including zero matches) |
| `400` | `ApiErrorResponse` | Empty/missing `q` or invalid `type` |
| `429` | `ApiErrorResponse` | TVmaze rate limit exceeded after retry |
| `502` / `504` | `ApiErrorResponse` | TVmaze unreachable or timed out |

**Example - success**

```http
GET /api/search?q=break&type=all&lang=en
```

See `SearchResponse` in Data models.

**Example - no matches**

```http
GET /api/search?q=zzzznonexistent12345&type=all&lang=pt-BR
```

```text
{
  "query": "zzzznonexistent12345",
  "type": "all",
  "locale": "pt-BR",
  "total": 0,
  "items": []
}
```

> To respect TVmaze's rate limit during search, `GET /api/search` does not fan out per-result `/akas` calls; instead, `localizedName` is populated from the backend's local SQLite watchlist or AKA cache if already known, and resolved on demand when opening a Series Profile or adding to the Watchlist.

**Example - validation error**

```http
GET /api/search?q=&lang=pt-BR
```

```text
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Informe um termo de busca com pelo menos 1 caractere."
  }
}
```

---

#### `GET /api/series/:id`

Returns the complete display-ready profile for a single TVmaze series, merged with persisted watchlist and episode progress.

**Query parameters**

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `id` (path) | `integer` | - | Required positive integer (`>= 1`) |
| `lang` | `string` | `en` | Optional; `en` or `pt-BR` |

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `200` | `SeriesProfile` | Show retrieved (including `partialData: true` if `crew`/`akas` degraded) |
| `400` | `ApiErrorResponse` | Non-numeric or non-positive `:id` |
| `404` | `ApiErrorResponse` | TVmaze returned `404` for show ID |
| `429` / `502` / `504` | `ApiErrorResponse` | Primary TVmaze show call failed |

**Example - success**

```http
GET /api/series/169?lang=pt-BR
```

See `SeriesProfile` in Data models.

**Example - not found**

```http
GET /api/series/999999999?lang=en
```

```text
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Series not found."
  }
}
```

---

#### `GET /api/people/:id`

Returns the display-ready profile and credited series list for a TVmaze person.

**Query parameters**

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `id` (path) | `integer` | - | Required positive integer (`>= 1`) |
| `lang` | `string` | `en` | Optional; `en` or `pt-BR` |

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `200` | `PersonProfile` | Person retrieved (with `partialData: true` if either credit endpoint failed) |
| `400` | `ApiErrorResponse` | Invalid `:id` |
| `404` | `ApiErrorResponse` | TVmaze returned `404` for person ID |
| `429` / `502` / `504` | `ApiErrorResponse` | Primary TVmaze person call failed |

**Example - success**

```http
GET /api/people/14229?lang=en
```

See `PersonProfile` in Data models.

**Example - partial degradation**

```http
GET /api/people/14229?lang=en
```

```text
{
  "id": 14229,
  "name": "Bryan Cranston",
  "imageUrl": "https://static.tvmaze.com/uploads/images/original_untouched/195/488839.jpg",
  "country": "United States",
  "birthday": "1956-03-07",
  "deathday": null,
  "gender": "Male",
  "tvmazeUrl": "https://www.tvmaze.com/people/14229/bryan-cranston",
  "castCredits": [],
  "crewCredits": null,
  "partialData": true
}
```

---

#### `GET /api/watchlist`

Lists persisted watchlist items sorted by most recently updated, with optional status filtering.

**Query parameters**

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `status` | `string` | `all` | Optional; `all`, `want_to_watch`, `watching`, or `watched` |
| `lang` | `string` | `en` | Optional; `en` or `pt-BR` |

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `200` | `{ items: WatchlistItem[], total: number }` | Watchlist retrieved |
| `400` | `ApiErrorResponse` | Invalid `status` filter |

**Example - success**

```http
GET /api/watchlist?status=watching&lang=pt-BR
```

```text
{
  "total": 1,
  "items": [
    {
      "seriesId": 169,
      "name": "Breaking Bad",
      "localizedName": "Breaking Bad: A Química do Mal",
      "imageUrl": "https://static.tvmaze.com/uploads/images/medium_portrait/501/1253519.jpg",
      "status": "watching",
      "genres": ["Drama", "Crime", "Thriller"],
      "rating": 9.2,
      "watchedEpisodes": 14,
      "totalEpisodes": 62,
      "progressPercent": 23,
      "nextEpisode": {
        "id": 12206,
        "season": 2,
        "number": 8,
        "name": "Better Call Saul",
        "airdate": "2009-04-26"
      },
      "tvmazeUrl": "https://www.tvmaze.com/shows/169/breaking-bad",
      "updatedAt": "2026-11-24T22:10:00.000Z"
    }
  ]
}
```

**Example - empty watchlist**

```http
GET /api/watchlist?lang=en
```

```text
{
  "total": 0,
  "items": []
}
```

---

#### `POST /api/watchlist`

Adds a series to the watchlist (idempotent upsert if already present) by fetching canonical show metadata, episode count, and `pt-BR` AKA from TVmaze.

**Body**

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `seriesId` | `integer` | - | Required positive integer |
| `status` | `string` | `want_to_watch` | Optional; `want_to_watch`, `watching`, or `watched` |

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `201` | `WatchlistItem` | Series persisted to watchlist |
| `400` | `ApiErrorResponse` | Invalid `seriesId` or `status` |
| `404` | `ApiErrorResponse` | Series ID does not exist in TVmaze |
| `429` / `502` / `504` | `ApiErrorResponse` | TVmaze metadata fetch failed |

**Example - success**

```http
POST /api/watchlist?lang=en
Content-Type: application/json

{ "seriesId": 169, "status": "want_to_watch" }
```

See `WatchlistItem` in Data models.

---

#### `PATCH /api/watchlist/:seriesId`

Updates the watch status of an already tracked series.

**Body**

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `status` | `string` | - | Required; `want_to_watch`, `watching`, or `watched` |

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `200` | `WatchlistItem` | Watch status updated |
| `400` | `ApiErrorResponse` | Invalid `seriesId` or `status` |
| `404` | `ApiErrorResponse` | Series is not in the watchlist |

**Example - success**

```http
PATCH /api/watchlist/169?lang=en
Content-Type: application/json

{ "status": "watching" }
```

See `WatchlistItem` in Data models.

---

#### `DELETE /api/watchlist/:seriesId`

Removes a series and cascades deletion of its watched episodes.

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `204` | *(empty)* | Series removed |
| `400` | `ApiErrorResponse` | Invalid `seriesId` |
| `404` | `ApiErrorResponse` | Series is not in the watchlist |

---

#### `PUT /api/watchlist/:seriesId/episodes/:episodeId`

Marks a single episode watched or unwatched. If the series is not yet in the watchlist and `watched: true`, the service automatically adds it with status `watching`.

**Body**

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `watched` | `boolean` | - | Required boolean |

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `200` | `SeriesTrackingState` | Episode state persisted and progress recalculated |
| `400` | `ApiErrorResponse` | Invalid IDs or non-boolean `watched` |
| `404` | `ApiErrorResponse` | Series or episode ID not found |

> **Automatic status synchronization:** Marking an episode watched transitions `want_to_watch` to `watching`; when `watchedEpisodes === totalEpisodes` (and `totalEpisodes > 0`), status transitions automatically to `watched`. Unmarking an episode on a `watched` series transitions status back to `watching`.

**Example - success**

```http
PUT /api/watchlist/169/episodes/12192?lang=en
Content-Type: application/json

{ "watched": true }
```

```text
{
  "inWatchlist": true,
  "status": "watching",
  "watchedEpisodes": 1,
  "totalEpisodes": 62,
  "progressPercent": 2,
  "nextEpisode": {
    "id": 12193,
    "season": 1,
    "number": 2,
    "name": "Cat's in the Bag...",
    "airdate": "2008-01-27"
  }
}
```

---

#### `PUT /api/watchlist/:seriesId/seasons/:seasonNumber`

Marks all episodes of a season watched or unwatched in a single atomic transaction.

**Body**

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `watched` | `boolean` | - | Required boolean |

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `200` | `SeriesTrackingState` | Season episodes updated and progress recalculated |
| `400` | `ApiErrorResponse` | Invalid `seriesId`, `seasonNumber`, or `watched` |
| `404` | `ApiErrorResponse` | Series or season not found |

**Example - success**

```http
PUT /api/watchlist/169/seasons/1?lang=en
Content-Type: application/json

{ "watched": true }
```

```text
{
  "inWatchlist": true,
  "status": "watching",
  "watchedEpisodes": 7,
  "totalEpisodes": 62,
  "progressPercent": 11,
  "nextEpisode": {
    "id": 12199,
    "season": 2,
    "number": 1,
    "name": "Seven Thirty-Seven",
    "airdate": "2009-03-08"
  }
}
```

---

#### `GET /api/recommendations/next-binge`

Computes the top "Next Binge Watch" pick using watchlist progress and TVmaze discovery data.

**Query parameters**

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `lang` | `string` | `en` | Optional; `en` or `pt-BR` |
| `excludeIds` | `string` | `""` | Optional comma-separated positive integers to cycle to the next candidate |

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `200` | `NextBingeResponse` | Recommendation generated |
| `400` | `ApiErrorResponse` | Malformed `excludeIds` |
| `429` / `502` / `504` | `ApiErrorResponse` | Discovery fallback required and TVmaze failed |

**Example - success**

```http
GET /api/recommendations/next-binge?lang=pt-BR&excludeIds=169
```

See `NextBingeResponse` in Data models.

> **Recommendation priority order:** (1) Most recently updated `watching` series with an unwatched episode; (2) highest-rated `want_to_watch` series; (3) genre-matched (or highest-rated when watchlist is empty) untracked series from the cached TVmaze catalog (`GET /shows?page=0`).

---

#### `GET /api/preferences` and `PUT /api/preferences`

Reads or persists the single-user language preference in SQLite.

**Body (`PUT`)**

| Parameter | Type | Default | Rules |
| --- | --- | --- | --- |
| `locale` | `string` | - | Required; must be `'en'` or `'pt-BR'` |

**Responses**

| Status | Body | When |
| --- | --- | --- |
| `200` | `UserPreferences` | Preferences retrieved or updated |
| `400` | `ApiErrorResponse` | Unsupported `locale` value |

**Example - update success**

```http
PUT /api/preferences?lang=pt-BR
Content-Type: application/json

{ "locale": "pt-BR" }
```

See `UserPreferences` in Data models.

---

## Integration points

- **External API:** TVmaze REST API (`https://api.tvmaze.com`), configured via `TVMAZE_BASE_URL` environment variable.
- **Authentication:** None required (free public API). All responses carry CC BY-SA licensing requiring visible attribution and clickable links back to `https://www.tvmaze.com` and canonical entity URLs.
- **Error-handling & Resilience Strategy:**
  - **Timeout:** 5,000 ms (`TVMAZE_TIMEOUT_MS`) per upstream request via `AbortSignal.timeout`.
  - **Rate Limiting (20 req / 10s per IP):** Backend in-memory TTL cache (5 min for search/profiles, 30 min for catalog page 0) drastically reduces upstream traffic. On HTTP `429`, `tvmazeClient` honors `Retry-After` (capped at 1,500 ms) or waits 1,000 ms and retries once; a second `429` maps to localized `UPSTREAM_RATE_LIMITED` (`429`).
  - **Partial Degradation:** Secondary profile calls (`crew`, `akas`, and secondary person credit endpoints) are executed with `Promise.allSettled`; failures are logged at `warn` level and normalized to `null` with `partialData: true` rather than failing the primary profile view.
  - **404 vs. 5xx:** Upstream `404` maps to `NOT_FOUND` (`404`); upstream `5xx` or malformed JSON maps to `UPSTREAM_UNAVAILABLE` (`502`); timeouts map to `UPSTREAM_TIMEOUT` (`504`).

## Testing approach

Both `frontend/` and `backend/` will enforce the project's **minimum 80% automated test coverage** (`.agents/rules/tests.md`) via Vitest (`@vitest/coverage-v8`), configured to fail test runs below 80% on lines, branches, functions, and statements. Tests follow FIRST principles and the AAA/Given-When-Then structure.

### Unit tests

| ID | Test case name | Acceptance criteria | Expected result |
| --- | --- | --- | --- |
| UT-01 | `htmlSanitizer` strips HTML tags and decodes entities safely | AC-03 | Clean plain text returned with no residual markup or scripts |
| UT-02 | `akaResolver` selects `BR` AKA first, falls back to `PT`, returns `null` for `en` or absent AKA | AC-03, AC-11 | Accurate `localizedName` selection without mutating input |
| UT-03 | `searchService` merges and normalizes show and person results for `all`, `series`, and `person` scopes | AC-01, AC-02, AC-12 | Typed `SearchResponse` items with correct `contentType` and empty-list handling |
| UT-04 | `seriesService` calculates episode progress, next unwatched episode, and handles `crew`/`akas` partial degradation | AC-03, AC-07 | Accurate `SeriesTrackingState` and `partialData: true` when auxiliary calls reject |
| UT-05 | `personService` categorizes cast and crew credits and degrades gracefully when one credit feed fails | AC-05 | Normalized `PersonProfile` with separated credits and `partialData: true` on single failure |
| UT-06 | `watchlistService` auto-transitions status on episode and full-season toggles | AC-06, AC-07 | `want_to_watch` → `watching` on first episode, `watching` → `watched` when all watched |
| UT-07 | `recommendationService` ranks `watching` > `want_to_watch` > genre discovery > empty-watchlist top picks and honors `excludeIds` | AC-08, AC-09 | Deterministic localized recommendation and `hasMore` flag across all user states |
| UT-08 | `tvmazeClient` retries once on HTTP `429`, maps `404`/`5xx`/timeout to typed errors, and caches hits within TTL | AC-13 | Single retry succeeds or surfaces `UPSTREAM_RATE_LIMITED` / `UPSTREAM_TIMEOUT` / `UPSTREAM_UNAVAILABLE` |
| UT-09 | Backend `i18n/messages` resolves `lang` param, `Accept-Language`, and defaults to `en` for unsupported locales | AC-10, AC-11 | Localized error and recommendation messages returned in `en` and `pt-BR` |
| UT-10 | Frontend `detectLocale` maps `pt-BR`/`pt` to `pt-BR` and unsupported locales (`fr-FR`) to `en` | AC-10 | Correct initial locale detected |
| UT-11 | Frontend `SearchForm`, `SearchScopeFilter`, and `EmptyState` render accessible controls and filter results | AC-01, AC-02, AC-12, AC-15 | ARIA roles/labels present, scope switching triggers filtered results, empty state announced |
| UT-12 | Frontend `SeriesProfileView` and `PersonProfileView` render metadata, cast/crew links, episode toggles, and TVmaze attribution | AC-03, AC-04, AC-05, AC-14, AC-15 | Cross-navigation links, episode controls, and CC BY-SA links render accurately |
| UT-13 | Frontend `ApiStatusBadge`, `ErrorState`, and `FooterAttribution` display connectivity states, retry actions, and CC BY-SA link | AC-13, AC-14, AC-15 | Non-color-only status label, retry callback invoked, TVmaze link points to `https://www.tvmaze.com` |

- **Main components to test:** All backend services, `tvmazeClient`, `ttlCache`, `i18n`, frontend `apiClient`, hooks, and interactive UI components.
- **Mocking boundary:** Mock only external HTTP calls (`fetch` to TVmaze on backend; `services/*` or `fetch` on frontend) and timers (`vi.useFakeTimers()` for cache TTL and retry backoff).

### Integration tests

| ID | Test case name | Acceptance criteria | Expected result |
| --- | --- | --- | --- |
| IT-01 | `GET /api/search` validates `q`/`type`, proxies mocked TVmaze, and returns localized errors in `en` and `pt-BR` | AC-01, AC-02, AC-11, AC-12 | HTTP `200` for valid/empty queries and HTTP `400` with localized `ApiErrorResponse` |
| IT-02 | `GET /api/series/:id` combines mocked TVmaze data with real in-memory SQLite watchlist/episode state | AC-03, AC-07, AC-11 | HTTP `200` with merged tracking state, `pt-BR` AKA title, and `404` on unknown ID |
| IT-03 | `GET /api/people/:id` returns cast and crew credits and handles upstream partial degradation | AC-04, AC-05 | HTTP `200` with complete or partially degraded credits |
| IT-04 | Watchlist CRUD + episode & season toggle endpoints persist across requests in SQLite | AC-06, AC-07 | `POST`/`GET`/`PATCH`/`PUT`/`DELETE` persist accurately and cascade delete watched episodes |
| IT-05 | `GET /api/recommendations/next-binge` responds appropriately for active watchers, queued lists, and empty SQLite DB | AC-08, AC-09 | HTTP `200` with expected `sourceTier`, localized rationale, and `excludeIds` cycling |
| IT-06 | `GET/PUT /api/preferences` persists and retrieves language preference and rejects invalid locales | AC-10, AC-11 | HTTP `200` persistence and HTTP `400` localized validation error |
| IT-07 | Upstream HTTP `429`/timeout/`500` scenarios map cleanly through `errorMiddleware` and `/health` reports DB status | AC-13 | Proper `429`/`504`/`502` localized error envelopes and `200` on `/health` |

- **Components tested together:** Express `app.ts` routes + validation + services + repositories + real `@libsql/client` SQLite (`:memory:`), with Supertest driving HTTP calls and TVmaze HTTP mocked at the network boundary.

### E2E tests

| ID | Test case name | Acceptance criteria | Expected result |
| --- | --- | --- | --- |
| E2E-01 | Search partial title, filter scope, open Series Profile, navigate to Cast/Crew Person Profile, and return to credited Series Profile | AC-01, AC-02, AC-03, AC-04, AC-05, AC-14 | Full show ↔ person navigation works with visible TVmaze attribution links |
| E2E-02 | Add series to Watchlist, toggle individual episode and full season, reload page, and verify persistence & status filters | AC-06, AC-07 | Status, progress count/percentage, and next episode persist across page reload |
| E2E-03 | Verify "Next Binge Watch" recommendation on empty watchlist and after starting a series, plus cycling suggestions | AC-08, AC-09 | Actionable recommendation updates from discovery pick to in-progress next episode |
| E2E-04 | Auto-detect `pt-BR` browser locale, verify fallback `en`, switch language manually, reload, and verify localized UI, AKA title, and error messages | AC-10, AC-11 | All UI text and backend errors switch cleanly and persist across reload |
| E2E-05 | Verify empty search state, upstream/backend error recovery with retry, and responsive keyboard accessibility at 375px and 1280px | AC-12, AC-13, AC-15 | Accessible empty/error states, zero horizontal overflow, keyboard focus traversal passes |

- **Execution environment:** Playwright specs in `e2e/*.spec.ts` (outside `frontend/` and `backend/`), running against the live frontend Vite server and backend Express server with an isolated test SQLite file (and deterministic TVmaze route fixtures for failure/offline cases).

## Development sequencing

### Build order

1. **Test & Config Foundation (Backend & Frontend):** Install Vitest + coverage tooling (`@vitest/coverage-v8`), Supertest (backend), Testing Library + jsdom (frontend), `@libsql/client` (backend), `react-router-dom` (frontend), and Playwright (`e2e/`). Configure `vite.config.ts` proxy, `backend/src/config/env.ts`, `backend/src/config/logger.ts`, and `backend/.env.example`.
2. **Backend Data & Localization Layer:** Implement `data/database.ts`, `data/ttlCache.ts`, `data/tvmazeClient.ts`, `data/watchlistRepository.ts`, `data/preferencesRepository.ts`, `i18n/messages.ts`, and `types/*.ts` with unit tests.
3. **Backend Services & HTTP API:** Implement `htmlSanitizer`, `akaResolver`, `searchService`, `seriesService`, `personService`, `watchlistService`, `recommendationService`, `preferencesService`, all route modules, `errorMiddleware`, `app.ts`, and graceful shutdown in `index.ts`; verify with unit and Supertest integration tests (≥ 80% coverage).
4. **Frontend Core (i18n, Services, Hooks, Layout):** Implement `types/`, `i18n/` (`en`, `pt-BR`, detection, provider), `services/` (`apiClient` + resource clients), `hooks/`, and shared `components/layout/` and `components/common/` (including localized API status badge and TVmaze CC BY-SA footer).
5. **Frontend Feature Views & Components:** Implement `HomeView` (search + Next Binge Watch), `SeriesProfileView` (metadata, cast/crew, watchlist controls, season/episode tracker), `PersonProfileView` (bio + cast/crew credits), `WatchlistView`, and `App.tsx` routing; add Vitest + Testing Library unit/component tests (≥ 80% coverage).
6. **End-to-End Validation:** Add Playwright specs in `e2e/`, verify accessibility, responsiveness (375px and 1280px+), `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` in both apps.

### Technical dependencies

- **External Services:** Reachability of `https://api.tvmaze.com` (public, keyless) during live usage and E2E happy-path runs.
- **Local Infrastructure:** Write permissions for the local SQLite database file path (`DATABASE_URL=file:./data/next-binge-watch.db`, git-ignored).
- **New Packages (via `npm` per app):**
  - `backend/`: `@libsql/client` (runtime); `vitest`, `@vitest/coverage-v8`, `supertest`, `@types/supertest` (dev).
  - `frontend/`: `react-router-dom` (runtime); `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event` (dev).
  - `e2e/`: `@playwright/test`.

## Monitoring and observability

- **Health Check:** Enhance existing `GET /health` to execute a lightweight `SELECT 1` probe against SQLite and return `{ status: 'healthy' | 'unhealthy', timestamp, database: 'ok' | 'error' }` (`200` / `503`), keeping frontend `ApiStatusBadge` polling every 5 seconds fully compatible.
- **Structured Logging (`config/logger.ts`):** Emit JSON logs with `timestamp`, `level`, `message`, `route`, `statusCode`, `durationMs`, and sanitized metadata (never logging secrets or raw stack traces in HTTP responses):
  - `info`: Server startup, SQLite schema ready, graceful shutdown lifecycle, completed API requests with duration.
  - `warn`: TVmaze HTTP `429` retry triggered, partial degradation fallback (`crew`/`akas`/credits unavailable), client `4xx` validation failures.
  - `error`: Exhausted TVmaze retries, upstream `5xx`/timeouts, SQLite query/connection failures, unhandled Express errors.

## Technical considerations

### Key decisions

- **Embedded SQLite via `@libsql/client` (`file:...`):** Chosen per user preference for durable, transactional local persistence across restarts. `@libsql/client` provides a native `async/await` API (preventing event-loop blocking unlike synchronous drivers), prebuilt binaries without `node-gyp` friction, foreign-key cascade support, and `:memory:` execution for fast tests. *Rejected alternatives:* `better-sqlite3` and `node:sqlite` (synchronous I/O conflicts with `.agents/rules/node.md`), raw JSON file storage (weaker relational integrity for episode/season transactions).
- **Backend-for-Frontend (BFF) with In-Memory TTL Cache:** Centralizes TVmaze integration, rate-limit protection, HTML sanitization, AKA resolution, and localized errors in one place while ensuring zero browser-to-TVmaze calls. *Rejected alternatives:* Uncached proxy (risks hitting TVmaze's 20 req/10s cap during rapid browsing) or persistent disk cache (unnecessary staleness and storage complexity for v1).
- **Deferred AKA Resolution (Series Profile & Watchlist, not Search Fan-Out):** Resolves `pt-BR` AKAs on Series Profile visits and Watchlist saves (reusing cached/persisted AKAs in search results) rather than issuing 10 extra `/akas` requests per search query, keeping search latency well below 1.5s and avoiding `429` throttling.
- **`react-router-dom` + Typed Dictionary i18n:** Provides bookmarkable `/series/:id` and `/people/:id` URLs with browser back/forward history during cross-navigation, while a lightweight TypeScript dictionary pair (`en.ts` / `ptBR.ts`) guarantees compile-time key parity across locales with zero extra runtime bundle bloat. *Rejected alternatives:* `i18next` (overkill for two static locales) and state-only routing (breaks deep-linking and back-button navigation).

### Known risks

- **TVmaze Rate Limit Spikes (`429`):** Opening several uncached profiles rapidly consumes ~3 calls per profile (`show+embeds`, `crew`, `akas`). *Mitigation:* 5-minute TTL caching, parallel request deduplication (in-flight coalescing per cache key), single bounded retry on `429`, and graceful partial degradation for `crew`/`akas`.
- **Missing or Inconsistent TVmaze Metadata:** Some shows lack posters, synopses, crew entries, or Brazilian AKA titles. *Mitigation:* Normalize every missing field to `null`, render accessible fallback artwork/placeholders, and fall back seamlessly to the original title when no `BR`/`PT` AKA exists.
- **SQLite File Directory Creation & Git Hygiene:** Starting the backend before the parent directory of `DATABASE_URL` exists could fail. *Mitigation:* Ensure parent directory creation (`fs.mkdir(..., { recursive: true })`) before opening `@libsql/client` and add `backend/data/*.db*` to `.gitignore`.
- **Strict File/Function Size Limits:** Enforcing ≤ 100 lines per `.ts` file and ≤ 30 lines per function/component across a rich feature requires disciplined decomposition. *Mitigation:* Design granular modules from the start (separate mappers, validators, repositories, and sub-components).

### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule file under `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and incorporated:

- **`AGENTS.md`:** Preserves independent `frontend/` and `backend/` apps with separate `package.json` and `package-lock.json`, maintains Vite proxy + `VITE_API_URL` support, preserves `/health`, and requires `npm test`, `npm run lint`, `npm run typecheck`, and `npm run build` validations. *Authorized deviation:* `AGENTS.md` baseline states English-only UI/API messages; per the user prompt and PRD, this feature introduces `en` (default fallback) and `pt-BR` i18n while keeping English as the default language.
- **`code-standards.md`:** All `.ts` files/classes capped at 100 lines, all functions/methods capped at 30 lines, max 3 parameters (using named input objects), guard clauses (max 3 nesting levels), no blank lines inside functions, extracted constants, no unnecessary comments, and no secrets in source code.
- **`javascript-typescript.md`:** `const` by default, strict `===`/`!==`, zero `any` (using `unknown` + type guards for external JSON), explicit return types and `Promise<T>`, simple non-nested ternaries, immutable collection transformations, and ESLint validation.
- **`node.md`:** Pure `async/await` I/O (via `@libsql/client` and `fetch`), zero synchronous filesystem/DB calls in request handlers, `dotenv` startup validation with `.env.example`, idempotent `SIGTERM`/`SIGINT` graceful shutdown closing HTTP server and SQLite, centralized logger adapter, `npm`-only lockfile hygiene, and acyclic module graph (`config → routes → services → data → types`).
- **`tests.md`:** Vitest configured with mandatory ≥ 80% coverage threshold in both `frontend/` and `backend/`, FIRST-compliant unit and integration tests colocated under `src/**/*.test.ts(x)`, and Playwright E2E specs under root `e2e/`.
- **`folder-structure.md`:** Follows `backend/src/{routes,services,data,types}` (adding cohesive `config/` and `i18n/` folders for recurring concerns) and `frontend/src/{components,views,services,hooks,assets,types}` (adding cohesive `i18n/` folder), with one type concept per file under `types/` and no business logic in `routes`, `views`, or `components`.

### Skill compliance

- **`.agents/skills/react/SKILL.md` (applicable):** Every React component is capped at 30 lines with a single responsibility, explicit props (no `{...props}` spreading), `useEffect` restricted to external synchronization (fetching, health polling, `<html lang>` sync), `useMemo` reserved strictly for heavy computations, backend calls isolated in `services/` and consumed through custom `use*` hooks, Tailwind CSS utility styling, and semantic HTML with full `aria-*` attributes. *Recorded alignment:* The `react` skill illustrates backend access under `src/lib/api/`, whereas `.agents/rules/folder-structure.md` mandates `frontend/src/services/`; this specification follows `folder-structure.md` (`frontend/src/services/`) while preserving the exact separation-of-concerns rule.

### Relevant and dependent files

- **Requirements & Rules**
  - [prd.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/tasks/prd-next-binge-watch/prd.md)
  - [AGENTS.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/AGENTS.md)
  - [code-standards.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/.agents/rules/code-standards.md)
  - [javascript-typescript.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/.agents/rules/javascript-typescript.md)
  - [node.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/.agents/rules/node.md)
  - [tests.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/.agents/rules/tests.md)
  - [folder-structure.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/.agents/rules/folder-structure.md)
  - [SKILL.md](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/.agents/skills/react/SKILL.md)
- **Existing Modified Files**
  - [backend/package.json](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/backend/package.json)
  - [backend/src/index.ts](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/backend/src/index.ts)
  - [frontend/package.json](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/frontend/package.json)
  - [frontend/vite.config.ts](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/frontend/vite.config.ts)
  - [frontend/index.html](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/frontend/index.html)
  - [frontend/src/App.tsx](file:///Users/lucasmartini/repos/next-binge-watch%C2%A0/frontend/src/App.tsx)
- **New Directories & Entry Points**
  - `backend/.env.example`, `backend/vitest.config.ts`, `backend/src/app.ts`, `backend/src/config/`, `backend/src/i18n/`, `backend/src/types/`, `backend/src/data/`, `backend/src/services/`, `backend/src/routes/`
  - `frontend/src/i18n/`, `frontend/src/types/`, `frontend/src/services/`, `frontend/src/hooks/`, `frontend/src/components/`, `frontend/src/views/`
  - `e2e/` (Playwright configuration and `*.spec.ts` suites)
