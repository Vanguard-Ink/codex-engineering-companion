# Compatibility and evidence boundaries

Edition candidate: `1.0.0-rc.1`; final publication version/date pending.

| Surface | Boundary |
|---|---|
| Local replay | Windows x64; Node 24.19.0; Python version in actual retained receipt |
| npm dependency tree | Per-application package-lock.json; exact versions resolved by npm ci |
| Other OS / Node majors | NOT_TESTED; do not infer support from portable-looking code |
| Historical Codex run | One recorded 2026-09-06 run, CLI 0.153.4, retained user configuration |
| Optional Codex guide | Official docs and local help checked 2026-10-03; CLI 0.160.0 help; no new model execution |
| Browser UI | Manual route documented; HTTP contract and source label checks are not rendered UI QA |
| Chapter 14 / 15 | Standalone local domain/outbox lessons; no HTTP/UI integration or external provider |
| Recovery | Injected exception, close/reopen SQLite files; no real process kill, multi-worker leasing or global exactly-once proof |
| Economics | Assigned illustrative USD inputs; no current product prices or human comparison measured |
| Hosted CI | Workflow supplied; NOT_EXECUTED until actual hosted run evidence exists |

Installed CLI help confirms a local surface; first-party docs support the invocation pattern. Future CLI versions and moving online documentation can differ. Preserve the edition tag and verify help before optional account-dependent use. The Northstar CLI proposed in earlier editorial ideas has not been implemented; the actual supported commands are npm scripts listed in README. Do not run invented `northstar` commands.
