# Northstar overdue view — authored teaching contract

Objective: add an optional overdue view to the existing list.
Context: frozen baseline under northstar; desired behavior below differs from its current unfiltered query. See context-packet.md.
Scope: current task-list API, client interaction, related tests. Explain necessary scope expansion before implementing it.
Constraints: preserve session and membership enforcement, parameterized SQL, injectable clock, unfiltered compatibility and local-only demo boundaries.
Acceptance Criteria: overdue means a non-null normalized UTC deadline strictly earlier than now, status other than done, and a non-archived project. An unauthorized organization request is denied. Missing overdue and overdue=false preserve the list; overdue=true filters; other values return 400. Client toggle refreshes results and represents loading, error and empty states; reset restores default behavior.
Validation: fixed-clock predicate boundaries; query-value checks; authentication and cross-organization checks; client interaction and state checks; relevant typecheck/test/build commands in the selected checkout. Record unrun or unavailable checks.
Deliverables: scoped change, tests, evidence and unresolved assumptions.
Non-goals: schema changes, reminder delivery, product redesign, deployment, production authentication redesign.

This is not a new agent-run transcript. labs.mjs tests authored predicate counterexamples only. Existing evaluator: verification/acceptance.ts; preserve it outside candidate control.
