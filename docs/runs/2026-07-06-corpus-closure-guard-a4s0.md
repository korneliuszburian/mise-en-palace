# Corpus Closure Guard (`a4s0`)

## Outcome

Added `eval:corpus-closure`, a dogfood-DB guard for the connected project source
corpus.

The guard runs the product command surfaces directly:

- `krn source decision gaps --json`
- six canonical `krn source search --json` readbacks

It fails if:

- `acceptedSourceClaimCount` is `0`, because an empty accepted corpus must not
  pass as clean closure;
- `pendingUnadoptedSourceClaimCount` is not `0`;
- accepted SourceClaims are missing SourceDecisionEdge readback;
- any canonical query lacks a SourceDecisionEdge-linked SourceClaim in the top 3
  supporting claims.

Scripts added:

- root `eval:corpus-closure`
- package `@krn/cli` `eval:corpus-closure`

## Local Dogfood Result

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm eval:corpus-closure
```

Result:

```txt
status: pass
projectId: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b
acceptedSourceClaimCount: 8
linkedSourceClaimCount: 8
missingDecisionEdgeCount: 0
pendingUnadoptedSourceClaimCount: 0
```

Canonical query cases:

```txt
worker-boundary: pass, linkedTop3ClaimIds=3363383c-02d0-4e5a-9674-132c1bc41b51,e4bfcdea-d201-4e0f-9d73-94e200b9fe4f,1ca09411-31e7-4d25-ba48-76970b1455c6
surface-boundary: pass, linkedTop3ClaimIds=e4bfcdea-d201-4e0f-9d73-94e200b9fe4f,3363383c-02d0-4e5a-9674-132c1bc41b51,3338f14b-3b14-4c80-ab6a-ab3dfb8bdc34
unknown-first: pass, linkedTop3ClaimIds=3338f14b-3b14-4c80-ab6a-ab3dfb8bdc34,3363383c-02d0-4e5a-9674-132c1bc41b51,e4bfcdea-d201-4e0f-9d73-94e200b9fe4f
bounded-loop: pass, linkedTop3ClaimIds=e4bfcdea-d201-4e0f-9d73-94e200b9fe4f,3363383c-02d0-4e5a-9674-132c1bc41b51,a6091d25-aa66-47c6-9b79-b21b0ced76cb
source-authority: pass, linkedTop3ClaimIds=125366b1-8bd9-4092-92d8-1aa1d2ed46ae,a6091d25-aa66-47c6-9b79-b21b0ced76cb,3338f14b-3b14-4c80-ab6a-ab3dfb8bdc34
feedback-forget: pass, linkedTop3ClaimIds=125366b1-8bd9-4092-92d8-1aa1d2ed46ae,a6091d25-aa66-47c6-9b79-b21b0ced76cb,1ca09411-31e7-4d25-ba48-76970b1455c6
```

## Proof

Proves:

- the dogfood corpus is non-empty for accepted SourceClaims;
- the dogfood connected-project corpus currently has no pending unadopted
  SourceClaims;
- accepted SourceClaims in that corpus have SourceDecisionEdge readback;
- canonical source-search queries surface decision-linked authority in the top 3.

Does not prove:

- source truth;
- broad arbitrary-repo retrieval quality;
- Codex obedience;
- every future source-search query is decision-linked;
- dogfood DB state matches a fresh CI seed.

## Verification

```sh
pnpm --filter @krn/cli test -- corpusClosureSmoke
pnpm -C packages/cli typecheck
pnpm --filter @krn/cli typecheck:tests:clean
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm eval:corpus-closure
pnpm docs:lint
pnpm -r --workspace-concurrency=1 --if-present typecheck
pnpm test
pnpm quality:fallow:ci
git diff --check
```

## Second Opinion

`second-opinion-claude` first approved the logic, then blocked a staged-diff
review pack because the staged diff was invisible to the context builder. The
review was rerun on an inspectable pack and returned `approve_with_fixes`, LOW.

Accepted fixes:

- document that an empty accepted corpus cannot pass as clean closure;
- add a test proving the guard uses product readback order for "top 3" instead
  of re-sorting by score.

Rejected with local evidence:

- package script wiring was locally verified by the successful
  `pnpm eval:corpus-closure` run and is visible in the committed diff.
