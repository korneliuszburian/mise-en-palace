# Source Graph DB Ranking Readback

Bead: `mise-en-palace-c103`

## Change

`db:smoke:source-graph` now runs activation retrieval after persisting accepted
SourceClaims and an `invalidates` SourceClaimEdge. The smoke proves the stale
claim receives source-graph rank-down metadata through live DB repositories and
surfaces that readback in CLI output.

## Proof

Commands:

```sh
rtk pnpm -C packages/db typecheck
rtk pnpm -C packages/cli typecheck
rtk pnpm db:smoke:source-graph
```

Observed DB smoke readback:

```txt
Activation source candidates: 3
Source graph rank-downs: 1
Source graph rank-down edge kinds: invalidates
Source graph influences: 1
Source graph influence edge kinds: duplicates
Cleanup remaining marker count: 0
Source graph smoke: passed
```

## Non-Proof

This proves one DB-backed invalidation rank-down readback path. It does not prove
source truth, broad graph retrieval quality, ranking quality across larger
corpora, or product readiness.
