# Task 4.0: Comprehensive Project Documentation (`README.md`, `AGENTS.md`, and Config Docs)

## Overview

Create a comprehensive root `README.md`, update `AGENTS.md` and active operational configuration docs to reflect PostgreSQL 18.7, `node-pg-migrate`, Docker Compose, and updated `backend/package.json` scripts, scrub all stale SQLite instructions, and verify every documented command end-to-end.

<skills>
### Skill compliance

- No implementation skills in `.agents/skills/` apply (documentation and developer-experience verification only).
</skills>

<rules>
### Compliance with AGENTS.md and the rules

`AGENTS.md` and every rule in `.agents/rules/` (`code-standards.md`, `javascript-typescript.md`, `node.md`, `tests.md`, `folder-structure.md`) were read and apply to this task:
- Preserve the independent `frontend/` and `backend/` application boundary with **no root `package.json`** (`AGENTS.md`, `folder-structure.md`).
- Ensure documentation never includes real secrets and reflects `.env.example` placeholder values (`code-standards.md`, `node.md`).
- Verify all required validation commands documented in `AGENTS.md` succeed cleanly (`AGENTS.md`, `tests.md`).
</rules>

<requirements>
- **FR17:** Create root `README.md` covering project overview, prerequisites (Node.js, npm, Docker / Docker Compose), `.env` configuration, PostgreSQL 18.7 startup via Docker Compose, `node-pg-migrate` workflows (`up`, `down`, `redo`, `create`), local backend/frontend development startup, and running backend, frontend, and Playwright E2E test suites.
- **FR18:** Update `AGENTS.md` to document PostgreSQL 18.7, `node-pg-migrate`, Docker Compose prerequisite, and updated `backend/package.json` scripts while keeping the no-root-`package.json` rule intact.
- **FR19:** Ensure zero stale SQLite setup instructions remain across active operational docs (`README.md`, `AGENTS.md`, `backend/.env.example`, and `frontend/README.md` if applicable) without altering historical `tasks/prd-next-binge-watch/` specs.
</requirements>

## Subtasks

- [x] 4.1 Create root `README.md` with complete onboarding, architecture overview, Docker Compose PostgreSQL 18.7 setup, `.env` configuration, `node-pg-migrate` commands, local development startup, and testing instructions.
- [x] 4.2 Update `AGENTS.md` to reflect PostgreSQL 18.7, `pg`, `node-pg-migrate`, Docker Compose prerequisites, updated `backend/package.json` scripts, and the updated backend/E2E testing workflow.
- [x] 4.3 Audit active operational documentation and config templates (`README.md`, `AGENTS.md`, `backend/.env.example`, `frontend/README.md`) to confirm zero stale SQLite references and execute a full verification pass of the documented setup, migration, build, and test commands across `backend/`, `frontend/`, and `e2e/`.

## Implementation details

Follow `tasks/prd-postgresql-migration/techspec.md` sections:
- **Implementation design → Data models** (`AppEnv` template and `backend/package.json` scripts table)
- **Integration points** (Docker Compose PostgreSQL 18.7 & `node-pg-migrate` workflows)
- **Compliance with AGENTS.md and the rules**

## Related acceptance criteria

- AC-09
- AC-10

## Task tests

### Unit tests (if applicable)

Not applicable for documentation-only changes; re-verify full `backend/` and `frontend/` Vitest suites pass using documented commands.

### Integration tests (if applicable)

Not applicable for documentation-only changes; re-verify `backend` `npm test` and `migrate:up` / `migrate:down` / `migrate:up` succeed using documented commands.

### E2E tests (if applicable)

Re-verify `e2e` Playwright suite succeeds using the documented commands.

## Relevant files

- `README.md`
- `AGENTS.md`
- `backend/.env.example`
- `frontend/README.md`
