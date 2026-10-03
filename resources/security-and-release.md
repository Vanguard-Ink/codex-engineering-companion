# Dependency and release readiness

The original authoring baseline/candidate source, lockfiles and historical experiment records remain protected. The reader derivative keeps application source behavior unchanged while pinning direct dependency versions and updating lockfiles separately. These modernized locks do not retroactively describe the historical run.

The 2026-10-03 npm audit on copied historical locks identified four moderate affected packages: fastify, fast-uri, vitest and @vitest/mocker; no high or critical entries. Reader-only repair uses Fastify 5.12.5 and Vitest 4.1.11 plus compatible fast-uri transitive lock updates. Retained reports before/after and clean-replay receipts live in the authoring QA/completion/repository directory. An audit result is a time-bounded advisory check, not production security approval.

The release package excludes node_modules, dist, generated SQLite files, temporary local evidence, raw authoring JSONL/stderr and credentials. Selected historical records retain original dates/configuration; invocation is clearly labeled a derivative with only author-local paths redacted. The raw original's SHA256 remains in provenance. No account/API credentials or model calls belong in default setup, replay or CI.

Open publisher gates: public repository account/name/visibility; approved code/documentation license; final edition date and release/tag; acceptance of reader/manuscript mapping. Hosted CI has not run simply because replay.yml exists. A local release commit/tag/archive may be prepared for review, but no remote publication is performed.

Browser smoke runs separately and records its source hashes, Chrome/Chromium version, nine checks and seven screenshots. Injected loading/error/empty responses are deterministic teaching tests. They neither prove a historical browser run nor certify production reliability.
