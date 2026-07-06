# Corpus Closure 9rnq

Date: 2026-07-06
Bead: `mise-en-palace-9rnq`

## Change

`krn source decision gaps` now resolves the same connected repo project as
`krn source search` when no explicit `--project` is supplied. The readback also
separates pending proposed SourceClaims from proposed SourceClaims with explicit
SourceRejection disposition.

The connected project is:

```txt
7d9d103a-1a8e-4492-a4ca-db3a5589bd9b
```

## Corpus State

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn source decision gaps --json
```

Result:

```txt
acceptedSourceClaimCount: 8
linkedSourceClaimCount: 8
missingDecisionEdgeCount: 0
unadoptedSourceClaimCount: 11
resolvedUnadoptedSourceClaimCount: 11
pendingUnadoptedSourceClaimCount: 0
```

The 11 proposed claims were not adopted as governing decisions. They were
explicitly rejected through `krn source claim reject --persist` as duplicate,
stale, or unsupported historical/target/dogfood claims.

## Canonical Query Proof

Each query used:

```sh
pnpm --filter @krn/cli krn source search --limit 10 --max-inclusions 3 --json
```

Top-three readback:

```txt
worker executor:
1. 3363383c linked bounded loop before crawler/dashboard/API/MCP/worker daemon
2. e4bfcdea linked second bounded artifact flow before product surfaces
3. 1ca09411 linked workers are candidate maintenance contracts, not Codex exec

dashboard/API/MCP:
1. 3363383c linked bounded loop before crawler/dashboard/API/MCP/worker daemon
2. e4bfcdea linked second bounded artifact flow before product surfaces

unknown-first input boundary:
1. 3338f14b linked unknown-first external input boundary
2. 125366b1 linked retained KRN knowledge source-to-decision gate
3. 931e7faa linked graph brain SourceClaimEdge candidates

bounded loop before product surfaces:
1. 3363383c linked bounded loop before product surfaces
2. e4bfcdea linked second bounded artifact flow
3. a6091d25 linked source-to-decision retention gate

source authority:
1. 7769dfc9 linked temporal relation boundary
2. 125366b1 linked retained KRN knowledge source-to-decision gate
3. 931e7faa linked graph brain SourceClaimEdge candidates

feedback/forget:
1. 1ca09411 linked governed RAG memory/source/review/feedback layer
2. e4bfcdea linked second bounded artifact flow
3. 125366b1 linked retained KRN knowledge source-to-decision gate
```

## Proof

Proves:

- the default source decision gaps readback now scans the connected repo project;
- accepted SourceClaims in that project all have SourceDecisionEdge support;
- remaining proposed claims have explicit rejection dispositions;
- canonical source-search queries surface linked governing claims in top three.

Does not prove:

- source truth;
- broad ranking quality;
- that rejected proposed claims are false;
- product readiness;
- Memory Core mutation safety;
- worker runtime readiness.
