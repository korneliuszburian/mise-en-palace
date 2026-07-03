# Source Search Graph Readback Extract

Date: 2026-07-03

## Change

Extracted source-search graph/document readback helpers from
`sourceSearchReadback.ts` into focused modules:

- `sourceSearchGraphReadback.ts` owns SourceClaim document links,
  SourceClaimEdge relation support, and graph summary construction;
- `sourceSearchMetadata.ts` owns the shared metadata string guard;
- `sourceSearchReadback.ts` remains the answer-package/text/JSON renderer.

`runSourceSearchCommand.ts` now imports graph/document builders from the graph
readback module instead of the renderer.

## Proof

```sh
pnpm --filter @krn/cli test -- runSourceSearchCommand
pnpm -C packages/cli typecheck
pnpm quality:fallow:ci
```

## Non-Proof

This does not prove source truth, graph retrieval quality, or better ranking.
It only narrows the source-search runtime boundary while preserving current
readback behavior.
