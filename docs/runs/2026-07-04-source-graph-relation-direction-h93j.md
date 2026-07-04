# Source Graph Relation Direction Readback

Bead: `mise-en-palace-h93j`

## Change

`pnpm eval:source-graph-ranking` now reports relation direction coverage for
controlled source-search graph cases. Fixture queries can declare expected
`incoming` or `outgoing` SourceClaimEdge direction readback, and the eval status
fails if the expected direction is not observed for the expected source-claim
hit.

The held-out relation split now covers:

- incoming `qualifies` support;
- outgoing `depends_on` support.

## Verification

```sh
rtk pnpm --filter @krn/cli test -- sourceGraphRankingEval
rtk pnpm eval:source-graph-ranking
```

Both passed locally on 2026-07-04.

## Proof Boundary

Proves:

- source-search relation readback exposes expected and observed relation
  directions for the controlled fixture;
- the eval fails when relation kind is present but expected direction coverage is
  incomplete;
- the held-out split includes both incoming and outgoing direction cases.

Does not prove:

- source truth;
- broad semantic ranking quality;
- live pgvector retrieval quality;
- graph database need;
- autonomous memory evolution;
- crawler/API/MCP/product readiness.
