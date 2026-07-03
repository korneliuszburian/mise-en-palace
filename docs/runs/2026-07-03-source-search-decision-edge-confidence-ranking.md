# Source Search Decision-Edge Confidence Ranking

Date: 2026-07-03
Bead: `mise-en-palace-a878`

## Objective

Refine the `zx0o` decision-linked ranking boost so source search distinguishes
high-confidence SourceDecisionEdge support from low-confidence support.

## What Changed

`krn source search` now computes the local decision-linked graph boost from
`SourceDecisionEdge.confidence` and whether the edge `supportType` is
decision-grade. The score remains local to source-search readback and still uses
the existing `SourceDecisionEdge` rows already fetched before ContextROI.

## Verification

```txt
pnpm --filter @krn/cli test -- runSourceSearchCommand: passed
pnpm --filter @krn/cli typecheck:tests:clean: passed
```

## Proof

Focused tests prove:

```txt
decision-linked accepted SourceClaims still outrank accepted-only peers
high-confidence decision-linked SourceClaims outrank low-confidence linked peers
answer-package SourceDecisionEdge support remains filtered to included claims
```

## Non-Proof

This does not prove source truth, target correctness, global activation ranking
quality, graph retrieval quality, worker runtime behavior, or product readiness.

## Rollback Risk

Low. The behavior only changes source-search ordering among accepted SourceClaim
candidates that already have SourceDecisionEdge readback.
