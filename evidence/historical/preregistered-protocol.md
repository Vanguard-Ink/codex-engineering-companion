# Chapter 3 baseline protocol

Written before candidate execution. One run; no selection among repeated successes or failures.

Candidate receives only the task below and its application checkout. No evaluator assertions or author prose are placed inside that checkout. Global configuration and instructions may still apply; record that limitation. Do not disable safety controls to obtain a result. Use the configured model and record what the CLI reports. No additional agents.

Task: Add an Overdue only checkbox to the task list and support overdue=true on the task-list API. Only show unfinished tasks whose deadline has passed, in active projects belonging to the signed-in user's organization. Preserve the unfiltered list, show an empty state, handle loading and errors, validate query input, and add tests. Keep the change focused. Inspect the repository first. Work only in this checkout. Do not use additional agents, publish, install packages, change global settings or alter authentication. Available dependencies are already installed. Run typecheck, tests and build, then report results and limitations.

Acceptance: overdue predicate uses strictly earlier than injected UTC now; excludes done, null, future, exact-boundary and archived tasks; preserves organization membership and session expiry; invalid query returns 400; false/absent query preserve seven own tasks. Browser evaluator checks sign-in, checkbox, two correct tasks, filter reset, empty state and error state. External evaluator results are separate from candidate self-tests.

Record start/end and elapsed time, CLI version, reported model/effort if emitted, token usage if emitted, exit code, changed files, test outputs, candidate narrative, independent API/browser results. Human review time and dollar cost are NOT_MEASURED. Candidate exit failure before any model response is an infrastructure block, not a coding failure. Do not replace it with scripted edits and call them an observed agent result.
