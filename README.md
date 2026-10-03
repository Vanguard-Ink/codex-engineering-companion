# Codex Engineering companion — edition release candidate

This repository supports a technical reader who can use Git, inspect diffs and run tests. Start with the three workflows below. All default commands are local deterministic checks; they use no Codex account or model API. Dependency installation needs npm registry access.

**Status:** local release candidate `1.0.0-rc.1`, proposed tag `codex-engineering-edition-1-rc1-review2`. Public URL, final edition date, license and final release/tag are **PUBLISHER INPUT REQUIRED**. This directory is the proposed repository root; do not run its commands from the book workspace root.

## Setup (Windows / PowerShell)

Use Node 24 with npm, Python 3.10+ for the economics exercise, and Git for optional change review. The retained verification uses Windows x64, Node 24.19.0 and the recorded Python version; other platforms are not yet claimed supported. Check `node --version`, `npm.cmd --version`, and `python --version` first.

Download/clone instructions will use the publisher's final URL/tag. For the local review package, open a terminal **inside this directory**:

```powershell
npm.cmd run setup
npm.cmd run workflow:ch03
npm.cmd run workflow:ch04
npm.cmd run workflow:ch12
npm.cmd run labs
npm.cmd run verify
```

The app lockfiles pin the exact dependency trees; `setup` runs `npm ci` for both applications. The root pins Playwright for optional browser smoke. Fresh logs and summary JSON go to `artifacts/<timestamp>-<workflow>/`. Read the summary, the evaluator JSON and individual logs together. A model process exit code alone does not establish acceptance.

## Three complete workflows

1. **Chapter 3 — distinguish baseline from candidate.** `workflow:ch03` runs both apps' typecheck, tests and builds, then an external evaluator. The baseline passes its original tests but intentionally fails two of the eight requested-change checks; this is `EXPECTED_BASELINE_FAIL`, only accepted if exactly those two checks fail without infrastructure errors. The preserved candidate passes all eight. A separate HTTP transport check exercises fixture sign-in and tenant isolation; it does not certify rendered UI quality.
2. **Chapter 4 — write a bounded contract and diagnose context.** Read `templates/B-task-contract-filled.md`, `templates/C-context-packet-filled.md` and `workflows/AGENTS.md.example`. Run `workflow:ch04`. Inspect deadline-only versus full-predicate selections and contradictory instruction fixtures. Then inspect `artifacts/fail-repair/result.json`: a deterministic authored failure is diagnosed, a saved checkpoint is restored, and the repaired predicate is asserted. No Codex failure is being claimed. The optional account-dependent agent route is in `workflows/optional-codex-run.md`.
3. **Chapter 12 — external evaluator to evidence package.** Run `workflow:ch12`; open its `ch12-external-evaluator.json` and `summary.json`. Complete `templates/G-eval-record-blank.md` using those actual results, keeping untested browser/production checks open. `npm.cmd run evidence` verifies the copied historical record hashes; that is historical evidence, not a new run.

Every workflow hashes the baseline before and after and rejects a change. Source originals remain separately preserved in the authoring project; candidate derivative path repairs are described in `resources/migration-map.md`.

## Try the local application

In PowerShell terminal 1, from this directory:

```powershell
$env:NORTHSTAR_DEMO='1'
$env:NORTHSTAR_FIXED_CLOCK='1'
npm.cmd --prefix experiments/candidate run server
```

In terminal 2:

```powershell
npm.cmd --prefix experiments/candidate run dev
```

Open the Vite URL printed in terminal 2 (normally `http://127.0.0.1:5173`). Sign in to the fictional Aster Studio workspace; the unfiltered list has seven tasks. Check **Overdue only**: with the fixed clock it should show Review navigation and Repair mobile menu. Switch it off to restore the list. Birch Labs should only expose its own workspace. For automated current browser smoke, run `npm.cmd run browser:install` once, then `npm.cmd run browser:smoke`. That separate check covers toggle/loading/error/empty/reset and organization isolation. Inspect its seven retained screenshots for visual quality; the default workflow runner covers HTTP/source checks. Ctrl+C stops each server. Restarting the API recreates fixtures, sessions and database. All servers bind to localhost; fixture sign-in is a teaching convenience.

## Labs, templates and troubleshooting

Read `labs/README.md` for starting states, exact commands, expected observations, diagnosis and reset. `resources/chapter-map.md` maps all 15 chapters. Blank and filled templates are in `templates/`, matching B = task contract, C = AGENTS.md patterns (with a separate context-packet supplement), F = MCP checklist, G = eval patterns, K = economics and L = maturity. `resources/compatibility.md` lists actual tested boundaries; `resources/security-and-release.md` records dependency review and remaining publication inputs.

If install fails, retain its error and verify registry/network/runtime; do not edit the baseline or lockfile to force acceptance. If `EXPECTED_BASELINE_FAIL` is absent, inspect the report: unexpected checks, thrown errors or missing files are failures, not successful teaching outcomes. If Python is not on PATH, set `$env:PYTHON` to its executable before `npm.cmd run labs`. Each run creates fresh in-memory fixtures; generated evidence may accumulate safely. Preserve logs for review. The scripts never delete source directories or rewrite a historical experiment record.

CI is provided in `.github/workflows/replay.yml`; a checked-in workflow is not a claim that hosted CI has run. Repository publication and final edition acceptance remain open; see the actual browser receipt for the current separately dated local UI smoke. If using an installed Chrome executable instead of a downloaded Playwright browser, set `$env:BROWSER_EXECUTABLE` to its verified executable path before `browser:smoke`.
