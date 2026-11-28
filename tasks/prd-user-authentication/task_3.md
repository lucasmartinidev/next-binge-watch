# Task 3.0: Backend Multi-User Ownership Scoping Across Existing Repositories and Domain Services

## Overview

Update every existing watchlist, watched-episode, list, list-membership, preference, and discovery repository/service to enforce strict `userId` ownership isolation—requiring `userId` for all personal data operations and accepting optional `userId?: string` on public discovery services so unauthenticated callers receive clean catalog data without personal list badges or watchlist state.

<skills>
### Skill compliance

No frontend React code is modified in this task; no project skill under `.agents/skills/` applies directly to this backend-only task.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and all rules in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply:
- Keep every non-test `.ts` file ≤ 100 lines, functions/methods ≤ 30 lines, ≤ 3 parameters (group `userId` into typed input objects when adding it would exceed 3 parameters), zero blank lines inside functions, zero inline comments, and zero `any`.
- Enforce strict `WHERE user_id = $1` scoping at the repository SQL layer and resolve primary lists by either UUID `id` or `system_key` for the owning user.
- Update in-memory test doubles and existing unit/repository tests so 100% of suites pass with ≥ 80% coverage.
</rules>

<requirements>
- FR4, FR10, FR11, FR24, FR25, FR26, FR27
</requirements>

## Subtasks

- [x] 3.1 Scope `watchlistRepository.ts`, `watchedEpisodeRepository.ts`, and `preferencesRepository.ts` (plus row mappers) by `userId` across all queries and mutations.
- [x] 3.2 Scope `userListRepository.ts`, `listMembershipRepository.ts`, and `listMembershipQueries.ts` by `userId`, adding per-user UUID `id` or `system_key` lookup (`findByIdOrSystemKey`) and composite `(user_id, series_id)` / `(list_id, user_id)` operations.
- [x] 3.3 Update private domain services (`watchlistService.ts`, `episodeTrackingService.ts`, `userListService.ts`, `listMembershipService.ts`, `listDetailLoader.ts`, `listSeriesCommit.ts`, `preferencesService.ts`) to require `userId` and pass it down to repositories.
- [x] 3.4 Update public discovery services (`searchService.ts`, `seriesService.ts`, `personService.ts`, `recommendationService.ts`) to accept optional `userId?: string` and omit personal watchlist status and list membership badges when `userId` is absent.
- [x] 3.5 Update in-memory repository doubles (`inMemoryRepositories.ts`, `inMemoryUserListRepository.ts`, `inMemoryListMembershipRepository.ts`) and existing unit/repository test suites (`repositories.test.ts`, `listRepositories.test.ts`, `watchlistService.test.ts`, `userListService.test.ts`, `listMembershipService.test.ts`, `searchService.test.ts`, `seriesService.test.ts`, `personService.test.ts`, `recommendationService.test.ts`) to verify multi-user isolation (`IT-06` repository/service layer).

## Implementation details

Follow `techspec.md` sections:
- **System architecture → Component overview** (Backend Modified Components)
- **Implementation design → Data models** (Multi-User Ownership Updates on Existing Tables)
- **Technical considerations → Key decisions** (Composite Foreign Keys, Primary List Resolution by UUID `id` or `system_key`)

## Related acceptance criteria

- AC-01
- AC-02
- AC-07

## Task tests

### Unit tests (if applicable)

- [x] Updated service unit tests verifying `userId` scoping and anonymous public discovery omission (`watchlistService.test.ts`, `userListService.test.ts`, `listMembershipService.test.ts`, `searchService.test.ts`, `seriesService.test.ts`, `personService.test.ts`, `recommendationService.test.ts`)

### Integration tests (if applicable)

- [x] IT-06 - Multi-user isolation across watchlists, lists, episodes, recommendations, prefs (repository & service isolation against PostgreSQL in `repositories.test.ts` and `listRepositories.test.ts`)

### E2E tests (if applicable)

Not applicable in this task (covered in Task 8.0).

## Relevant files

- `backend/src/data/watchlistRepository.ts`
- `backend/src/data/watchedEpisodeRepository.ts`
- `backend/src/data/preferencesRepository.ts`
- `backend/src/data/userListRepository.ts`
- `backend/src/data/listMembershipRepository.ts`
- `backend/src/data/listMembershipQueries.ts`
- `backend/src/data/repositories.test.ts`
- `backend/src/data/listRepositories.test.ts`
- `backend/src/services/watchlistService.ts`
- `backend/src/services/episodeTrackingService.ts`
- `backend/src/services/userListService.ts`
- `backend/src/services/listMembershipService.ts`
- `backend/src/services/listDetailLoader.ts`
- `backend/src/services/listSeriesCommit.ts`
- `backend/src/services/preferencesService.ts`
- `backend/src/services/searchService.ts`
- `backend/src/services/seriesService.ts`
- `backend/src/services/personService.ts`
- `backend/src/services/recommendationService.ts`
- `backend/src/services/inMemoryRepositories.ts`
- `backend/src/services/inMemoryUserListRepository.ts`
- `backend/src/services/inMemoryListMembershipRepository.ts`
