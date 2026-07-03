# Source Graph Duplicate Ranking Proof

Date: 2026-07-03.

Bead: `mise-en-palace-7hoy`.

## Scope

Extend source graph relation ranking proof beyond the existing
`invalidates`/`expires`/`supersedes` rank-down lane.

No taxonomy rewrite, benchmark lane, dashboard, API, MCP, worker daemon, or
source-truth claim was added.

## Current Proven Path

Existing source-search coverage already proves accepted `invalidates`
SourceClaimEdge readback can rank down stale source claims and expose graph
readback/caveats in JSON.

## Added Proof

Added a focused CLI source-search regression:

```txt
runSourceSearchCommand > lets duplicate SourceClaimEdge influence change source-search selection
```

The test compares the same three accepted SourceClaims with and without a
`duplicates` SourceClaimEdge:

- without the edge, the lexical-only claim is selected first;
- with the `duplicates` edge, the edge-connected peer claim is selected first;
- selected claim carries positive `graphScore`;
- reason includes `Edge-aware source graph context: duplicates.`;
- relation support exposes `kind: duplicates`;
- graph readback reports `duplicateEdges: 1` and `invalidationEdges: 0`.

## Verification

```txt
pnpm --filter @krn/cli test -- runSourceSearchCommand
pnpm --filter @krn/harness test -- contextHygieneInvariants
pnpm --filter @krn/cli typecheck:tests:clean
pnpm -w typecheck
pnpm quality:fallow:ci
git diff --check
```

## Proof Boundary

Proves:

- a non-invalidation relation shape can affect operator-facing source-search
  selection;
- the duplicate relation is visible in readback and proof caveats;
- the existing source authority and decision-link readbacks remain in place for
  this command surface.

Does not prove:

- duplicate truth;
- graph edge correctness;
- broad graph retrieval quality;
- DB-backed corpus-scale ranking quality;
- product readiness.
