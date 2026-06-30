# IMR-15 Linked Document Acquisition Readback

Status: complete.

Issue: `mise-en-palace-u8e`.

## Executive Verdict

Heartbeat acquisition candidates now preserve brain-search linked-document
evidence. A live DB-backed flow produced brain-search JSON with `5` supporting
SourceClaims, `0` included lexical SearchDocuments, `5`
`sourceClaimDocumentLinks`, and `5` linked SearchDocuments; heartbeat preview
then emitted a review-ready `knowledge_acquisition_candidate` that carried the
same linked-document evidence. This reduces review burden without changing
schema, crawler, ranking, worker runtime, API/MCP, source truth, or Memory Core
behavior.

## Scope

Changed:

- `packages/workers/src/knowledgeAcquisitionHeartbeatPreview.ts`
- `packages/workers/src/knowledgeAcquisitionHeartbeatPreview.test.ts`
- `packages/cli/src/runHeartbeatPreviewCommand.ts`
- `packages/cli/src/runHeartbeatPreviewCommand.test.ts`

No DB schema, crawler, ranking rewrite, worker daemon, API/MCP, source truth, or
Memory Core mutation was added.

## Source-To-Decision

- Source: IMR-14 report and live brain-search/heartbeat preview readback.
- Mechanism: brain-search source summaries can carry `sourceClaimDocumentLinks`
  and `linkedSearchDocuments` while still reporting missing included lexical
  SearchDocument evidence.
- KRN implication: heartbeat knowledge-acquisition candidates must preserve that
  linked-document evidence so operators can distinguish "no document evidence"
  from "document evidence exists but was not included by lexical retrieval."
- Decision: add optional `linkedDocumentEvidence` to acquisition requests and
  candidates, populated from brain-search JSON.
- Rejection: no source-search direct-link expansion, schema, crawler, ranking,
  worker, API/MCP, source truth, or Memory Core mutation.
- Consumer: heartbeat acquisition readback, operator review, and future
  candidate review/evidence closure.
- Falsifier: a brain-search readback with linked document evidence creates a
  heartbeat acquisition candidate that only reports missing documents and omits
  linked-document counts/caveats.

Applied retained pattern:

- `ts-boundary-unknown-first-result-state`: the acquisition readback file is
  untrusted JSON and is narrowed locally before becoming typed request metadata.

## Behavior

New optional candidate field:

```txt
linkedDocumentEvidence:
  sourceClaimDocumentLinks
  linkedSearchDocuments
  caveats
```

Live DB readback:

```txt
brain search:
  supportingClaims: 5
  supportingDocuments: 0
  sourceClaimDocumentLinks: 5
  linkedSearchDocuments: 5

heartbeat preview:
  candidate kind: knowledge_acquisition_candidate
  linkedDocumentEvidence.sourceClaimDocumentLinks: 5
  linkedDocumentEvidence.linkedSearchDocuments: 5
  reviewability: ready
  mutation: none
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm --filter @krn/workers test -- knowledgeAcquisitionHeartbeatPreview brainHeartbeatPreview` | passed | worker candidate model preserves linked document evidence | live DB behavior |
| `rtk pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand` | passed | CLI parses brain-search JSON and renders linked document evidence | source truth |
| `rtk pnpm run typecheck` | passed | strict TypeScript boundaries compile | semantic usefulness |
| `rtk pnpm quality:fallow:ci` | passed | changed JS/TS files are clean under Fallow gate | product readiness |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | full workspace tests pass locally | CI state |
| `rtk pnpm db:ready` | passed | current-shell Postgres is reachable with migrations and pgvector | remote DB state |
| `rtk krn brain search ... --json > /tmp/krn-u8e-brain-search.json && rtk krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file /tmp/krn-u8e-brain-search.json --json` | passed | live heartbeat candidate preserves linked document evidence from brain-search JSON | ranking quality, source truth, or product readiness |
| `rtk git diff --check` | passed | no whitespace diff errors | behavior correctness |

## Review Burden Delta

Before: the heartbeat acquisition candidate preserved missing evidence but did
not show that linked SearchDocument evidence already existed.

After: the candidate carries linked counts and caveats next to missing evidence,
making the next review decision narrower.

Delta: reduced for acquisition candidate review.

## Candidate Output

Follow-up issue:

```txt
mise-en-palace-7zt: Review linked-document acquisition candidate outcome.
```

Reason: the live candidate is review-ready and now carries enough evidence to
decide whether the next action is no-op, source-search usefulness wording,
SearchDocument inclusion repair, or another bounded follow-up.

## Next Action

Review one linked-document acquisition candidate and choose the next action from
evidence. Do not open crawler, schema, ranking, worker, API/MCP, source truth,
or Memory Core work unless this review falsifies the narrower path.
