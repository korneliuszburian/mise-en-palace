# Brain Search Readback Boundary Split

Date: 2026-07-03
Bead: `mise-en-palace-y6ib`

## Change

Split brain-search selectedKnowledge and readback formatting out of
`runBrainSearchCommand.ts` into `brainSearchReadback.ts`.

`runBrainSearchCommand.ts` now owns runtime orchestration: run catalog readback,
run source search, build the preview resource, and return JSON/text. The new
module owns JSON narrowing, selectedKnowledge packet shaping, target-fit
summary, activation utility readback, source-search caveats, and text
formatting.

## Proof

Proves:

- brain-search output contract stayed stable under the split;
- source-search authority caveats still flow into brain-search readback;
- the command runner no longer owns selectedKnowledge packet/view logic.

Does not prove:

- selectedKnowledge ranking quality;
- semantic search quality;
- source truth;
- Memory Core mutation;
- product readiness.

## Verification

Passed:

```sh
pnpm --filter @krn/cli test -- runBrainSearchCommand
pnpm -C packages/cli typecheck
pnpm quality:fallow:ci
git diff --check
pnpm --filter @krn/cli typecheck:tests:clean
pnpm -w typecheck
```
