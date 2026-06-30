# IMR-14 Brain Search Linked Document Summary

Status: complete.

Issue: `mise-en-palace-s54`.

## Executive Verdict

`krn brain search` now preserves source-search linked-document evidence in its
source summary. The live DB-backed query still has `5` supporting SourceClaims
and `0` included lexical SearchDocuments, but brain-search now shows
`sourceClaimDocumentLinks: 5` and `linkedSearchDocuments: 5`. This closes the
IMR-13 downstream visibility gap without changing schema, crawler, ranking,
worker runtime, API/MCP, source truth, or Memory Core behavior.

## Scope

Changed:

- `packages/cli/src/runBrainSearchCommand.ts`
- `packages/cli/src/runBrainSearchCommand.test.ts`

No DB schema, crawler, ranking rewrite, worker daemon, API/MCP, source truth, or
Memory Core mutation was added.

## Source-To-Decision

- Source: IMR-13 report and live brain-search/source-search readback.
- Mechanism: `source-search` answer packages can expose
  `sourceClaimDocumentLinks` even when included lexical `supportingDocuments`
  is zero.
- KRN implication: `brain-search` summaries must preserve linked-document counts
  and caveats so pattern gates and acquisition readbacks do not understate
  available evidence.
- Decision: parse `sourceClaimDocumentLinks` from source-search JSON and expose
  `sourceClaimDocumentLinks`, `linkedSearchDocuments`, and
  `sourceClaimDocumentLinkCaveats` in `sourceSearch`.
- Rejection: no schema, crawler, ranking, worker, API/MCP, source truth, or
  Memory Core mutation.
- Consumer: brain-search source summaries, pattern application gates,
  acquisition readbacks, and operator review.
- Falsifier: a brain-search summary with supporting SourceClaims and linked
  SearchDocuments reports only zero documents with no linked-document count or
  caveat.

Applied retained pattern:

- `ts-boundary-unknown-first-result-state`: source-search JSON is external CLI
  readback and is narrowed locally from `unknown` without `any`.

## Behavior

New brain-search `sourceSearch` fields:

```txt
sourceClaimDocumentLinks
linkedSearchDocuments
sourceClaimDocumentLinkCaveats
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
linkedSearchDocuments: 5
missingEvidence: included SearchDocument evidence for this combined query; artifact-linked SearchDocuments are visible but were not included by lexical retrieval
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm --filter @krn/cli test -- runBrainSearchCommand` | passed | focused CLI behavior covers linked document summary readback | live DB data quality |
| `rtk pnpm run typecheck` | passed | strict TypeScript boundaries compile | semantic usefulness |
| `rtk pnpm quality:fallow:ci` | passed | changed JS/TS files are clean under Fallow changed-file gate | product readiness |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | full workspace tests pass locally | CI or source truth |
| `rtk pnpm db:ready` | passed | current-shell Postgres is reachable with migrations and pgvector | remote/CI DB state |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn brain search --query "Local artifact preview can carry governed source claims" --store-only --limit 5 --max-inclusions 5 --json` | passed | live brain-search JSON exposes linked document counts from source-search readback | ranking quality, source truth, or product readiness |
| `rtk git diff --check` | passed | no whitespace diff errors | behavior correctness |

## Review Burden Delta

Before: downstream brain-search consumers could see `supportingDocuments: 0`
and miss that source-search had artifact-linked document evidence for the same
supporting claims.

After: the same source summary exposes linked-document counts and any caveats in
one readback.

Delta: reduced for pattern gates and acquisition evidence follow-up.

## Candidate Output

EvalCandidate:

- Claim: brain-search source summaries should preserve source-search
  `sourceClaimDocumentLinks` counts and caveats.
- Evidence refs: this report, focused CLI regression, live DB brain-search
  readback.
- Does not prove: source truth, ranking quality, broad retrieval quality, or
  product readiness.
- Reviewability: ready.

## Next Action

Run the next bounded product-facing brain task using the now-visible linked
document evidence as part of acquisition/pattern gating. Do not open a crawler,
schema, ranking, API/MCP, worker, or Memory Core slice unless the readback
falsifies this narrower path.
