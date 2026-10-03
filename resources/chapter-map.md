# Chapter and appendix map

All paths are relative to this repository root. Original prose/excerpt commands pointing to the old `companion/` topology must be updated to this edition map by editorial integration. Explanatory designs are not installed capabilities.

| Chapter | Reader artifact / command | Evidence boundary |
|---|---|---|
| 1 | `northstar/`, README onboarding | Local teaching architecture |
| 2 | `resources/compatibility.md` | Layer/framework discussion; no deployment claim |
| 3 | `npm run workflow:ch03`; `evidence/historical/` | Baseline 6/8 expected failure; candidate 8/8; historical run separate |
| 4 | `npm run workflow:ch04`; B template; `workflows/AGENTS.md.example` | Authored contract + deterministic counterexamples |
| 5 | C template; `labs/ch04-06/context-packet.md` | Bounded context worked example |
| 6 | `labs/ch04-06/labs.mjs`; `instruction-fixtures.json` | Contradiction diagnosis; not actual agent instruction precedence measurement |
| 7 | `workflows/AGENTS.md.example` | Example persistent guidance, not an installed skill |
| 8 | F templates; optional guide | MCP review checklist, no server configured/called |
| 9 | `workflows/fail-repair.mjs`; Chapter 15 outbox | Authored checkpoint + isolated recovery |
| 10 | `npm run labs`; economics exercise | Illustrative scheduling, no model comparison arms |
| 11 | K templates; economics exercise | Assigned inputs; historical unknown labor/cost retained |
| 12 | `npm run workflow:ch12`; G templates | External eight-check evaluator + actual output logs |
| 13 | `npm run labs`; F checklist | Local permission boundaries, not production security approval |
| 14 | `labs/ch13-15/access-audit.ts`, `run-labs.ts` | Domain roles/audit slice |
| 15 | `labs/ch13-15/outbox.ts`; L templates | Single-worker simulator and explicit operational gaps |
| Appendix B | `templates/B-task-contract-{blank,filled}.md` | Targeted overdue task |
| Appendix C | `templates/C-context-packet-{blank,filled}.md` | Authority/path/clock map |
| Appendix F | `templates/F-mcp-checklist-{blank,filled}.md` | No server provisioned; explicit NOT_TESTED fields |
| Appendix G | `templates/G-eval-record-{blank,filled}.md` | Output paths; filled example is instructional schema, attach actual receipt |
| Appendix K | `templates/K-economics-{blank,filled}.md` | Arithmetic fixture, not observed saving |
| Appendix L | `templates/L-maturity-{blank,filled}.md` | Teaching-only boundary assessment |

`verification/acceptance.ts` is controlled outside `experiments/candidate/`. An agent run must not edit it. Each release manifest hashes both the evaluator and fixtures so reader evidence can identify which edition inputs were used.
