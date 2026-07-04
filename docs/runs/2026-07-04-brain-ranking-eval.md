# Brain Ranking Eval

Date: 2026-07-04

## Summary

Added `pnpm eval:brain-ranking`, a deterministic 10-case proxy eval for
`krn brain search` selectedKnowledge ranking/readback. The gate runs real
`runBrainSearchCommand` composition with deterministic catalog/source child
readbacks and records hit-rate@5 plus NDCG@5.

## Proof

- Fixture: `tests/fixtures/brain-ranking/brain-ranking-eval.json`
- Runner: `packages/cli/src/runBrainRankingEval.ts`
- Test: `packages/cli/src/__tests__/brainRankingEval.test.ts`
- Behavior matrix row: `docs/architecture/behavior-gate-matrix.md`

The baseline passes with:

```txt
caseCount: 10
hitRateAtK: 1
ndcgAtK: 1
catalogBackedCases: 8
sourceBackedCases: 2
```

## Non-Proof

This is not a broad semantic ranking benchmark. It does not prove source truth,
LLM output quality, external target usefulness, or product readiness. It only
guards known dogfood-derived query shapes from losing expected selectedKnowledge
packets in top-k while the ranking/readback machinery evolves.

## Verification

```sh
pnpm eval:brain-ranking
pnpm --filter @krn/cli test -- brainRankingEval
pnpm typecheck
pnpm eval:krn:smoke
git diff --check
```
