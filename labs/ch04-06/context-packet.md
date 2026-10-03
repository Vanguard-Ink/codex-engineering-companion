# Context packet — frozen Northstar baseline

Observed 2026-09-07. Paths below are relative to this edition repository root. Exact file hashes are in artifacts/ch04-06-results.json.

Current behavior: northstar/src/app.ts checks a session and organization membership before listing organization tasks. It has no overdue query implementation. The successful Chapter 3 candidate is a different artifact; do not confuse it with this frozen baseline.
Data representation and injected clock: northstar/src/db.ts and src/app.ts.
Client entry: northstar/src/main.tsx.
Basic verification: northstar/test/baseline.test.ts.
Intended commands: northstar/package.json and README.md. Lockfile/runtime availability must be checked in the chosen execution checkout before clean installation.
Desired behavior: task-contract.md in this packet; this is a requested change, not an observation of the baseline.
Independent acceptance source: verification/acceptance.ts. Keep evaluator control separate from candidate control.
Limitations: local teaching authentication, resetting database, no production deployment claim. Background jobs are later work.

Audit: overdue definition is missing for the future change; clock and boundary knowledge exist but need a discoverable entry link. No stale domain claim was established in the inspected baseline. Avoid creating duplicate definitions while repairing discoverability.
