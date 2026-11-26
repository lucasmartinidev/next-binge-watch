---
name: execute-qa
description: QA - validate and stabilize an implemented feature against the PRD, TechSpec, and tasks: unit, integration, and E2E tests with the available browser tool, accessibility, responsiveness, bug fixes, and a final report with evidence. Use when the user asks to execute QA. Do not use to implement new tasks or review code (execute-review).
argument-hint: --prd feature-name
---

Skill folder: `.agents/skills/execute-qa/`

The `--prd` argument identifies the feature slug. Without an argument, locate the folder in `tasks/prd-*/`. Read the project's `AGENTS.md`. In `tasks/prd-[slug]/`, read `prd.md`, `techspec.md`, and `tasks.md`; create and maintain `qa.md` with defects, fixes, regression tests, and evidence. Save all browser-tool evidence in `tasks/prd-[slug]/evidences/`.

QA is **APPROVED** only when every acceptance criterion in the PRD has been verified and is met. If bugs are found, fix their root cause, create regression tests, and repeat validation. For UI flows, use the browser tool available in the environment, such as Playwright MCP, Vercel Agent Browser, or an equivalent tool.

## Workflow

1. **Analyze** - read `AGENTS.md`, all rules in `.agents/rules/`, the PRD, TechSpec, and every task file; build a checklist with one verification item per acceptance criterion (`AC-*`) and associate the corresponding test cases (`UT-*`, `IT-*`, and `E2E-*`).
   **Complete when:** there is one verification item and at least one associated test case for every PRD acceptance criterion.

2. **Prepare the environment** - start the services required for validation in an environment isolated from the worktree. Use an available port in the `30**` range (for example, `3000-3099`) for the backend, an available port in the `51**` range (for example, `5100-5199`) for the frontend, and a dedicated range for each additional database or service. Check each port before starting a process; if it is occupied, choose another within the range. Configure service URLs, record the ports and started processes, and open the application with the available browser tool.
   **Complete when:** the required services respond, the home page is loaded, and the URLs and ports in use are recorded.

3. **Test each flow (E2E)** - for every acceptance criterion with a UI flow, execute the corresponding E2E case using the available browser tool and verify the expected result in the application state. When behavior is unexpected, investigate the UI state, browser console messages, API requests and responses, and backend logs before recording or fixing the bug. Capture visual evidence, save it in `tasks/prd-[slug]/evidences/`, mark the result as PASS or FAIL, and record each failure in `qa.md`.
   **Complete when:** every acceptance criterion with a UI flow is marked PASS or FAIL with evidence.

4. **Execute TechSpec test cases** - execute the unit (`UT-*`) and integration (`IT-*`) test cases associated with the acceptance criteria, when applicable, using the commands defined in `AGENTS.md` and applicable rules. When the project defines a coverage target, verify it using the mechanisms available in the stack and record the result in `qa.md`. Also record each case result in the checklist and each failure in `qa.md`.
   **Complete when:** every applicable unit and integration test case associated with the criteria has been executed or is explicitly blocked.

5. **Verify accessibility** - on every screen, use the available browser tool to test keyboard navigation and check labels and semantics:
   - [ ] Keyboard navigation (Tab, Enter, Esc)
   - [ ] Interactive elements have descriptive labels
   - [ ] Images have appropriate alternative text (`alt`)
   - [ ] Adequate color contrast
   - [ ] Forms have labels associated with fields
   - [ ] Error messages are clear and accessible
   - [ ] Fonts have an appropriate size

   **Complete when:** every item has been checked on every screen.

6. **Verify visuals and responsiveness** - capture the main screens, save them in `tasks/prd-[slug]/evidences/`, cover the states (empty, populated, and error), and the main breakpoints, and document inconsistencies.
   **Complete when:** the main states and breakpoints have been captured and inconsistencies documented.

7. **Fix discovered bugs** - for each bug recorded in `qa.md`:
   - locate and fix the root cause without masking the symptom;
   - create a regression test that fails without the fix;
   - record the status, applied fix, and created test in `qa.md`;
   - if the fix requires changing the PRD, TechSpec, or scope, stop and ask the user for a decision.

   **Complete when:** every bug recorded in `qa.md` has a fix and regression test, or is explicitly blocked by a user decision.

8. **Revalidate** - repeat failed flows, execute regression tests, and recheck affected acceptance criteria. If any validation fails, return to step 7.
   **Complete when:** every acceptance criterion is marked PASS, with no unresolved bugs.

9. **Report** - generate `qa.md` following `./references/TEMPLATE.md` for this skill, including fixed bugs, regression tests, and final evidence.
   **Complete when:** `qa.md` is generated according to the template and updated with the final results.

10. **Shut down the environment** - stop every service started by this execution, terminate processes gracefully, and confirm that ports, temporary databases, containers, and other resources have been released. Do not terminate processes belonging to another worktree or the user. Perform this cleanup if QA is interrupted, blocked, or rejected as well.
