# Product Requirements Document (PRD)

## Overview

**NEXT BINGE WATCH** is a bilingual watch and tracking application for TV series, miniseries, and web series that solves two common viewer frustrations: losing track of watching progress across shows and spending too much time deciding what to watch next. By combining partial-query search across series and people (actors, creators, directors, and writers) with seamless cross-navigation between show profiles and person filmographies, viewers can naturally explore connections from a favorite show to its cast and crew and discover new titles along the way.

Built on top of the existing frontend and backend applications and powered exclusively by the TVmaze catalog through the backend, NEXT BINGE WATCH is designed for everyday TV viewers and binge watchers—starting with English (`en`) and Brazilian Portuguese (`pt-BR`) speakers. Users can organize their personal watchlist, track season and episode completion without needing an account, and receive an actionable **"Next Binge Watch"** recommendation tailored to their in-progress shows, saved list, and viewing tastes.

## Objectives

### Business and Product Goals
- Enable viewers to search TV series and people, navigate between show and person profiles, manage a persistent watchlist with episode tracking, and receive a "Next Binge Watch" recommendation within a single cohesive web application.
- Deliver a first-class bilingual experience in English (`en`) and Brazilian Portuguese (`pt-BR`) that automatically adapts to the user's browser language while allowing manual switching at any time.
- Ensure full legal and licensing compliance with TVmaze's CC BY-SA terms through visible source attribution and direct links back to TVmaze.

### Success Criteria and Key Metrics
- **Search-to-Profile Discovery:** 100% of valid partial queries for indexed TVmaze shows or people return structured results distinguishable by type, and selecting any result loads its corresponding profile by ID.
- **Cross-Navigation Continuity:** 100% of cast/crew members on a series profile and credited shows on a person profile can be opened directly in their respective profile views without losing navigation history.
- **Watchlist & Progress Reliability:** 100% of watchlist additions, status updates, and season/episode progress changes persist across browser refreshes and backend restarts for the single-user workspace.
- **Recommendation Availability:** The "Next Binge Watch" feature produces at least one actionable recommendation with a clear localized rationale in 100% of states (active watchers, queued watchlists, and brand-new empty watchlists).
- **Localization Coverage:** 100% of UI copy, labels, navigation controls, empty/error states, and backend error messages are translated in both `en` and `pt-BR`, with fallback to `en` for unsupported browser locales.
- **Performance & Responsiveness:** Under normal upstream availability, 95% of search and profile requests complete within 1.5 seconds, and 95% of watchlist updates complete within 300 milliseconds.
- **Accessibility Compliance:** 0 critical or serious WCAG 2.1 Level AA violations across search, profile views, watchlist tracking, and language switching on both desktop and mobile viewports.

## User stories

- **US1 (Title & People Search):** As a TV viewer, I want to enter part of a series title or a person's name and see matching results grouped or labeled by content type so that I can quickly find what or whom I am looking for.
- **US2 (Series Profile Inspection):** As a TV viewer, I want to open a series profile by its ID to see its metadata, synopsis, episodes, and cast and crew list (artists, directors, writers/creators) so that I can evaluate whether I want to watch it.
- **US3 (Person Profile & Cross-Navigation):** As a curious fan, I want to select an actor, director, or writer from a series profile to open their person profile and browse all their credited shows—and select any show to open its profile—so that I can discover related series through talent I enjoy.
- **US4 (Watchlist Management):** As a binge watcher, I want to add series to my watchlist and categorize them as *Want to Watch*, *Watching*, or *Watched* so that all my shows stay organized in one place without creating an account.
- **US5 (Season & Episode Tracking):** As an active viewer, I want to mark individual episodes or entire seasons as watched and see my completion progress and next unwatched episode so that I never lose my place in a series.
- **US6 (Next Binge Watch Recommendation):** As an undecided viewer, I want the app to recommend my "Next Binge Watch" based on what I am currently watching, what is on my watchlist, or genres I enjoy so that I can start watching immediately without endless scrolling.
- **US7 (Bilingual Experience):** As a Brazilian Portuguese speaker, I want the application to detect my browser language automatically, display all interface text and backend error messages in `pt-BR`, show localized Brazilian/Portuguese AKA titles when available, and let me switch between `en` and `pt-BR` manually so that I can use the app comfortably in my preferred language.
- **US8 (Resilient Feedback & Connectivity):** As any user, I want to see clear loading indicators, helpful empty states, backend API connectivity status, and understandable localized error messages when searches return nothing or when the catalog service is temporarily rate-limited or unreachable so that I always know what happened and how to retry.
- **US9 (Source Attribution):** As a user or content contributor, I want to see clear TVmaze attribution and links to the original TVmaze pages so that data provenance is transparent and CC BY-SA licensing is respected.

## Core features

### 1. Unified Search for Series and People
Helps users locate TV series, miniseries, web series, and entertainment professionals using partial text input without needing exact titles or full names.

At a high level, the user types a partial query into a prominent search bar and optionally filters by content type (*All*, *Series*, *People*). The frontend sends the query and active language parameter to the backend, which queries TVmaze and returns normalized results with thumbnails, primary names, content types, and contextual metadata.

- **FR1:** Users must be able to search using a partial series title or partial person name and receive one or more matching items when matches exist.
- **FR2:** Search results must clearly identify each item's content type (*Series* or *Person*) and display key preview details (image or fallback placeholder, title/name, localized AKA title when applicable, and summary metadata such as status/premiere year for series or country for people).
- **FR3:** Users must be able to filter search results by scope (*All*, *Series*, *People*) and clear or refine their query without a full page reload.
- **FR4:** Selecting any search result must navigate to that item's dedicated profile view fetched by its unique ID through the backend.

### 2. Content-Specific Profile Views and Cross-Navigation
Provides tailored layouts for series and people so users can inspect rich metadata and move effortlessly between shows and the talent behind them.

At a high level, opening a series ID renders the Series Profile view with show details, watchlist/episode controls, and cast & crew listings. Opening a person ID renders the Person Profile view with biographical details and credited shows. Both views cross-link directly to one another.

- **FR5:** The **Series Profile** view must retrieve show details by ID from the backend and display poster artwork, primary title, localized AKA title (when available for the active language), show type/classification (e.g., Scripted, Miniseries, Animation, Documentary), status, premiere/end dates, genres, average rating, network or web channel, cleanly formatted synopsis text, and a direct external link to the show on TVmaze.
- **FR6:** The **Series Profile** view must display the **Cast** (performer name, photo/placeholder, and character name) and **Crew** (person name, photo/placeholder, and role such as Creator, Director, Writer, Executive Producer).
- **FR7:** Selecting any cast or crew member on a Series Profile must open that person's **Person Profile** view by their ID.
- **FR8:** The **Person Profile** view must retrieve person details by ID from the backend and display portrait/placeholder, name, available biographical metadata (country, birthday, deathday, gender), and a direct external link to the person on TVmaze.
- **FR9:** The **Person Profile** view must display the person's credited titles list (both cast appearances with character/role context and crew credits such as director, creator, or writer), grouped or clearly labeled by contribution type.
- **FR10:** Selecting any credited series on a Person Profile must open that title's **Series Profile** view by its ID.

### 3. Watchlist Management and Season/Episode Progress Tracking
Turns discovery into an actionable personal tracker so viewers know what they plan to watch, what they are currently watching, and exactly which episode comes next.

At a high level, users can add any series to their watchlist from search results or a Series Profile, assign a watch status, and toggle episode or season completion inside the Series Profile or Watchlist view. All watchlist items and progress states are persisted on the backend for the single-user workspace with no login required.

- **FR11:** Users must be able to add a series to their watchlist, remove it from their watchlist, and set or change its status among three states: **Want to Watch**, **Watching**, and **Watched**.
- **FR12:** The **Watchlist** view must display all tracked series with their status, poster, title (with localized AKA if applicable), episode progress summary (watched episodes out of total episodes), and filtering by status (*All*, *Want to Watch*, *Watching*, *Watched*).
- **FR13:** Within a Series Profile (and accessible from tracked items), users must be able to view episodes organized by season (season number, episode number, episode title, airdate, and synopsis when available) and mark individual episodes as watched or unwatched.
- **FR14:** Users must be able to mark an entire season as watched or unwatched in a single action.
- **FR15:** Updating episode progress must automatically calculate completion metrics (watched count, total count, percentage, and next unwatched episode) and synchronize watch status sensibly (e.g., marking the first episode watched transitions a *Want to Watch* title to *Watching*; marking all aired episodes watched offers or transitions the status to *Watched*).

### 4. "Next Binge Watch" Recommendation
Delivers on the application's core promise by giving the user a clear, justified pick for what to watch next instead of leaving them with an unsorted list.

At a high level, a dedicated "Next Binge Watch" section evaluates the user's backend-persisted watchlist and episode progress to recommend the best immediate next watch, and also supports discovering fresh titles aligned with the user's preferred genres (or top-rated shows when the watchlist is empty).

- **FR16:** The application must present a prominent **"Next Binge Watch"** recommendation highlight that suggests the top series (and next unwatched episode, if applicable) to watch right now.
- **FR17:** Recommendation logic must handle all user states gracefully:
  - For users with **Watching** shows, prioritize continuing an in-progress series with an unwatched episode, while also surfacing a *Want to Watch* or discovery pick.
  - For users with only **Want to Watch** items, recommend the highest-priority or highest-rated queued series.
  - For users seeking new discoveries or with an empty watchlist, recommend a relevant series based on genres from their tracked/watched titles—or well-rated shows from the TVmaze catalog when no history exists.
- **FR18:** Each recommendation must include a concise localized explanation of why it was chosen (e.g., *"Continue where you left off — S02E04 next"*, *"Top-rated pick from your Want to Watch list"*, or *"Matches your interest in Sci-Fi"*) along with direct actions to open the profile, add to watchlist, or cycle to another suggestion.

### 5. Internationalization (`en` and `pt-BR`) and Language Preference
Makes NEXT BINGE WATCH welcoming and accurate for both English and Brazilian Portuguese users across every screen and API interaction.

At a high level, the frontend detects the browser language on initial load (`pt-BR` for Portuguese locales, `en` fallback otherwise), persists manual language overrides on the backend, and passes the active language parameter on every backend request.

- **FR19:** The application must support **English (`en`)** and **Brazilian Portuguese (`pt-BR`)**, auto-detecting the user's browser language on first visit and falling back to `en` for any unsupported locale.
- **FR20:** Users must be able to switch languages manually between `en` and `pt-BR` via an always-accessible control; the chosen preference must persist across sessions.
- **FR21:** The frontend must automatically include the active language parameter in all requests to the backend, and all backend-generated validation, status, and error messages must be returned localized in the requested language (`en` or `pt-BR`, defaulting to `en`).
- **FR22:** All user-facing interface copy (navigation, headings, buttons, watch statuses, empty states, recommendation reasons, accessibility labels, and error alerts) must be fully localized in `en` and `pt-BR`. When `pt-BR` is selected and TVmaze provides a Portuguese/Brazilian AKA title for a series, the UI must display that localized title alongside clear reference to the original title, while keeping TVmaze synopses in their original source language.

### 6. Backend Connectivity Status and TVmaze Attribution
Preserves operational transparency from the existing application and guarantees compliance with TVmaze's CC BY-SA license.

- **FR23:** The application must retain a visible, localized backend API connectivity status indicator (checking backend availability via the existing health endpoint) so users can see whether the backend is online, checking, or offline.
- **FR24:** The application must display a persistent TVmaze CC BY-SA attribution notice with a clickable link to TVmaze (`https://www.tvmaze.com`), plus direct TVmaze source links on every Series Profile and Person Profile.

## Acceptance criteria

- **AC-01 (US1, FR1, FR2):** Given a user enters a partial query such as `"break"` in the search bar, when the search completes, then matching series and/or people from TVmaze are displayed via the backend with each result clearly labeled as *Series* or *Person* along with its preview metadata.
- **AC-02 (US1, FR3):** Given search results are displayed, when the user filters by *Series* or *People*, then only results matching the selected content type are shown without requiring a page reload.
- **AC-03 (US1, US2, FR4, FR5):** Given a user sees a series in search results, when the user selects it, then the Series Profile view opens for that show ID displaying artwork, title (plus localized AKA title if applicable in `pt-BR`), show type, status, genres, rating, sanitized synopsis, seasons/episodes, and a clickable TVmaze link.
- **AC-04 (US2, US3, FR6, FR7):** Given a user is viewing a Series Profile with cast and crew data, when the user selects any actor, director, creator, or writer from the cast/crew list, then the Person Profile view opens for that person's ID.
- **AC-05 (US3, FR8, FR9, FR10):** Given a user is viewing a Person Profile, when the profile loads, then the person's biographical details, TVmaze source link, and credited series list (cast and crew roles) are displayed, and selecting any credited series opens that series' profile by ID.
- **AC-06 (US4, FR11, FR12):** Given a user is viewing a Series Profile, when the user adds the series to their watchlist with status *Want to Watch* and reloads the browser, then the series remains persisted in the backend-backed watchlist under *Want to Watch* and can be filtered, updated to *Watching* or *Watched*, or removed.
- **AC-07 (US5, FR13, FR14, FR15):** Given a user opens a tracked series with multiple seasons and episodes, when the user marks an individual episode or an entire season as watched and reloads the page, then the watched state, completion progress count/percentage, and next unwatched episode remain accurately updated and persisted.
- **AC-08 (US6, FR16, FR17, FR18):** Given a user has at least one in-progress *Watching* series with remaining unwatched episodes, when the user views the "Next Binge Watch" section, then the app highlights an in-progress series with its next unwatched episode and a localized reason, plus an option to view another recommendation.
- **AC-09 (US6, FR16, FR17, FR18):** Given a user has an empty watchlist, when the user views the "Next Binge Watch" section, then the app still displays a discoverable TVmaze series recommendation with a localized explanation and a quick action to open its profile or add it to the watchlist.
- **AC-10 (US7, FR19, FR20):** Given a first-time visitor has browser language set to `pt-BR` (or `pt`), when the application loads, then all UI copy renders in Brazilian Portuguese; when the visitor has an unsupported locale (e.g., `fr-FR`), then the application falls back to English (`en`).
- **AC-11 (US7, FR20, FR21, FR22):** Given a user manually switches the language from `en` to `pt-BR`, when the user triggers a backend request (including a validation or not-found error), then all UI labels and backend error messages appear in `pt-BR`, any available Brazilian/Portuguese AKA title is surfaced for series, and the `pt-BR` preference persists across reloads.
- **AC-12 (US8, FR1, FR21):** Given a user searches for a non-existent title or person (e.g., `"zzzznonexistent12345"`), when the request finishes, then an accessible localized empty state is shown with a suggestion to adjust the search query.
- **AC-13 (US8, FR21, FR23):** Given the backend is offline or TVmaze returns a rate-limit/upstream error, when the user attempts a search or profile lookup, then the API status indicator reflects connectivity appropriately and the user sees a localized, non-technical error state with a retry action rather than an unhandled crash.
- **AC-14 (US9, FR24):** Given a user visits the home view, a Series Profile, or a Person Profile, then a visible TVmaze CC BY-SA attribution credit with a working link to TVmaze is displayed.
- **AC-15 (Accessibility & Responsiveness):** Given a user accesses the application on a mobile viewport (375px wide) or desktop viewport (1280px+ wide) using only a keyboard or assistive technology, when navigating search, profiles, watchlist filters, episode toggles, and language switcher, then all interactive elements are keyboard-focusable with visible focus indicators, proper ARIA labels, and WCAG 2.1 AA color contrast.
- **AC-16 (Exclusive Backend Mediation — FR4, FR21, FR23):** Given a user performs searches, opens series or person profiles, updates watchlist/episode progress, or views recommendations, when browser network activity is inspected, then 100% of data requests target the application backend with zero direct browser requests to TVmaze.

## User experience

### User Profiles and Needs
- **Casual Explorer:** Wants fast partial-name search, rich show/person profiles, and effortless hopping from an actor or creator to their other shows.
- **Dedicated Binge Watcher:** Wants a clutter-free watchlist, rapid season/episode checkoffs, clear progress bars, and an immediate answer to *"What episode or show should I watch next?"*
- **Bilingual / Brazilian Viewer:** Wants native-feeling Portuguese (`pt-BR`) labels, statuses, and error feedback alongside recognizable local AKA titles when available, with effortless toggling back to English (`en`).

### Main Flows and Interactions
1. **Search & Cross-Navigation Flow:**
   - User lands on the NEXT BINGE WATCH home screen featuring the search bar, "Next Binge Watch" spotlight, and quick access to the Watchlist.
   - User enters a partial series name or person name → views typed result cards (*Series* / *Person*) → clicks a series → explores Series Profile (metadata, synopsis, episodes, cast & crew) → clicks a cast/crew member → explores Person Profile (bio + credited titles) → clicks another credited series → loops seamlessly with clear back/breadcrumb navigation.
2. **Watchlist & Episode Tracking Flow:**
   - From a Series Profile (or search result card), user adds the series to their watchlist and chooses a status (*Want to Watch*, *Watching*, *Watched*).
   - Inside the Series Profile's episode tracker, user expands a season and marks individual episodes or the whole season as watched; progress updates immediately and persists via the backend.
   - In the Watchlist view, user filters by status, views progress indicators at a glance, and jumps straight to the next unwatched episode or profile.
3. **Next Binge Watch Flow:**
   - On the home screen or Watchlist view, user reviews the highlighted "Next Binge Watch" card showing why it was picked and clicks through to open the show profile, mark progress, add it to the watchlist, or request the next suggestion.
4. **Language Switching Flow:**
   - Language initializes automatically from browser settings (`pt-BR` or `en` default).
   - User toggles `EN` / `PT-BR` from the persistent header control; UI labels, watch statuses, recommendation copy, and subsequent backend responses update immediately without losing the current route.

### UI/UX and Accessibility Requirements
- **Responsive Design:** Mobile-first responsive layouts that adapt cleanly across mobile (`≥320px`), tablet, and desktop viewports with zero horizontal overflow and touch-friendly tap targets (`≥44×44px`).
- **Accessibility (WCAG 2.1 Level AA):**
  - Semantic page landmarks (`header`, `nav`, `main`, `footer`), proper heading hierarchy, and descriptive `alt` text for posters and portraits.
  - Full keyboard operability (`Tab`, `Shift+Tab`, `Enter`, `Space`, `Escape`) with visible focus rings across search controls, filters, profile cards, episode checkboxes, and language toggles.
  - Screen-reader announcements (`aria-live` regions) for search results count, loading states, watchlist updates, and error notifications.
  - Minimum 4.5:1 color contrast for normal text and 3:1 for large text and UI controls; status indicators must not rely on color alone (always paired with text/icon labels).
- **Clear Asynchronous States:** Distinct, polished states for initial/empty views, skeleton or spinner loading indicators, no-results feedback, and actionable error messages with retry controls.
- **Persistent Trust Elements:** Localized backend API connectivity badge and TVmaze CC BY-SA attribution footer remain accessible throughout the experience.

## High-level technical constraints

- **Exclusive Backend Data Boundary:** The frontend must fetch all catalog, search, profile, recommendation, and watchlist data exclusively from the application's backend. The browser must never call the TVmaze API directly.
- **External Data Source (TVmaze API):**
  - All series, episode, cast, crew, AKA title, person, and credit data must originate from the free, keyless TVmaze API (`https://api.tvmaze.com`), including its show search, people search, show details/cast/crew/episodes/AKAs, and person details/credits capabilities.
  - TVmaze exclusively covers TV shows, web series, and miniseries (no standalone theatrical movies).
  - The backend must respect TVmaze's rate limit (at least 20 calls per 10 seconds per IP) and handle `429 Too Many Requests` or transient upstream errors gracefully without crashing or exposing raw upstream failures to end users.
- **Licensing & Compliance (CC BY-SA):**
  - TVmaze data is licensed under Creative Commons Attribution-ShareAlike (CC BY-SA). The application must prominently credit TVmaze as the data source and include clickable links back to TVmaze (including canonical show/person URLs returned by the API).
- **Security & Content Safety:**
  - External metadata returned by TVmaze (such as show and episode synopses that may contain HTML markup) must be sanitized or rendered safely as plain/clean text to prevent XSS or broken layouts.
  - Input parameters (search queries, IDs, language codes, watchlist payloads) must be validated by the backend before processing.
- **Internationalization Contract:**
  - The frontend must detect the browser language and transmit the active language preference (`en` or `pt-BR`) to the backend on requests.
  - The backend must support localized user-facing error/status messages for `en` and `pt-BR` (defaulting to `en` if omitted or unsupported) and resolve Brazilian/Portuguese AKA titles when available for `pt-BR`.
- **Persistence & Privacy:**
  - Watchlist entries, watch statuses, season/episode progress, and user language preference must be persisted on the backend for a single-user experience without requiring user accounts, login, or collection of personally identifiable information (PII).
- **Existing Repository Constraints:**
  - Preserve the existing separation between the `frontend/` and `backend/` applications and maintain compatibility with the existing backend health check (`/health`) and frontend status check.
- **Performance Targets:**
  - Target p95 response time of ≤1.5s for search and profile retrieval (under normal TVmaze latency) and ≤300ms for local backend watchlist/progress operations.

## Out of scope

### Explicitly Excluded from v1
- **Theatrical Movies & Secondary Catalog APIs:** Standalone theatrical films and integrating additional external media APIs (e.g., TMDB, OMDb) are excluded because v1 uses TVmaze exclusively.
- **User Accounts & Authentication:** Registration, login, OAuth, multi-user profiles, and cloud account syncing across separate users are out of scope.
- **Automatic Translation of Catalog Descriptions:** Machine-translating TVmaze show synopses, episode summaries, or character names into Portuguese is excluded; only application UI copy, backend messages, and available TVmaze AKA titles are localized.
- **Video Streaming & Provider Sync:** Playing media, hosting trailers/streams, or syncing watch history with third-party streaming platforms (Netflix, Prime Video, etc.) is excluded.
- **Notifications & Social Features:** Email/push alerts for upcoming episodes, user-written public reviews, friend lists, or shared watchlists are excluded.

### Future Improvements (Post-v1)
- Expanding catalog coverage to standalone theatrical movies via an additional media API.
- Adding multi-user authentication and cross-device profile synchronization.
- Expanding i18n support beyond English (`en`) and Brazilian Portuguese (`pt-BR`) to additional languages.
- Adding personalized scoring/ratings, custom lists/tags, and release calendar views.

### Known Boundaries and Limitations
- Catalog coverage, show classifications, cast/crew completeness (including director/writer credits), episode air dates, and Portuguese AKA title availability are bounded by what TVmaze maintains in its database.
