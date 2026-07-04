# Source Graph Ranking Eval

Date: 2026-07-04

## Summary

Added `pnpm eval:source-graph-ranking`, a deterministic source/search graph
ranking proxy eval. The runner uses real `runSourceSearchCommand` composition
with fixture-backed SourceClaim, source-claim-to-SearchDocument link,
SourceDecisionEdge, and SourceClaimEdge readbacks.

## Proof

- Fixture: `tests/fixtures/source-graph-ranking/source-graph-ranking-eval.json`
- Runner: `packages/cli/src/runSourceGraphRankingEval.ts`
- Test: `packages/cli/src/__tests__/sourceGraphRankingEval.test.ts`
- Behavior matrix row: `docs/architecture/behavior-gate-matrix.md`

Baseline:

```txt
corpusRows: 20
queryCount: 15
hitRateAtK: 1
ndcgAtK: 1
answerRelationReadbackCases: 15
expectedHitRelationReadbackCases: 8
searchDocumentLinkReadbackCases: 15
sourceDecisionSupportCases: 15
```

## Non-Proof

This fixture is not production retrieval truth. It does not prove source truth,
broad semantic ranking quality, live pgvector retrieval quality, crawler
readiness, or product readiness. It proves only that known dogfood-derived
source graph rows remain visible in top-k through the current readback
composition.

## Verification

```sh
pnpm eval:source-graph-ranking
pnpm --filter @krn/cli test -- sourceGraphRankingEval
pnpm typecheck
pnpm eval:krn:smoke
git diff --check
```
