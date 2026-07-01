# IMR-27 AMA Linked-Document Review

Status: complete.

Issue: `mise-en-palace-iux`.

## Executive Verdict

The linked-document review is useful but does not fully resolve the
AMA-shaped acquisition evidence gap.

The candidate had 6 linked SearchDocuments. They support KRN's existing
kernel/heartbeat/ingest/graph boundaries, especially:

- context must be selected and verified;
- heartbeat previews stay candidate-only;
- local source artifacts are the first ingest/readback path;
- graph relations stay reviewable source-claim edges;
- no Memory Core mutation should happen before review.

They do not directly resolve the missing evidence for the full AMA-shaped
question:

```txt
autonomous memory agents missing evidence heartbeat acquisition cost-aware
```

Decision: do not open external research yet. The next low-cost step is a
narrower store-backed source-search review for AMA acquisition/cost-aware
evidence.

## Scope

Inspected:

- live current-shell `krn brain search`;
- live current-shell `krn source search`;
- linked SearchDocument rows from Postgres;
- source claims linked to those documents;
- IMR-26 candidate context.

Changed:

- this report;
- compact root plan/ledger state;
- Beads task graph.

No package source, runtime behavior, DB schema, crawler, worker daemon, API/MCP,
ranking, source truth, eval candidate, or Memory Core state changed.

## Source-To-Decision

- Source: `Towards Autonomous Memory Agents`, retained KRN source decision,
  IMR-26 heartbeat acquisition candidate, and linked SearchDocument readback.
- Mechanism: cost-aware acquisition should exhaust cheaper available evidence
  before source-search review, external research, or human review.
- KRN implication: because linked documents exist, review them before opening
  external research or mutating durable truth.
- Decision: linked documents are helpful but insufficient; proceed to narrower
  source-search review.
- Rejection: no bounded external research yet, and no autonomous acquisition,
  crawler, worker daemon, API/MCP, DB schema, ranking rewrite, source truth
  mutation, broad benchmark lane, or Memory Core mutation.
- Consumer: heartbeat acquisition review and future AMA acquisition proof lane.
- Falsifier: linked documents contain direct AMA acquisition/cost-aware evidence
  sufficient to resolve the missing evidence, or source-search review cannot
  improve on linked-document review.

## Readback Evidence

Raw artifacts:

```txt
/tmp/krn-imr-27-ama-linked-doc-review/ama-brain-search.json
/tmp/krn-imr-27-ama-linked-doc-review/ama-source-search.json
/tmp/krn-imr-27-ama-linked-doc-review/linked-search-documents.json
/tmp/krn-imr-27-ama-linked-doc-review/linked-document-review-input.json
```

Original broad query:

```txt
autonomous memory agents missing evidence heartbeat acquisition cost-aware
```

Source-search package:

```txt
answerUsefulness: partly_useful_missing_document
supportingClaims: 6
supportingDocuments: 0
sourceClaimDocumentLinks: 6
linkedSearchDocuments: 6
relationSupport: 6
missingEvidence:
  included SearchDocument evidence for this combined query; artifact-linked
  SearchDocuments are visible but were not included by lexical retrieval
```

## Linked-Document Review

| Linked document | Linked claim | Usefulness | Verdict |
|---|---|---:|---|
| `docs/reviews/controlled-dogfood/2026-06-29-v343-product-facing-knowledge-search-coverage-seed/heartbeat-memory-staleness-artifact.md` | V338 heartbeat preview can propose reviewable MemoryRecord maintenance candidates without Memory Core mutation. | helped | Supports candidate-only heartbeat / no Memory Core mutation. Does not prove AMA acquisition evidence. |
| `docs/KRN_KERNEL.md` | KRN activation should select, apply, verify, and forget task-specific context. | helped | Supports bounded evidence-first kernel law. Does not prove acquisition cascade. |
| `docs/KRN_KERNEL.md` | Local artifact preview can carry governed source claims. | neutral / helped | Supports store-backed source grounding and local artifact evidence. Does not resolve AMA-specific gap. |
| `docs/reviews/controlled-dogfood/2026-06-30-v362-ingest-v0-expansion/SOURCE.md` | Second bounded local artifact flow should pass through SourceArtifact, SearchDocument, SourceClaim, SourceClaimEdge, and source-search readback before crawler/embeddings/schema/runtime work. | helped | Supports local ingest/readback before crawler or external acquisition. Does not prove AMA acquisition mechanism. |
| `docs/decisions/ADR-0021-temporal-claim-graph.md` | Temporal source relations are reviewable edges between claims and do not make newer claims globally true by themselves. | neutral | Useful graph governance context, but not central to AMA acquisition evidence. |
| `docs/decisions/ADR-0021-temporal-claim-graph.md` | Graph brain v0 should represent temporal source relations as reviewable SourceClaimEdge candidates. | neutral | Supports graph-governed relation handling, not acquisition evidence. |

## Decision

Linked-document review partially resolves the candidate's governance boundary:

```txt
candidate-only heartbeat: supported
no Memory Core mutation: supported
local source/readback before crawler: supported
graph relation caveat: supported
AMA acquisition/cost-aware evidence: still missing
```

Next step:

```txt
mise-en-palace-6qu: Run narrow source-search review for AMA acquisition evidence.
```

This follows the retained cost-aware acquisition rule:

```txt
linked_document_review -> source_search_review -> bounded_external_research -> human_review
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm db:ready` | passed | Current-shell Postgres is reachable, migrations are applied, and pgvector is available. | Does not prove source truth, acquisition quality, or remote DB state. |
| AMA-shaped `krn brain search --json` | passed | Broad query still reports partly useful missing evidence and linked document counts. | Does not prove linked document content resolves the gap. |
| AMA-shaped `krn source search --json` | passed | Source-search returned 6 supporting claims, 0 included documents, 6 source-claim document links, and 6 linked SearchDocument IDs. | Does not prove source truth or ranking quality. |
| read-only SQL over `search_documents` by linked IDs | passed after quoting/type fixes | Retrieved the linked SearchDocument rows for review. | Does not mutate source truth or prove the documents are sufficient. |
| `rtk git diff --check` | passed | Markdown/root changes have no whitespace errors. | Does not prove source behavior. |

## Proof Boundary

Proves:

- linked SearchDocuments exist for the AMA-shaped source-search package;
- linked documents support KRN governance and heartbeat candidate-only
  boundaries;
- linked documents do not fully resolve the AMA acquisition/cost-aware evidence
  gap;
- the next cost-aware step is source-search review, not external research.

Does not prove:

- source truth;
- answer correctness;
- semantic ranking quality;
- AMA benchmark transfer;
- external research necessity;
- autonomous acquisition safety;
- Memory Core usefulness;
- product readiness.
