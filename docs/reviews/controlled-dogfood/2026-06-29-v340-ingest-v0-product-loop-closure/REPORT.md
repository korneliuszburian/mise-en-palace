# V340 Ingest v0 Product Loop Closure

Status: complete.
Date: 2026-06-29.

## Executive Verdict

V340 closed the smallest useful local ingest-to-use loop. A local artifact was
persisted as `SourceArtifact`, `SourceChunk`, `SearchDocument`, and governed
`SourceClaim`; a later DB-backed `krn plan --persist` activated the new
`SourceClaim` by marker query. The matching `SearchDocument` was also readable
and ranked, but excluded by the bounded context budget, so this proves a
reviewable artifact-to-activated-knowledge path, not product search quality.

## Source-to-Decision

source:
`docs/reviews/controlled-dogfood/2026-06-29-v339-consensus-candidate-evaluation-preview/REPORT.md`

mechanism:
KRN needed one bounded local artifact path before crawler, UI, API, MCP,
worker daemon, schema expansion, or broad eval work.

KRN implication:
Product-facing knowledge search should grow from a proven
artifact-to-activated-knowledge path.

decision:
Use existing local artifact preview, persisted `SearchDocument`,
`SourceClaim`, activation, and run readback surfaces. Do not add product
surfaces in this slice.

consumer:
V341 Product-Facing Knowledge Search Readback Preview.

falsifier:
A persisted local artifact claim/search document cannot be read back or
activated in a later plan by the marker query.

doesNotProve:
Source truth, broad corpus ingest, embeddings, graph retrieval, crawler
readiness, product readiness, or Memory Core mutation.

## Artifact Path

`docs/reviews/controlled-dogfood/2026-06-29-v340-ingest-v0-product-loop-closure/ARTIFACT.md`

marker:
`krn-v340-ingest-loop-local-artifact-20260629`

hash marker:
`991034dc0684e887`

## Persisted Source Readback

| Item | ID / result |
| --- | --- |
| project | `7d9d103a-1a8e-4492-a4ca-db3a5589bd9b` |
| sourceArtifact | `f6db868a-4c82-406a-8371-9ab7d8594fc5` |
| sourceChunks | `aeb76503-9798-47dd-b73a-07fb678b3a93`, `b2bfb5e1-d24e-4b24-a0d5-acb4c30caefb` |
| searchDocument | `6f045cc4-e8c9-4555-8425-167d74e5d319` |
| lexicalReadbackQuery | `krn-source-artifact-preview 991034dc0684e887` |
| lexicalReadback | `hit` |
| lexicalScore | `100` |
| sourceClaim | `3363383c-02d0-4e5a-9674-132c1bc41b51` |
| sourceClaimReadback | `hit` |
| sourceClaimEdge | not created |
| embeddings | none |
| graph runtime | none |
| Memory mutation | none |

## Activation Readback

| Field | Value |
| --- | --- |
| executionRun | `dab76e12-054e-4ac1-a4b4-783e42f69ed4` |
| taskContract | `61b65098-b30b-4b40-a0d4-2fc7d9058860` |
| contextAssembly | `fb89263a-017b-4186-a606-fa2e2eff523e` |
| retrievalRun | `31fb0db3-0277-4caa-b978-5b6e19a24143` |
| included context | 6 |
| excluded context | 12 |
| selected V340 SourceClaim | included |
| selected V340 SearchDocument | excluded over budget |

The selected claim was:
`source_claim:3363383c-02d0-4e5a-9674-132c1bc41b51`.

The matching search document was available as a retrieval candidate:
`search_document:6f045cc4-e8c9-4555-8425-167d74e5d319`, lexical score `100`,
total score `130`, but excluded because higher-scored guardrail/owner-file
items filled the bounded context.

## Evidence / Observe / Reflect

| Item | ID / result |
| --- | --- |
| evidenceBundle | `cef4bc27-92b4-41c2-b04a-5d5121f7a1f6` |
| reviewAssessment | `3a870d5a-5d80-4e72-b632-6b370be3a9ad` |
| feedbackDelta | `aab4974a-f31e-464e-b0dd-74ef1ebaf75f` |
| observationGroup | `a312ac29-4358-4036-881c-ee64bc5396ee` |
| observationItems | 5 |
| reflectionRecord | `26403834-a810-4584-97fe-db1497408ebb` |
| reflectionFindings | 0 |
| candidateRowsWritten | no |
| MemoryRecord created | no |

## Pattern Gate

| Query | Result | Use |
| --- | --- | --- |
| `ingest v0 product loop` | 0 results | no retained pattern matched the exact phrase |
| `source-to-decision retention gate` | 1 result | helped preserve mechanism, consumer, falsifier, and proof boundary |

## Usefulness

| Area | Verdict | Evidence |
| --- | --- | --- |
| Local ingest path | positive | local artifact persisted and read back as artifact/chunks/search/claim |
| Activation | positive with caveat | V340 SourceClaim included; SearchDocument excluded by budget |
| Evidence boundary | positive | proof and non-proof boundaries were explicit |
| Product readiness | not proven | no crawler, UI, API, MCP, embeddings, graph runtime, or autonomous memory mutation |
| Next product move | ready for bounded readback preview | V341 can expose a product-facing search/readback preview over existing substrate |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `git fetch --prune` | passed | remote state was refreshed | remote CI status |
| `git status --short --branch` | passed | repo started clean except V340 output later | future cleanliness |
| `krn source artifact preview --persist` | passed | local artifact persisted/read back through source artifact, chunks, search document, and claim | source truth or broad ingest |
| `krn plan --persist` marker activation | passed | later plan could activate the persisted V340 SourceClaim | activation ranking quality |
| `krn run show --run-id dab76e12...` | passed | persisted activation trace and candidate scores are readable | product graph retrieval quality |
| `pnpm db:ready` | passed | current shell has reachable Postgres, 14/14 migrations, pgvector available | remote/CI DB state |
| `krn knowledge cards --text "ingest v0 product loop"` | passed, 0 results | exact query had no retained pattern match | no relevant pattern exists |
| `krn knowledge cards --text "source-to-decision retention gate"` | passed, 1 result | retained pattern gate was readable | source truth |
| `krn evidence capture --persist` | passed | changed files, command provenance, review assessment, and feedback delta were persisted | semantic correctness or Memory Core quality |
| `krn observe --persist` | passed | run observations were staged without Memory Core mutation | reflection usefulness |
| `krn reflect --persist` | passed | reflection record was persisted without Memory Core mutation | candidate quality or product readiness |

## What This Proves

- A local artifact can become persisted source substrate without new schema.
- A governed `SourceClaim` from that artifact can be activated in a later
  DB-backed plan.
- The matching `SearchDocument` can be read back and ranked as a retrieval
  candidate.
- The loop works without crawler, UI/API/MCP, worker daemon, broad eval, or
  Memory Core mutation.

## What This Does Not Prove

- Product-facing search quality.
- Broad corpus ingest.
- Embeddings or graph-aware retrieval.
- Source truth.
- Autonomous heartbeat/dreaming.
- Product readiness.
- Second-operator usability.

## Next Recommended Task

V341 Product-Facing Knowledge Search Readback Preview.

Build the smallest operator-facing readback over the existing source artifact,
search document, source claim, and activation substrate. It should answer:

```txt
Given a query, what persisted knowledge can KRN show, why is it reviewable, what
was excluded, and what does this not prove?
```

Non-goals remain: no dashboard, API, MCP, crawler, worker daemon, schema
expansion, broad eval, or autonomous truth runtime.
