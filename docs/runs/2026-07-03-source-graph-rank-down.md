# Source Graph Rank-Down

Date: 2026-07-03
Bead: `mise-en-palace-bllf`

## Objective

Use existing SourceClaimEdge graph relations to reduce source-search priority
for accepted claims that are invalidated, expired, or superseded by another
accepted SourceClaim.

## What Changed

Activation retrieval now applies a bounded SourceClaimEdge rank-down before
ranking source candidates. The rank-down only uses `invalidates`, `expires`, and
`supersedes` edges whose `fromSourceClaimId` belongs to an accepted SourceClaim.
It does not delete claims, mutate status, or create a graph engine.

`krn source search` receives this behavior through the existing retrieval path,
and its test runtime now supplies SourceClaimEdges to the compiler dependency
used by retrieval, not only to late answer-package readback.

## Verification

```txt
pnpm --filter @krn/harness test -- activation: passed
pnpm --filter @krn/cli test -- runSourceSearchCommand: passed
pnpm --filter @krn/cli typecheck:tests:clean: passed
```

## Proof

Focused tests prove:

```txt
accepted invalidating graph edges lower the stale target claim score
proposed invalidating claims do not gain authority to demote accepted claims
source search selects the current invalidating claim over the invalidated stale claim
```

## Non-Proof

This does not prove source truth, edge correctness, global graph retrieval
quality, crawler readiness, worker runtime behavior, or product readiness.

## Rollback Risk

Medium-low. Source search ordering becomes stricter for accepted claims targeted
by invalidation/expiration/supersession edges. The affected claims remain visible
as excluded candidates when budgeted out.
