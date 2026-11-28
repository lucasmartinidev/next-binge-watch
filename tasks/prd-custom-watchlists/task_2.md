# Task 2.0: Backend Repositories, Validation, Primary Protection, and Atomic Multi-List Services

## Overview

Implement parameterized PostgreSQL repositories (`UserListRepository`, `ListMembershipRepository`), pure list validation (`listValidation.ts`), primary-list mutation protection (`UserListService`), and batch badge lookup plus transactional single-edit multi-list sync (`ListMembershipService`), along with in-memory doubles and unit/integration tests.

<skills>
### Skill compliance

- No implementation skills in `.agents/skills/` apply (backend persistence and business services only; `react` skill is not applicable).
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- Pure `async/await` parameterized PostgreSQL queries and transactions with `PoolClient` always released inside `finally` (`node.md`).
- Unidirectional architecture: `services → data → types` with zero circular imports (`folder-structure.md`, `node.md`).
- Keep every `.ts` file ≤ 100 lines, every function/method ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, and zero `any` (`code-standards.md`, `javascript-typescript.md`).
- Follow FIRST principle (in-memory doubles for service unit tests, real PostgreSQL `next_binge_watch_test` for repository integration tests) and maintain ≥ 80% coverage (`tests.md`).
</rules>

<requirements>
- **FR1, FR2, FR4–FR8:** CRUD for custom lists with case-insensitive name uniqueness, reserved primary name rejection, type/tag filtering, primary list `403` protection (icon/color-only updates, no delete), and safe custom list deletion preserving watched episodes and primary memberships.
- **FR9–FR13:** Strict `series`/`person` type validation, `FR10` primary-list invariant (auto-assigning primary list when adding untracked series to custom Series lists; cascading custom removal on primary untrack), and atomic transactional batch updates (`updateSeriesLists`, `updatePersonLists`).
- **FR15–FR17:** O(1) batch `ANY($1::int[])` membership lookup returning ordered `ListBadgeSummary[]` (primary list prioritized first for series).
</requirements>

## Subtasks

- [x] 2.1 Implement `backend/src/data/userListRepository.ts` and `backend/src/data/listMembershipRepository.ts` (parameterized queries, item count aggregation, `ANY($1::int[])` batch lookups, and transactional series/person membership replacement).
- [x] 2.2 Implement `backend/src/services/listValidation.ts` (name, description, icon/color allow-lists, tag normalization/deduplication/limits, reserved primary name check) and `listValidation.test.ts` (`UT-01`).
- [x] 2.3 Implement `backend/src/services/listMembershipService.ts` and `backend/src/services/userListService.ts` enforcing primary protection (`403`), uniqueness (`409`), cross-type rejection (`400`), `FR10` invariant, and atomic transactions.
- [x] 2.4 Extend `backend/src/services/inMemoryRepositories.ts` and add unit tests (`userListService.test.ts` `UT-02`, `listMembershipService.test.ts` `UT-03`) plus PostgreSQL repository integration tests (`listRepositories.test.ts` `IT-02`); verify `npm test` and `npm run build` in `backend/`.

## Implementation details

Follow `tasks/prd-custom-watchlists/techspec.md` sections:
- **Implementation design → Primary interfaces** (`UserListRepository`, `ListMembershipRepository`, `ListMembershipService`, `UserListService`)
- **Integration points** (`pg.Pool` transactions and `ANY($1::int[])` batch queries)
- **Testing approach** (`UT-01`, `UT-02`, `UT-03`, `IT-02`)

## Related acceptance criteria

- AC-01
- AC-02
- AC-03
- AC-04
- AC-05
- AC-06
- AC-07

## Task tests

### Unit tests (if applicable)

- [x] UT-01 - `listValidation` validates name, description, curated icon/color, tags, and reserved names
- [x] UT-02 - `UserListService` enforces primary list protection (no delete, icon/color-only PATCH)
- [x] UT-03 - `ListMembershipService` enforces FR10 invariant, cross-type rejection, and badge ordering

### Integration tests (if applicable)

- [x] IT-02 - `UserListRepository` & `ListMembershipRepository` CRUD, unique lower(name), & FK cascades

### E2E tests (if applicable)

Not applicable for this task (covered in Task 6.0).

## Relevant files

- `backend/src/data/userListRepository.ts`
- `backend/src/data/listMembershipRepository.ts`
- `backend/src/data/listRepositories.test.ts`
- `backend/src/services/listValidation.ts`
- `backend/src/services/listValidation.test.ts`
- `backend/src/services/listMembershipService.ts`
- `backend/src/services/listMembershipService.test.ts`
- `backend/src/services/userListService.ts`
- `backend/src/services/userListService.test.ts`
- `backend/src/services/inMemoryRepositories.ts`
