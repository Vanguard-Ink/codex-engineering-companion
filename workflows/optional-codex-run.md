# Optional new Codex run — account dependent

The default offline replay does not call Codex. This optional route needs an installed CLI, authenticated account, intentional budget and a separate writable task checkout. No new model run was performed when producing this candidate. Historical `run-01` remains one separate 2026-09-06 execution.

Official non-interactive documentation was read 2026-10-03: https://learn.chatgpt.com/docs/non-interactive-mode. Installed `codex-cli 0.160.0` help separately confirmed stdin `-`, `exec`, `--json`, `--ephemeral`, `--sandbox workspace-write`, `-C` and `-o`. Verify `codex --version` and `codex exec --help` for your installed version. `--full-auto` is a deprecated compatibility flag; use explicit sandbox. User configuration and parent instructions may apply; ephemeral mode is not a clean-room proof.

1. Create a new task checkout from the preserved baseline and install its lockfile. Keep the evaluator outside the writable task checkout. Do not point Codex at the edition repository root or historical candidate. Place a copy of `AGENTS.md.example` named `AGENTS.md` in that task checkout and record the resulting path/configuration in your run manifest.
2. Copy/fill B task contract and C context packet using paths relative to that checkout. Inspect inherited instructions and installed authentication; do not expose credentials to prompts, logs or repository-controlled environment files.
3. From the edition root, fill these paths before executing this explicitly account-dependent PowerShell command:

```powershell
$taskCheckout='ABSOLUTE_PATH_TO_SEPARATE_TASK_CHECKOUT'
$runDirectory='ABSOLUTE_PATH_TO_NEW_EVIDENCE_DIRECTORY'
New-Item -ItemType Directory -Path $runDirectory -ErrorAction Stop
Get-Content -Raw templates/B-task-contract-filled.md | Set-Content -Encoding utf8 "$runDirectory/prompt.md"
Get-Content -Raw "$runDirectory/prompt.md" | codex exec --json --ephemeral --sandbox workspace-write -C "$taskCheckout" -o "$runDirectory/final-message.txt" - > "$runDirectory/events.jsonl" 2> "$runDirectory/stderr.log"
$modelExit=$LASTEXITCODE
```

Directory creation stops if that path already exists. Choose a new run path to preserve prior evidence. The actual prompt file is saved before invocation; retain its SHA256 from `Get-FileHash "$runDirectory/prompt.md" -Algorithm SHA256` in the new run manifest.

4. Save version, configuration, prompt hash and exit code. Review the actual diff before acceptance. Run the task checkout's typecheck/test/build, then run the edition's external evaluator with candidate-installed tsx and an absolute checkout path:

```powershell
node experiments/candidate/node_modules/tsx/dist/cli.mjs verification/acceptance.ts "$taskCheckout" "$runDirectory/acceptance.json"
```

5. Compare results to B acceptance criteria, complete G eval record and retain failures honestly. Run browser interaction checks separately; do not infer UI quality from API checks. Do not edit the evaluator to match a candidate. Use the Git checkpoint/isolated checkout for rollback if the contract is violated.

The sample above intentionally needs explicit paths, authentication and a human's decision to start a new run. It is never called by setup, verify, labs or CI. A public companion URL/license/tag remains pending publisher input.
