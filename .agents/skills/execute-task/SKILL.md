---
name: execute-task
description: Task - identify and implement the next task for a feature from the PRD, TechSpec, and tasks.md, marking it complete at the end. Use when the user asks to execute, implement, or start a task/subtask, or continue implementing a feature. Do not use to review (execute-review) or validate in QA (execute-qa) work that is already implemented.
argument-hint: --prd feature-name
---

Skill folder: `.agents/skills/execute-task/`

The `--prd` argument identifies the feature slug. Without an argument, locate the folder in `tasks/prd-*/`. The required files in `tasks/prd-[slug]/` are `prd.md`, `techspec.md`, and `tasks.md`; if any is missing, stop and point to the corresponding skill (`/create-prd`, `/create-techspec`, or `/create-tasks`).

A task is an **incremental deliverable**, with explicit dependencies and its own tests. Implement every subtask and move from plan to implementation as soon as the approach is clear. Reference `techspec.md` instead of repeating implementation details.

## Workflow

1. **Select the task** - identify the next incomplete task in `tasks.md`; open the corresponding `task_[num].md` file and read its definition, subtasks (`[num].1`, `[num].2`, ...), related acceptance criteria, and tests.
   **Complete when:** the next task and all its subtasks have been identified.

2. **Prepare** - read `AGENTS.md` and all rules in `.agents/rules/`; review the PRD context and TechSpec requirements for the task; understand dependencies on previous tasks; load only the applicable project skills from `.agents/skills/` and consult web documentation for involved libraries when necessary.
   When the task requires running the application, prepare an environment isolated from the worktree: use an available port in the `30**` range (for example, `3000-3099`) for the backend, an available port in the `51**` range (for example, `5100-5199`) for the frontend, and a dedicated range for each additional database or service. Check each port before starting a process; if it is occupied, choose another within the range. Configure service URLs, record the ports and started processes, and start only the required services.
   **Complete when:** the approach is clear, `AGENTS.md` and every rule have been consulted, applicable skills have been loaded, and required services are available.

3. **Implement** - implement every subtask in order; at the end, run the task's validations and tests using the commands defined in `AGENTS.md` and applicable rules.
   **Complete when:** every subtask is implemented and the task's applicable validations and tests pass.

4. **Complete and clean up** - mark all subtasks and applicable tests as complete (`[x]`) in `task_[num].md`. Then mark the task complete (`[x]`) in `tasks.md`, report in one line what was implemented, and stop every service started by this execution. Terminate processes gracefully, confirm that ports were released, and do not terminate processes belonging to another worktree or the user. Perform this cleanup if execution is interrupted or blocked as well.
   **Complete when:** all subtasks and applicable tests are marked in the task file, and the task is marked complete in `tasks.md`.
