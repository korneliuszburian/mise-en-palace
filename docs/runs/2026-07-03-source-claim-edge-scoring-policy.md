# SourceClaimEdge Scoring Policy Extraction

Date: 2026-07-03.

Beads: `mise-en-palace-xh86`.

## Change

Extracted source-graph scoring constants from
`packages/harness/src/activation/rankCandidates.ts` into
`packages/harness/src/activation/sourceClaimEdgeScoring.ts`.

The helper now owns:

- positive relation weights for every `SourceClaimEdge["kind"]`;
- rank-down relation kinds: `invalidates`, `expires`, `supersedes`;
- default graph influence score and rank-down penalty;
- shared proof-boundary strings for relation influence and rank-down metadata.

## Proof

Verification:

- `pnpm --filter @krn/harness test -- activation sourceClaimEdgeScoring`
- `pnpm -C packages/harness typecheck`
- `pnpm -w typecheck`
- `pnpm quality:fallow:ci`
- `git diff --check`

## Proof Boundary

Proves graph scoring policy is named, test-covered, and reviewable before more
relation ranking proofs are added.

Does not prove relation truth, broad graph retrieval quality, or that current
weights are globally optimal.
