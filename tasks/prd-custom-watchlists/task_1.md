# Task 1.0: PostgreSQL Custom Watchlists Schema Migration, List Catalog, Error Localization, and Test DB Reset

## Overview

Create the reversible `node-pg-migrate` TypeScript migration defining `user_lists` (with the 3 seeded primary Series lists), `custom_list_series`, and `custom_list_people`, add backend list domain types, curated icon/color catalog, localized `FORBIDDEN` (`403`) / `CONFLICT` (`409`) / validation error messages (`en` and `pt-BR`), and update `testDatabase.ts` so test resets preserve and restore the 3 seeded system rows.

<skills>
### Skill compliance

- No implementation skills in `.agents/skills/` apply (backend schema, config, and i18n only; `react` skill is not applicable).
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- Manage all PostgreSQL schema changes through reversible `node-pg-migrate` TypeScript migrations in `backend/migrations/` (`AGENTS.md`).
- Keep all `.ts` files ≤ 100 lines, functions ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, and zero `any` (`code-standards.md`, `javascript-typescript.md`).
- Keep all API error messages localized in both `en` and `pt-BR` (`AGENTS.md`).
- Maintain ≥ 80% backend test coverage across all metrics (`tests.md`).
</rules>

<requirements>
- **FR1, FR2:** Seed the 3 non-deletable primary lists (`want_to_watch`, `watching`, `watched`) with default curated icons and colors.
- **FR4, FR9, FR10:** Define PostgreSQL schema with `UNIQUE (LOWER(name))`, `entity_type IN ('series', 'person')`, `JSONB` tags with GIN index, `custom_list_series` FK referencing both `user_lists(id)` and `watchlist_items(series_id)` with `ON DELETE CASCADE`, and `custom_list_people` FK referencing `user_lists(id)` with `ON DELETE CASCADE`.
- **FR20:** Add localized `en` and `pt-BR` error messages and primary list display labels/descriptions.
</requirements>

## Subtasks

- [x] 1.1 Create reversible TypeScript migration `backend/migrations/<timestamp>_custom-watchlists.ts` creating `user_lists`, `custom_list_series`, `custom_list_people`, required indexes, and seeding the 3 system rows (`want_to_watch`, `watching`, `watched`); verify `migrate:test:up` → `migrate:test:down` → `migrate:test:up` on PostgreSQL 18.7 (`IT-01`).
- [x] 1.2 Add `backend/src/types/list.ts` and `backend/src/config/listCatalog.ts` defining `LIST_ICON_IDS` (16 icons), `LIST_COLOR_IDS` (8 neon colors), default primary list mappings, and reserved primary list names (`en` and `pt-BR`).
- [x] 1.3 Extend `backend/src/types/error.ts` (`FORBIDDEN: 403`, `CONFLICT: 409`, and list `MessageKey`s), `backend/src/i18n/enMessages.ts`, `backend/src/i18n/ptBrMessages.ts`, and primary list localized name/description helpers.
- [x] 1.4 Update `backend/src/data/testDatabase.ts` so `resetTestDatabase` truncates user data tables, deletes non-system lists (`WHERE is_system = FALSE`), and restores default icons/colors on the 3 seeded primary rows without wiping system rows; verify existing backend tests and build pass.

## Implementation details

Follow `tasks/prd-custom-watchlists/techspec.md` sections:
- **Implementation design → Data models** (`user_lists`, `custom_list_series`, `custom_list_people`, Curated allow-lists, `ApiErrorResponse`)
- **Technical considerations → Known risks** (`resetTestDatabase` preservation of seeded system rows)

## Related acceptance criteria

- AC-01
- AC-02
- AC-03
- AC-12

## Task tests

### Unit tests (if applicable)

- [x] UT-01 - `listValidation` validates name, description, curated icon/color, tags, and reserved names (baseline catalog & localized error message checks)

### Integration tests (if applicable)

- [x] IT-01 - Custom watchlists migration (`up` → `down` → `up`) seeds 3 primary lists & cleans up on down

### E2E tests (if applicable)

Not applicable for this task (covered in Task 6.0).

## Relevant files

- `backend/migrations/<timestamp>_custom-watchlists.ts`
- `backend/src/types/list.ts`
- `backend/src/types/error.ts`
- `backend/src/config/listCatalog.ts`
- `backend/src/i18n/enMessages.ts`
- `backend/src/i18n/ptBrMessages.ts`
- `backend/src/i18n/messages.test.ts`
- `backend/src/data/testDatabase.ts`
