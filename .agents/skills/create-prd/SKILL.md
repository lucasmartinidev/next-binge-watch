---
name: create-prd
description: PRD - Product Requirements Document. Use when the user asks for a PRD or wants to define the requirements and scope of a new feature or product (the first step in the PRD -> TechSpec -> tasks workflow). Do not use for technical specifications (create-techspec) or for breaking requirements down into tasks (create-tasks).
argument-hint: --prompt "feature description"
---

Skill folder: `.agents/skills/create-prd/`

The PRD defines the problem, objectives, expected outcomes, constraints, and scope. Objectives and outcomes must have measurable criteria. Implementation details, such as architecture and code, belong in the TechSpec and must remain outside the PRD.

## Workflow

1. **Clarify** - ask the user questions using `AskUserQuestion` before drafting:
   - Problem to solve and measurable goals
   - Primary users, user stories, and main flows
   - Core features: inputs, outputs, and actions
   - Out-of-scope items and dependencies
   - UI/UX and accessibility guidelines

   For domain-specific business rules, research the web instead of asking the user.
   **Complete when:** every template section has an answer or a recorded assumption.

2. **Draft** - read `./references/TEMPLATE.md` for this skill in full and follow its structure exactly.
   **Complete when:** every template section is filled with feature- or product-specific information.

3. **Save and report** - save the document to `./tasks/prd-[slug]/prd.md`, using a kebab-case feature slug. Report the path with a one-line summary.
