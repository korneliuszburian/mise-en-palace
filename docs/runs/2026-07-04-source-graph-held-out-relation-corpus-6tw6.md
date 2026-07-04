# Source Graph Held-Out Relation Corpus 6TW6

Bead: `mise-en-palace-6tw6`

## Change

`eval:source-graph-ranking` now has a query-level corpus split:

- `main`: existing compact source graph ranking corpus;
- `held_out`: two relation-shape queries not counted as main-corpus examples.

The held-out split covers:

- incoming relation support: `qualifies`;
- outgoing relation support: `depends_on`.

The eval reports held-out query count, held-out hit-rate@K, held-out NDCG@K,
held-out relation-shape case count, held-out relation kinds, and flat
no-relation comparison.

## Proof

Proves:

- source-search still selects expected proxy-labeled source rows in top-k;
- relation-linked cases are weaker when SourceClaimEdge support is removed;
- held-out relation-shape queries are reported separately from the main corpus;
- two held-out relation kinds are covered with flat comparison readback.

Does not prove:

- source truth;
- broad semantic ranking quality;
- live pgvector quality;
- graph database need;
- crawler/API/MCP readiness;
- product readiness.

## Verification

```sh
pnpm --filter @krn/cli test -- sourceGraphRankingEval
pnpm eval:source-graph-ranking
```
