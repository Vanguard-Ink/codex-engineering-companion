# Task contract — filled example

Objective: add optional overdue filtering to the existing task list.
Starting state: northstar/src/app.ts lists all seven organization-owned tasks; overdue query is not implemented.
Scope: app.ts, main.tsx and relevant tests in a separate task checkout.
Acceptance: deadline is non-null and strictly before injected now; status is not done; project is not archived; enforce organization membership before selection. Missing/false preserves unfiltered list; invalid values return 400. Checkbox refreshes; loading/error/empty states observable.
Constraints: no schema change, no weakened auth, no evaluator edits, no public demo deployment.
Inputs: C context packet and workflows/AGENTS.md.example.
Validation: typecheck/test/build in checkout; external verification/acceptance.ts; separately retained browser interaction checks.
Stop conditions: unsafe scope expansion, missing authority or unresolved boundary; explain before proceeding.
Deliverable: reviewed diff + actual command logs + acceptance JSON + G evidence record.
Recovery: discard/revert only the isolated task checkout using its saved Git checkpoint; preserve logs and historical originals.
Non-goals: notification workers, real identity provider, production deployment.
Evidence status: authored worked contract; historical candidate is a separate artifact.
