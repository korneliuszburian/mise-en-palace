# Source Search Candidate Readback Extract

Date: 2026-07-03

## Change

Extracted candidate-level source-search readback from
`sourceSearchReadback.ts` into `sourceSearchCandidateReadback.ts`.

Moved responsibilities:

- SourceClaim/SearchDocument candidate reviewability;
- included/excluded candidate text formatting;
- candidate metadata projection for JSON answer packages;
- SourceDecisionEdge support caveat attachment for source-claim candidates.

`sourceSearchReadback.ts` now keeps answer-package assembly and text/JSON
rendering.

## Proof

```sh
pnpm --filter @krn/cli test -- runSourceSearchCommand
pnpm -C packages/cli typecheck
pnpm quality:fallow:ci
```

## Non-Proof

This does not prove source truth, retrieval quality, or ranking quality. It
only narrows the source-search rendering boundary while preserving current
readback behavior.
