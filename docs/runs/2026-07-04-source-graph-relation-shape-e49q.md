# Source Graph Relation Shape Coverage

Bead: `mise-en-palace-e49q`

## Change

`eval:source-graph-ranking` now reports relation-shape readback for three
SourceClaimEdge kinds: `supports`, `duplicates`, and `invalidates`.

The fixture grew from 20 rows / 15 queries / 5 relations to 23 rows / 18 queries
/ 8 relations. Each new relation-shape case is relation-linked, includes an
expected relation kind, and compares the linked source-search path against a
flat no-relation path.

## Proof

Local verification:

```sh
pnpm --filter @krn/cli test -- sourceGraphRankingEval
pnpm eval:source-graph-ranking
```

The eval output reports:

- `relationShapeCaseCount: 3`;
- `relationShapeCoveredCases: 3`;
- `relationShapeKinds: ["duplicates", "invalidates", "supports"]`;
- `relationLinkedCaseCount: 4`;
- `flatBaselineWeakerCases: 4`;
- each new relation-shape case has flat comparison
  `weakness: "missing_expected_relation_support"`.

Second-opinion-claude review:

- R1: `approve_with_fixes`, `LOW`; accepted fixes for case-level
  `relationKinds` assertions, proof-string derivation, and minimum required
  relation-shape coverage in the eval status gate.
- R2: `approve_with_fixes`, `MEDIUM`; accepted isolated regression test for
  missing required relation-shape kinds while hit-rate and flat comparison still
  pass.
- R3: `approve_with_fixes`, `LOW`; accepted explicit NDCG assertion in the
  isolated regression test. No further review loop was run.

## Non-Proof

This proves deterministic relation-shape readback coverage for one compact
fixture. It does not prove broad source graph ranking quality, source truth,
live pgvector quality, graph database need, crawler/API/MCP readiness,
autonomous memory evolution, or product readiness.
