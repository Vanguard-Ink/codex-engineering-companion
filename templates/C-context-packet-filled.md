# Context packet — filled example

Task: overdue filter requested by B contract.
Authority: B semantics govern the new change. Existing code governs observed starting behavior. Documentation snippets must identify their date/surface.
Root: a separately prepared baseline task checkout; paths below are relative to that checkout.
Minimum files: src/app.ts (auth, membership, query); src/db.ts (fixtures, UTC normalized timestamps, injectable clock); src/main.tsx (client request/state); test/baseline.test.ts; package.json; package-lock.json.
External authority: edition verification/acceptance.ts, outside agent-writable checkout.
Clock: 2026-09-06T12:00:00.000Z; strict less-than, equality excluded.
Known defect: baseline ignores overdue; does not mean its authentication is broken.
Noise excluded: diagrams, unrelated outbox lessons, manuscript builds, historical JSONL.
Instructions: one package manager (npm), focused checks after edits, required checks before handoff. Diagnose conflicts rather than averaging them.
Commands: npm ci; npm run typecheck; npm test; npm run build within task checkout; external acceptance from edition root.
Provenance: take hashes/revision from edition resources/edition-manifest.json and actual checkout Git state, not a guessed commit.
Open gate: manual/browser loading/error/empty interaction is separate from eight API evaluator checks.
