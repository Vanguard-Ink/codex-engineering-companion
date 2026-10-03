# Northstar Chapters 14–15 companion labs

These executable local teaching artifacts support the authored case studies in Chapters 14 and 15. They import the preserved Northstar database constructor, but they do not modify the preserved application. They are not a production incident record, an autonomous model benchmark, a public deployment, or evidence of human release approval.

## Contents

- `access-audit.ts` adds an isolated role policy, organization-scoped task mutation, transactional audit record, and scoped audit reader.
- `outbox.ts` adds a transaction-local notification intent, a single-worker retry loop, and a cooperating SQLite-backed provider simulator.
- `run-labs.ts` executes the Chapter 14 and Chapter 15 cases and writes timestamped JSON and text evidence under `evidence/`.

## Replay

From the project root, using Node 24:

```powershell
node --experimental-strip-types Companion/labs/ch13-15/run-labs.ts
```

Run the strict compiler check with the TypeScript installation retained by the Northstar companion:

```powershell
Companion/Northstar/northstar/node_modules/.bin/tsc.cmd -p Companion/labs/ch13-15/tsconfig.json
```

The runner creates new timestamped evidence files; it does not overwrite an earlier record. It also stores disposable queue and provider databases for the reopen-recovery case.

## Evidence boundary

The suite validates fifteen Chapter 14 cases and eleven Chapter 15 cases. The runner records runtime information, source hashes, preserved baseline hashes, case results, selected observations, and explicit limits. Wall time is replay telemetry rather than a benchmark.

The delivery model has one local worker and deterministic synchronous fault injection. The provider simulator retains deduplication keys indefinitely. The reopen case closes and reopens SQLite connections after an injected crash point; it does not kill an operating-system process. No HTTP route, UI, real provider, network partition, concurrent lease, multiregion database, deployment, or customer notification is exercised.

The audit triggers reject ordinary `UPDATE` and `DELETE` statements, but a privileged database owner can remove those protections. The outbox demonstrates one acceptance with stable event identity under the represented acknowledgment-loss sequence. It does not establish a universal exactly-once guarantee.
