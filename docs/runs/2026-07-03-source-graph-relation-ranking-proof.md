# Source Graph Relation Ranking Proof

Date: 2026-07-03

## Verdict

Source-search now has a focused proof that an `invalidates` SourceClaimEdge can
change selected support: the current claim is included, the stale claim is
excluded with source-graph rank-down evidence, and JSON readback exposes the
relation support plus graph summary.

## Behavior Proven

- An accepted current SourceClaim with an `invalidates` edge to a stale peer is
  selected when the inclusion budget is one.
- The stale peer is excluded with `Source graph rank-down` and a negative
  graph score.
- `answerPackage.relationSupport` exposes the `invalidates` edge for the
  included claim.
- `answerPackage.graphReadback` reports graph awareness and one invalidation
  edge.
- A raw `SourceClaimEdge.metadata.sourceDecisionRef` remains relation metadata;
  it does not create validated `SourceDecisionEdge` support.

## Proof

- `pnpm --filter @krn/cli test -- runSourceSearchCommand`

## Non-Proof

This does not prove source truth, edge correctness, graph traversal quality,
global activation ranking quality, external retrieval quality, or product
readiness. It proves one bounded source-search JSON readback path where relation
evidence changes selected support and preserves decision-support caveats.
