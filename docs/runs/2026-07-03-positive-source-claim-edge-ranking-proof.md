# Positive SourceClaimEdge Ranking Proof

Date: 2026-07-03.

Beads: `mise-en-palace-5qmm`.

## Change

Added an operator-facing source-search JSON regression test for a positive
`supports` `SourceClaimEdge`.

The test proves:

- a lexical-only accepted claim wins without graph support;
- an edge-connected accepted peer wins when a `supports` edge is available;
- `relationSupport` exposes the edge kind, direction, and related seed claim;
- `graphReadback.relationKinds` includes `supports`;
- missing SourceDecisionEdge support remains explicit as a caveat.

## Verification

- `pnpm --filter @krn/cli test -- runSourceSearchCommand`
- `pnpm --filter @krn/cli typecheck:tests:clean`
- `pnpm -w typecheck`
- `pnpm quality:fallow:ci`
- `git diff --check`

## Proof Boundary

Proves positive SourceClaimEdge support can affect bounded source-search
selection and readback.

Does not prove source truth, support-edge correctness, broad GraphRAG quality,
or that every relation kind has the right weight.
