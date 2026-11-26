---
name: execute-review
description: Code review - review and stabilize feature code for compliance with project rules, alignment with the TechSpec, tasks, and tests, with a final report and verdict. Use when the user asks for a code review, asks to validate compliance, or asks to fix problems found during the review. Do not use to validate behavior in QA (execute-qa) or implement new tasks.
argument-hint: --prd feature-name
---

Skill folder: `.agents/skills/execute-review/`

The `--prd` argument identifies the feature slug. Without an argument, locate the folder in `tasks/prd-*/`. Read the project's `AGENTS.md`. In `tasks/prd-[slug]/`, read `techspec.md` and `tasks.md`; consult `prd.md` only when necessary to clarify a requirement. Generate `codereview.md` in the same folder.

Check project rules and the TechSpec before reporting any issue. Run the tests and validations required by `AGENTS.md` before recording the verdict; the review can be **APPROVED** only when all applicable tests pass.

## Workflow

1. **Analyze** - read `AGENTS.md`, all rules in `.agents/rules/`, the TechSpec (expected architecture), and the tasks (implemented scope). Load only the applicable project skills from `.agents/skills/`.
   **Complete when:** the expected architecture, scope, rules, and applicable skills are clear.

2. **Check rule compliance** - check every change against the applicable project rules in `.agents/rules/`. Record every violation and the corresponding rule.
   **Complete when:** every change has been checked against the applicable rules.

3. **Check TechSpec alignment** - compare the implementation with the specification:
   - [ ] Architecture matches the specification
   - [ ] Components, interfaces, and contracts match the definitions
   - [ ] Data models match the documentation
   - [ ] Endpoints/APIs and integrations, when applicable, match the specification

   **Complete when:** every TechSpec decision has been confirmed as implemented or recorded as a justified deviation.

4. **Check task completeness** - for every task marked complete, verify that the code was implemented, related acceptance criteria are tracked, subtasks are complete, and task tests are present. Functional validation of the criteria remains the QA responsibility.
   **Complete when:** every task marked complete satisfies all four points.

5. **Run tests** - read the test, validation, build, and coverage commands defined in `AGENTS.md` and run the applicable commands inside each affected application. If a command requires the application to be running, prepare an environment isolated from the worktree: use an available port in the `30**` range (for example, `3000-3099`) for the backend, an available port in the `51**` range (for example, `5100-5199`) for the frontend, and a dedicated range for each additional database or service. Check each port before starting a process; if it is occupied, choose another within the range. Configure service URLs, record the ports and started processes, and do not assume commands or tools that are not defined in the project.
   **Complete when:** every applicable command defined in `AGENTS.md` has been executed, tests pass, and the minimum coverage is met when applicable.

6. **Fix and revalidate** - for each issue found:
   - fix the root cause and adjust or create the necessary tests;
   - if the fix requires changing the PRD, TechSpec, or scope, record the issue as a blocker and ask the user for a decision;
   - run the tests again and repeat the relevant checks.

   **Complete when:** there are no blocking issues and the tests and relevant checks have been rerun.

7. **Report** - generate `codereview.md` following `./references/TEMPLATE.md` for this skill, with the verdict:
   - **APPROVED** - criteria met, tests passing, and code compliant with the rules and TechSpec.
   - **APPROVED WITH RESERVATIONS** - main criteria met; recommended improvements are not blocking.
   - **REJECTED** - tests failing, a serious standards violation, lack of TechSpec alignment, or a security issue.

   **Complete when:** `codereview.md` is saved according to the template with the verdict recorded.

8. **Shut down the environment** - stop every service started by this execution, terminate processes gracefully, and confirm that ports, temporary databases, containers, and other resources have been released. Do not terminate processes belonging to another worktree or the user. Perform this cleanup if the review is interrupted, blocked, or rejected as well.
