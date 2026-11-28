# Task 4.0: Frontend List Palette, API Client, Shared Hooks, Confirmation Dialog, Badges, and Modals

## Overview

Build the reusable frontend foundation for custom and primary lists: TypeScript contracts, curated WCAG AA neon palette and 16-icon map, `listService.ts` API client, bilingual `en`/`pt-BR` dictionary keys, custom hooks (`useLists`, `useListDetail`, `useListMembershipEditor`), `ConfirmDialog`, `ListMembershipBadges` (3 inline badges + `+N` overflow), `ListFormModal` (custom CRUD + primary icon/color-only mode), and unified single-edit `ListMembershipModal` (multi-select + undo + auto-primary + clear confirmation).

<skills>
### Skill compliance

- **`react` (`.agents/skills/react/SKILL.md`):** Load and follow all React 19 standards: granular functional components ≤ 30 lines, explicit props with zero `{...props}` spreading, custom `use*` hooks with `useEffect` restricted to external synchronization, backend access isolated in `services/listService.ts`, full `aria-*` semantics, and Tailwind CSS + Cyber-Neon Design System tokens.
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- Keep all `.ts`/`.tsx` files ≤ 100 lines, components/functions ≤ 30 lines, ≤ 3 parameters, zero blank lines inside functions, zero inline comments, and zero `any` (`code-standards.md`, `javascript-typescript.md`).
- Keep all UI labels, picker accessible names, errors, and dialogs localized in both `en` and `pt-BR` (`AGENTS.md`).
- Ensure every curated neon badge color achieves WCAG 2.1 AA contrast (`≥ 4.5:1`) and pairs color with icon + readable text label (`prd.md`, `DESIGN.md`).
- Run `npm test` (≥ 80% coverage), `npm run lint`, `npm run typecheck`, and `npm run build` in `frontend/` (`AGENTS.md`, `tests.md`).
</rules>

<requirements>
- **FR1, FR2, FR4, FR7, FR8:** Curated 16-icon picker, curated 8-color neon palette, free-form tag chips (max 10), primary-list locked form mode (icon/color only), and accessible delete confirmation dialog.
- **FR12, FR13:** Unified multi-select `ListMembershipModal` supporting simultaneous additions, primary status selection/clearing (with inline warning/confirmation), and undoing existing selections in a single atomic Save action for both Series and People.
- **FR15–FR18, FR20:** Reusable `ListMembershipBadges` showing up to 3 badges (primary prioritized first) + accessible `+N` overflow disclosure, clicking each badge navigates to `/watchlist/:listId`, fully localized in `en` and `pt-BR`.
</requirements>

## Subtasks

- [x] 4.1 Add `frontend/src/types/list.ts`, update `frontend/src/types/{search,series,person,recommendation,watchlist}.ts` with `lists: ListBadgeSummary[]`, add `frontend/src/styles/listPalette.ts`, `frontend/src/services/listService.ts`, and complete `en`/`pt-BR` translations in `frontend/src/i18n/{en,ptBR}.ts`.
- [x] 4.2 Add custom hooks `frontend/src/hooks/{useLists,useListDetail,useListMembershipEditor}.ts` and reusable `frontend/src/components/common/ConfirmDialog.tsx`.
- [x] 4.3 Implement `ListIcon.tsx` and `ListMembershipBadges.tsx` (≤ 3 inline badges + accessible `+N` overflow disclosure + links to `/watchlist/:listId`) with unit tests in `ListMembershipBadges.test.tsx` (`UT-05`).
- [x] 4.4 Implement `ListFormModal.tsx` (`IconPickerGrid.tsx`, `ColorPickerGrid.tsx`, `TagChipInput.tsx`) and `ListMembershipModal.tsx` (`PrimaryStatusSection.tsx`, `CustomListCheckboxGroup.tsx`) with unit tests in `ListFormModal.test.tsx` (`UT-06`) and `ListMembershipModal.test.tsx` (`UT-07`); verify `frontend` `npm test`, `lint`, `typecheck`, and `build`.

## Implementation details

Follow `tasks/prd-custom-watchlists/techspec.md` sections:
- **System architecture → Component overview** (new frontend primitives, hooks, and modals)
- **Implementation design → Data models** (Curated allow-lists, `ListBadgeSummary`, `UserListSummary`)
- **Skill compliance** (`react` skill component decomposition ≤ 30 lines and WCAG AA accessibility)

## Related acceptance criteria

- AC-01
- AC-02
- AC-03
- AC-05
- AC-06
- AC-07
- AC-11
- AC-12

## Task tests

### Unit tests (if applicable)

- [x] UT-05 - `ListMembershipBadges` renders ≤ 3 badges + `+N` overflow and links to `/watchlist/:listId`
- [x] UT-06 - `ListFormModal` validates inputs, tag chips, icon/color pickers, and primary lock mode
- [x] UT-07 - `ListMembershipModal` supports batch multi-select, auto-primary selection & clear confirm

### Integration tests (if applicable)

Not applicable for this task (backend integration covered in Tasks 1–3; full E2E covered in Task 6).

### E2E tests (if applicable)

Not applicable for this task (covered in Task 6.0).

## Relevant files

- `frontend/src/types/{list,search,series,person,recommendation,watchlist}.ts`
- `frontend/src/styles/listPalette.ts`
- `frontend/src/services/listService.ts`
- `frontend/src/i18n/{en,ptBR}.ts`
- `frontend/src/hooks/{useLists,useListDetail,useListMembershipEditor}.ts`
- `frontend/src/components/common/ConfirmDialog.tsx`
- `frontend/src/components/lists/{ListIcon,ListMembershipBadges,ListFormModal,IconPickerGrid,ColorPickerGrid,TagChipInput,ListMembershipModal,PrimaryStatusSection,CustomListCheckboxGroup}.tsx`
- `frontend/src/components/lists/{ListMembershipBadges,ListFormModal,ListMembershipModal}.test.tsx`
