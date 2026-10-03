# Authoring tree to reader derivative

| Preserved authoring source | Edition candidate path | Transformation |
|---|---|---|
| Companion/Northstar/northstar | northstar | Application source copied unchanged; reader-only dependency lock modernized/pinned; original baseline unchanged |
| Companion/Northstar/experiments/candidate | experiments/candidate | Historical implementation source copied unchanged; reader-only dependency lock modernized/pinned |
| Companion/Northstar/verification | verification | External evaluator copied; standalone HTTP check added |
| Companion/Northstar/examples | examples | Copy |
| Companion/labs/ch04-06 | labs/ch04-06 | Obsolete companion/northstar lookup repaired to northstar; output goes to artifacts |
| Companion/labs/ch10-12/economics | labs/ch10-12/economics | Historical source lookup repaired to evidence/historical |
| Companion/labs/ch13-15 | labs/ch13-15 | Baseline imports/type-root paths repaired; output goes to artifacts |
| Companion/Northstar/experiments/run-01 | evidence/historical | Selected records; invocation paths explicitly redacted; raw JSONL/stderr/original invocation retained and hash-indexed |

No original lab/experiment records are overwritten by derivative execution. Readers need only this directory; node_modules/dist/generated databases are excluded from the package. Source diagrams remain in the book atlas; no unreviewed duplicate artwork is asserted to be accepted publication figures.
