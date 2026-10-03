# Northstar bounded context map

Paths below are relative to an isolated task checkout copied from the baseline.

| Path | Why it matters |
|---|---|
| src/app.ts | Session/membership authority and list query |
| src/db.ts | Fixture data, normalized UTC dates and injectable clock |
| src/main.tsx | Toggle/request loading, error and empty state |
| test/baseline.test.ts | Original preserved behavior |
| package.json / package-lock.json | Exact runtime scripts and dependency state |
| External edition verification/acceptance.ts | Eight requested-change checks, outside candidate edit scope |

The baseline deliberately lacks overdue filtering. A deadline is overdue only if non-null, strictly earlier than the injected clock, status is not done, project is not archived and authorized organization membership holds. Missing/false keeps unfiltered behavior; invalid query values return 400. No schema change is needed. Never confuse the historical completed candidate with this starting state.

Output map: templates/C-context-packet-blank.md at edition root. The Appendix C AGENTS.md worked example is templates/C-AGENTS-pattern-filled.md; it is distinct from the context packet. Code lessons and recorded agent experiments carry different evidence labels.
