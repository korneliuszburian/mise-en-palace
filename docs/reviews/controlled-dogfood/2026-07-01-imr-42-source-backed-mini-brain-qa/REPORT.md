# IMR-42 Source-Backed Selected Knowledge Mini Brain-QA

Status: complete bounded usefulness measurement.

Issue: `mise-en-palace-mm0`.

## Executive Verdict

Default `krn brain search` source-backed selected knowledge should stay enabled.
The current mini Brain-QA batch shows `selectedKnowledge` for all 8 questions:
6 are catalog-backed and 2 are source-backed fallback cases.

The fallback is useful for the exact cases it was added for:

- `V376-Q5` ingest v0 has no catalog card and now gets 7 ready source-backed
  packets, with the first 5 directly useful for the ingest/source-artifact loop.
- `IMR41` has no catalog card and now gets 6 ready source-backed packets, with
  the exact retained SourceClaim selected first.

Decision: keep the behavior and do not repair ranking now. Source-backed
fallback is lower precision than catalog cards, but the useful packet is first
for IMR41 and the Q5 ingest cluster is mostly relevant. The next step should use
the Q5 source-backed ingest pattern gate in a bounded ingest/reuse slice instead
of tuning ranking without a harmed decision.

## Scope

Raw output directory:

```txt
/tmp/krn-imr-42-source-backed-selected-knowledge-batch
```

Batch:

- 7 current `docs/benchmarks/brain-qa/v376-questions.json` questions;
- 1 IMR-41 natural source/eval recall regression query.

Command shape:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --silent --filter @krn/cli krn brain search \
  --query "<query>" \
  --catalog-file docs/brain-knowledge/catalog.json \
  --limit 16 \
  --max-inclusions 8 \
  --json
```

Non-goals:

- no ranking rewrite;
- no semantic model;
- no crawler;
- no worker daemon;
- no API/MCP;
- no DB schema;
- no source truth mutation;
- no eval promotion;
- no Memory Core mutation.

## Source To Decision

- Source: IMR-41 default brain-search fallback evidence and this current-shell
  mini Brain-QA batch.
- Mechanism: catalog cards remain highest precision, but ready SourceClaim
  packets can supply reviewable pattern guidance when catalog readback misses.
- KRN implication: source-backed fallback can move retained source decisions
  into the normal Pattern Application Gate without requiring operators to know
  `--store-only`.
- Decision: keep catalog-first/source-backed fallback; do not tune ranking now.
- Rejection: no broad ranking/filtering repair from this batch alone.
- Consumer: pattern/research brain loop and the next bounded ingest/reuse slice.
- Falsifier: source-backed fallback repeatedly selects stale/noise packets ahead
  of the target packet, or a source-backed packet drives an incorrect product
  decision.

## Batch Summary

| ID | Returned cards | Selected | Selected source | Source usefulness | Claims | Docs | Linked docs | Relations | Decisions | Verdict |
|---|---:|---:|---|---|---:|---:|---:|---:|---:|---|
| V376-Q1 | 1 | 1 | catalog_file:1 | useful | 7 | 1 | 7 | 7 | 2 | selected_knowledge_sufficient |
| V376-Q2 | 1 | 1 | catalog_file:1 | partly_useful_missing_document | 8 | 0 | 8 | 7 | 2 | selected_knowledge_sufficient |
| V376-Q3 | 1 | 1 | catalog_file:1 | partly_useful_missing_document | 8 | 0 | 8 | 7 | 2 | selected_knowledge_sufficient |
| V376-Q4 | 1 | 1 | catalog_file:1 | partly_useful_missing_document | 8 | 0 | 8 | 8 | 2 | selected_knowledge_sufficient |
| V376-Q5 | 0 | 7 | source_search:7 | useful | 7 | 1 | 7 | 4 | 2 | selected_knowledge_sufficient |
| V376-Q6 | 2 | 2 | catalog_file:2 | partly_useful_missing_document | 8 | 0 | 8 | 7 | 3 | selected_knowledge_sufficient |
| V376-Q7 | 1 | 1 | catalog_file:1 | partly_useful_missing_document | 8 | 0 | 8 | 4 | 2 | selected_knowledge_sufficient |
| IMR41 | 0 | 6 | source_search:6 | useful | 6 | 2 | 6 | 2 | 3 | selected_knowledge_sufficient |

Aggregate:

```txt
queries: 8
selected_knowledge_sufficient: 8
catalog-backed selectedKnowledge: 6 queries
source-backed fallback selectedKnowledge: 2 queries
linked_evidence_exploration_candidate: 0
insufficient_evidence: 0
mutation: none
```

## Source-Backed Packet Classification

### V376-Q5: ingest v0 source artifact searchdocument sourceclaim activation

| Packet | Classification | Reason |
|---|---|---|
| `f654ae9a-f19d-4834-baac-89099d7d5d2e` | helped | Direct V371 local ingest readback packet for artifact/chunks/SearchDocument/SourceClaim/graph/activation loop. |
| `e4bfcdea-d201-4e0f-9d73-94e200b9fe4f` | helped | Direct second bounded local artifact flow before crawler/schema/ranking/UI/API/MCP/worker. |
| `3363383c-02d0-4e5a-9674-132c1bc41b51` | helped | Direct bounded local ingest loop before broad product surfaces. |
| `3afb4c95-eaad-4df1-aa72-e8c739f385dd` | helped | Direct local artifact preview/source-claim path. |
| `b055fffe-de70-49e4-86b0-a806a2f12e86` | helped | Direct source claim to source decision edge linkage. |
| `7769dfc9-fb91-4f80-804f-01a206b7690e` | neutral | Source-claim relation guidance is adjacent to graph/source edges, but not required for the ingest loop question. |
| `190f1f72-4621-49b4-b93c-538ea2c581ef` | noise | Activation-utility manual follow-up is not needed for the ingest v0 question. It did not hide the first five useful ingest packets. |

Verdict: source-backed fallback helped Q5. It adds one noisy packet, but the
dominant cluster is useful and no harmed decision is present.

### IMR41: activation utility manual source/eval follow-up

| Packet | Classification | Reason |
|---|---|---|
| `190f1f72-4621-49b4-b93c-538ea2c581ef` | helped | Exact retained SourceClaim for IMR-37/38 manual source/eval follow-up is selected first. |
| `7769dfc9-fb91-4f80-804f-01a206b7690e` | neutral | Temporal/source relation guidance is generally relevant to source evidence, but not needed for this decision. |
| `ea770eea-47c1-47c5-90ab-7bcd1a4bff3f` | helped / neutral | AMA acquisition source claim is upstream context for activation utility and acquisition, but not the exact retained follow-up. |
| `04b097d5-7338-4b78-be55-e85d0cbb7aff` | neutral | Heartbeat preview boundary is adjacent to routed candidate flow. |
| `e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27` | neutral | Activation context-selection law is generally useful but not decisive here. |
| `3363383c-02d0-4e5a-9674-132c1bc41b51` | noise | Ingest-loop packet is not needed for this activation utility follow-up. |

Verdict: source-backed fallback helped IMR41 because the exact retained claim is
first. It has adjacent/noisy tail packets, but no broad repair is justified
until they obscure or misdrive a decision.

## Decision

Keep source-backed selected knowledge enabled.

Do not repair ranking now because:

- 8/8 queries now have `selectedKnowledge`;
- catalog cards still cover 6/8 queries;
- the two source-backed fallback cases are useful;
- IMR41 selects the exact target SourceClaim first;
- Q5 selects a mostly ingest-focused source-backed cluster;
- observed noise is tail noise, not a harmed decision.

Next action: use the Q5 source-backed ingest pattern gate in a bounded
ingest/reuse slice. If that slice shows source-backed tail noise causes wrong
work, open a precision repair with that concrete harmed decision.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk bd update mise-en-palace-mm0 --claim` | passed | Durable issue was claimed before work. | Does not prove usefulness. |
| `rtk pnpm db:ready` | passed | Current shell has reachable Postgres, 14/14 migrations, and pgvector. | Does not prove source truth or ranking quality. |
| eight default `krn brain search --json` commands | passed | Current default brain search returns selectedKnowledge for the mini Brain-QA/IMR41 batch. | Does not prove answer correctness, semantic search quality, product readiness, or future precision. |
| batch summarizer | passed | Raw output can be condensed into selectedKnowledge/source/usefulness/verdict rows. | Does not prove ranking is optimal. |

## Proof Boundary

Proves:

- source-backed fallback is currently useful for Q5 and IMR41;
- default brain search no longer needs `--store-only` for ready source-backed
  selected knowledge when catalog misses;
- no ranking/code repair is warranted by this batch alone.

Does not prove:

- source truth;
- answer correctness;
- ranking quality;
- semantic model quality;
- future source-backed precision;
- graph retrieval quality;
- ingest product readiness;
- Memory Core mutation safety beyond mutation none in readback;
- product readiness.

