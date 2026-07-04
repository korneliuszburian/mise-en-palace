# Source Prune Candidate Path

Bead: `mise-en-palace-5h7i`

## Change

The source contribution evaluator now exposes a small pure helper for source
prune candidate ids. Focused tests prove that `source_zero_delta` and
`source_noise` contribution classes populate `pruneCandidateSourceClaimIds`,
while required, memory-only, and no-source cases do not.

The current memory-advantage corpus still reports `sourcePruneCandidateCount=0`.
That now means the corpus observed no zero-delta/noise source contribution
cases, not that the prune-candidate path is unexercised.

## Proof

- `source_zero_delta` returns selected SourceClaim ids as prune candidates.
- `source_noise` returns selected SourceClaim ids as prune candidates.
- Non-prune contribution classes return no prune candidates.
- The current corpus readback remains honest at zero prune candidates.

## Non-Proof

- Does not prove source truth.
- Does not prove a prune candidate should be deleted automatically.
- Does not prove production ranking quality or latency/cost optimality.

## Verification

```sh
pnpm --filter @krn/cli test -- memoryAdvantageEval
pnpm eval:memory-advantage
pnpm run typecheck
pnpm quality:fallow:ci
git diff --check
```
