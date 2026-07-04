# Memory Source Contribution Ablation

Bead: `mise-en-palace-6k4x`

## Change

`pnpm eval:memory-advantage` now reports source contribution readback for every
memory-advantage case. Each case is rerun with SourceClaim/SearchDocument
inputs disabled while keeping memory cards available.

Current readback:

- source-disabled ablation cases: 17
- source-required hits: 15
- no-source-selected cases: 2
- zero-delta source cases: 0
- source prune candidates: 0

Each case reports:

- selected source claim ids;
- source-disabled result, selected knowledge ids, selected memory ids, and
  selected-context size;
- contribution class;
- zero-delta source ids;
- prune candidate source ids;
- proof/non-proof text.

## Proof

- The memory-advantage eval now represents a source-disabled ablation instead
  of only reporting selected source ids.
- Current corpus behavior is inspectable: most KRN hits lose the hit without
  source evidence, while current source prune candidates are zero.
- Neutral/no-advantage cases remain visible and can still be source-required in
  the KRN path.

## Non-Proof

- Does not prove source truth.
- Does not prove production retrieval quality.
- Does not prove latency or token-cost optimality.
- Does not prove a zero-delta/noise source should be deleted automatically.
- Does not prove live Codex execution or product readiness.

## Verification

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval codexOutputComparatorEval
pnpm eval:memory-advantage
pnpm run typecheck
pnpm quality:fallow:ci
pnpm eval:krn:smoke
pnpm docs:lint
git diff --check
```
