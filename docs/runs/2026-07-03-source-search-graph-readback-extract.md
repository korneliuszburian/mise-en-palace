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
pnpm --filter @krn/harness test -- contextHygieneInvariants
git diff --check
```

CI run `28686571065` passed for commit
`113080dee94fe95f45b64e78624ad440f20d9715`.

## Second Opinion

`second-opinion-claude` reviewed the committed diff against base
`11ad0ad6db40b4b4254f805ab8c33fbe7b704f10`.

Verdict: `approve`, risk `LOW`, no findings or evidence gaps.

## Non-Proof

This does not prove source truth, graph retrieval quality, or better ranking.
It only narrows the source-search runtime boundary while preserving current
readback behavior.
