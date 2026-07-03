# Source Search Decision-Linked Ranking

Date: 2026-07-03
Bead: `mise-en-palace-zx0o`

## Objective

Make `krn source search` prefer decision-linked accepted SourceClaims over
accepted-only peers when ContextROI has to choose a small set of source
candidates.

## What Changed

`krn source search` now prefetches `SourceDecisionEdge` support for
authority-safe SourceClaim candidates before ContextROI. Candidates with
validated decision-edge readback receive a small explicit graph-score boost, and
the answer package still reports decision support only for candidates that were
actually included.

The boost is intentionally local to source-search readback. It does not rewrite
the global activation ranker or claim broad graph retrieval quality.

## Verification

```txt
pnpm --filter @krn/cli test -- runSourceSearchCommand: passed
pnpm --filter @krn/cli typecheck:tests:clean: passed
pnpm -w typecheck: passed
pnpm quality:fallow:ci: passed
git diff --check: passed
```

## Proof

The regression test creates two accepted SourceClaims with comparable relevance
and `maxInclusions: 1`. Only one claim has `SourceDecisionEdge` support. Source
search now includes the decision-linked claim and reports
`sourceDecisionSupportState: linked`.

## Non-Proof

This does not prove source truth, target correctness, global ranking quality,
graph retrieval quality, crawler readiness, worker runtime behavior, or product
readiness.

## Rollback Risk

Low. Runtime behavior becomes stricter only when a SourceClaim already has
validated decision-edge support. Accepted-only claims remain eligible and keep
their missing-link caveat when included.
