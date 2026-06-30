# IMR-13 Source Claim Document Link Readback

Status: complete.

Issue: `mise-en-palace-d8u`.

## Executive Verdict

`krn source search` now distinguishes missing included lexical documents from
artifact-linked SearchDocument evidence that already exists for supporting
SourceClaims. The live IMR-12 query still returns `5` supporting SourceClaims
and `0` included SearchDocuments, but the answer package now exposes `5`
`sourceClaimDocumentLinks` and linked SearchDocument ids. This reduces review
burden without changing source truth, ranking, schema, crawler, worker runtime,
API/MCP, or Memory Core behavior.

## Scope

Changed:

- `packages/db/src/repositories/DrizzleRetrievalRepository.ts`
- `packages/db/src/repositories/DrizzleRetrievalRepository.test.ts`
- `packages/cli/src/databaseRuntime.ts`
- `packages/cli/src/runSourceSearchCommand.ts`
- `packages/cli/src/runSourceSearchCommand.test.ts`

No DB schema, crawler, ranking rewrite, worker daemon, API/MCP, source truth, or
Memory Core mutation was added.

## Source-To-Decision

- Source: IMR-12 report, live source-search readback, current DB-linked
  SearchDocument rows.
- Mechanism: SourceClaims can share `sourceArtifactId` / `sourceChunkId` /
  `sourceClaimId` links with SearchDocuments even when lexical retrieval does
  not include those documents for the current query.
- KRN implication: source-search answer packages must show linked document
  evidence or a caveat so operators do not confuse "not included by lexical
  query" with "no document evidence exists."
- Decision: expose `sourceClaimDocumentLinks` in source-search answer packages.
- Rejection: no schema, crawler, ranking rewrite, worker, API/MCP, source truth,
  or Memory Core mutation.
- Consumer: source-search answer packages, brain-search summaries, acquisition
  candidates, and operator review.
- Falsifier: a claim-text source search with supporting SourceClaims and linked
  SearchDocuments still reports only zero documents with no linked refs/caveat.

Pattern gate: retained brain-knowledge queries for `source search artifact
linked document evidence claim readback` and `graph relation readback source
evidence` returned zero matches. No new retained pattern was adopted.

## Behavior

New answer-package field:

```txt
sourceClaimDocumentLinks:
  sourceClaimId
  sourceArtifactId?
  sourceChunkId?
  linkedSearchDocumentCount
  linkedSearchDocumentIds
  linkKinds
  caveat?
```

Live DB readback for:

```txt
Local artifact preview can carry governed source claims
```

returned:

```txt
supportingClaims: 5
supportingDocuments: 0
sourceClaimDocumentLinks: 5
linkedDocs: 5
answerUsefulness: partly_useful_missing_document
missingEvidence: included SearchDocument evidence for this combined query; artifact-linked SearchDocuments are visible but were not included by lexical retrieval
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm --filter @krn/cli test -- runSourceSearchCommand` | passed | focused CLI behavior covers linked document readback | DB state or ranking quality |
| `rtk pnpm --filter @krn/db test -- DrizzleRetrievalRepository` | passed | DB adapter exposes the read path | live DB data quality |
| `rtk pnpm run typecheck` | passed | TypeScript boundaries compile | semantic usefulness |
| `rtk pnpm quality:fallow:ci` | passed | changed JS/TS files are clean under Fallow gate | product readiness |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | full workspace tests pass | CI or DB runtime truth |
| `rtk pnpm db:ready` | passed | current-shell Postgres is reachable with migrations and pgvector | remote/CI DB state |
| `rtk krn source search ... --json` | passed | live answer package exposes linked docs for the IMR-12 query | source truth or ranking quality |
| `rtk git diff --check` | passed | no whitespace diff errors | behavior correctness |

## Review Burden Delta

Before: the operator saw `5` claims and `0` documents and needed separate DB
queries to discover that selected claims had artifact-linked SearchDocuments.

After: the answer package shows the linkage in the same readback. The package
still honestly marks included lexical SearchDocument evidence as missing.

Delta: reduced for source/evidence follow-up review.

## Candidate Output

EvalCandidate:

- Claim: source-search answer packages should show linked document refs when
  supporting SourceClaims share artifact/chunk/claim links with SearchDocuments.
- Evidence refs: this report, focused CLI regression, live source-search readback.
- Does not prove: source truth, ranking quality, broad retrieval quality, or
  product readiness.
- Reviewability: ready.

## Next Action

Created:

```txt
mise-en-palace-s54: Expose linked document evidence in brain-search source summaries.
```

Why: downstream brain-search/acquisition consumers can still understate source
evidence if they summarize only included `supportingDocuments` and ignore
`sourceClaimDocumentLinks`.
