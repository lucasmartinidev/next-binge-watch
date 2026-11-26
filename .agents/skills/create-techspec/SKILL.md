---
name: create-techspec
description: TechSpec - a technical specification derived from an existing PRD. Use when the user asks for a TechSpec or the architecture of a feature that already has a PRD in `tasks/prd-*/prd.md`. Do not use without a PRD (create-prd) or to break requirements down into tasks (create-tasks).
argument-hint: --prd feature-name
---

Skill folder: `.agents/skills/create-techspec/`

The `--prd` argument identifies the feature slug. Without an argument, locate the folder in `./tasks/prd-*/`. The required PRD is `tasks/prd-[slug]/prd.md`; if it does not exist, stop and point to `/create-prd`.

The TechSpec defines the architecture, components, contracts, and tests for the solution. The problem, objectives, and scope are already in the PRD; reference it instead of repeating that information. Specify without implementing: include code only in the template's interface examples. Prefer a simple, evolvable architecture with clear interfaces.

## Workflow

1. **Analyze the PRD** - read it in full; extract requirements, acceptance criteria, constraints, and success metrics.
   **Complete when:** the requirements, acceptance criteria, constraints, and success metrics have been identified.

2. **Explore the project** - read `AGENTS.md` and all rules in `.agents/rules/`; use the Explore agent before asking the user anything. Examine affected files and modules, interfaces and integration points, callers and callees, configuration, persistence, error handling, existing tests, and infrastructure. Assess whether existing libraries should be reused or a new solution built. Research the documentation for involved libraries and unresolved business rules on the web.
   **Complete when:** every new or modified component can be named and its place in the current codebase can be identified.

3. **Clarify** - ask the user questions using `AskUserQuestion` before drafting. Focus on what exploration did not clarify: domain boundaries, data flows and contracts, external dependencies (failure modes, timeouts, and idempotency), primary interfaces, and critical test scenarios.
   **Complete when:** every question has an answer or an explicit assumption.

4. **Draft** - read `./references/TEMPLATE.md` for this skill in full and follow its structure exactly. In "Compliance with AGENTS.md and the rules", confirm that `AGENTS.md` and every rule in `.agents/rules/` were read. In "Skill compliance", check only the applicable project skills in `.agents/skills/` and record deviations with a justification. In "Testing approach", define applicable cases, name and identify them by layer (`UT-*` for unit tests, `IT-*` for integration tests, and `E2E-*` for E2E tests), and associate each case with the acceptance criteria it verifies. When a coverage target exists, use the target defined in `AGENTS.md` or the project rules.
   **Complete when:** every template section is filled and every component from step 2 is specified.

5. **Save and report** - save the document to `tasks/prd-[slug]/techspec.md` and report the path with a one-line summary.
