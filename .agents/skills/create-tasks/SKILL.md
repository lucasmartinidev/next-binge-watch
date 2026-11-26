---
name: create-tasks
description: Tasks - break a feature down into implementation tasks from the existing PRD and TechSpec in `tasks/prd-*/`. Use when the user asks to decompose a feature or plan its implementation. Do not use to draft the PRD (create-prd) or TechSpec (create-techspec).
argument-hint: --prd feature-name
---

Skill folder: `.agents/skills/create-tasks/`

The `--prd` argument identifies the feature slug. Without an argument, locate the folder in `./tasks/prd-*/`. The required files are `tasks/prd-[slug]/prd.md` and `tasks/prd-[slug]/techspec.md`; if either is missing, stop and point to the corresponding skill (`/create-prd` or `/create-techspec`).

Each task is an **incremental deliverable**, with clear scope, explicit dependencies, and its own tests. Reference the PRD's acceptance criteria and use the TechSpec test cases as the source of truth for task tests. Reference `techspec.md` instead of repeating implementation details.

## Workflow

1. **Analyze** - read `AGENTS.md`, all rules in `.agents/rules/`, the PRD, and the TechSpec; inventory the requirements, acceptance criteria (`AC-*`), technical decisions, components, and every test case defined in the TechSpec. Identify the skills in `.agents/skills/` applicable to each task.
   **Complete when:** the inventory of criteria and test cases is complete and applicable skills for each task have been identified.

2. **Propose the structure** - create a list of high-level tasks, preferably with no more than 10 items. List dependencies before the tasks that depend on them, such as backend before frontend when the frontend depends on it, and both before E2E tests. Show the list to the user for approval before generating any file.
   **Complete when:** the user approves the list.

3. **Generate the files** - in `./tasks/prd-[slug]/`:
   - `tasks.md` following `./references/TEMPLATE_TASKS.md` for this skill
   - one `task_[num].md` file for each task, following `./references/TEMPLATE_TASK.md` for this skill. Use sequential numbers starting at 1 (`task_1.md`, `task_2.md`, ...) and include subtasks (`[num].1`, `[num].2`, ...), references to acceptance criteria (`AC-*`), and the tests corresponding to the mapped TechSpec cases
     **Complete when:** every acceptance criterion and test case in the inventory is mapped to one or more tasks, and each task's tests match the cases defined in the TechSpec.

4. **Report** - present the generated files and wait for the user's confirmation before starting any implementation.
