# Source Graph Duplicate DB Influence

Bead: `mise-en-palace-euv4`

## Change

`db:smoke:source-graph` now proves a second relation kind through live DB
activation retrieval. Alongside `invalidates` rank-down, the smoke persists a
`duplicates` SourceClaimEdge and verifies the connected SourceClaim receives
`sourceClaimEdgeInfluence` metadata.

## Proof

Commands:

```sh
rtk pnpm -C packages/db typecheck
rtk pnpm -C packages/cli typecheck
rtk pnpm db:smoke:source-graph
```

Observed DB smoke readback:

```txt
Source claim edges: 2
Activation source candidates: 3
Source graph rank-down edge kinds: invalidates
Source graph influence edge kinds: duplicates
Cleanup remaining marker count: 0
Source graph smoke: passed
```

## Non-Proof

This proves one DB-backed duplicate-edge influence readback path. It does not
prove source truth, duplicate correctness, broad graph retrieval quality, or
ranking quality across larger corpora.
