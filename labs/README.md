# Runnable lab guide

Start inside repository root after `npm run setup`. The scripts below use fixtures, not new agent/model calls.

## Chapters 4–6: contract, context, contradiction

Setup: read B/C filled templates; baseline is the unfiltered app. Run `npm run workflow:ch04`. Expected: deadline-only selects active/completed/archived; excluding done leaves active/archived; excluding archived leaves active. Two conflicts occur in broken instruction fixtures; none in repaired fixtures. `artifacts/ch04-06-results.json` records results and baseline file hashes.

Diagnosis: an underspecified predicate is insufficient; unrelated contradictory instructions must be resolved before the task. Repair: use the fully specified contract and one instruction per condition. Recovery: `workflows/fail-repair.mjs` saves an authored fixture checkpoint, demonstrates the wrong selection and replays the corrected predicate. Inspect `artifacts/fail-repair/result.json`. Reset: rerun; it reconstructs the same starting rows without touching either app.

## Chapters 10–12: economics, evaluation, evidence

Run `python labs/ch10-12/economics/illustrative_economics.py` or `npm run labs`. Expected assigned arithmetic: 63 versus 46, assigned saving 17; adding twelve minutes of review changes delegated cost to 64. Nine reuses break even; ten first produce positive assigned savings. All figures are fabricated instructional inputs; the historical run fields are read separately from immutable records. Human attention and dollar cost remain null.

If historical assertions fail, investigate edition/data mismatch; do not rewrite records to match prose. Reset: calculations have no durable state. For evaluation, run `npm run workflow:ch12`: eight candidate checks must pass; inspect external evaluator JSON and raw log. A missing report or infrastructure exception is FAIL. Use G template to assemble the report, scope and untested gates.

## Chapters 13–15: access, audit, failure/recovery

Run `node labs/ch13-15/run-labs.ts` or `npm run labs`. Starting state: fresh SQLite fixtures for each check, with explicitly inserted editor/viewer/admin/owner roles; the baseline is unchanged. Expected output: Chapter 14 permission/audit checks and Chapter 15 deterministic outbox/recovery checks pass. Logs and report are stored in `artifacts/case-labs/`.

Important observations: audit-insertion failure rolls back task mutation; naive retry accepts two deliveries after lost acknowledgment; stable-key outbox retry accepts one; payload conflict/retry budget quarantine; close/reopen retains queue/dedupe state. Diagnosis is represented by each assertion and `observations` in the JSON. Repair means the isolated lab implementation, not a claim that the baseline app now implements role mutations or background workers. Recovery uses injected exception plus SQLite close/reopen, not process termination. Reset: rerun to build fresh in-memory fixtures and a separate file-backed recovery directory; retain prior evidence.

If Node cannot load TypeScript or node:sqlite, use the edition's Node 24 runtime. If a source import fails, check repository root and migration-map; do not repair a historical baseline to make a lesson pass. Single-worker simulator, no provider network, no identity integration, no production durability/throughput promise.
