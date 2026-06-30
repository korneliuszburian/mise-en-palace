# V376 Mini Brain-QA Benchmark Slice

Status: complete compact benchmark/readback slice.
Date: 2026-06-30.

## Verdict

V376 ran six current KRN Brain-QA questions through existing `krn brain search`
readback. The slice did not build a broad benchmark platform. It reused the
existing read-only knowledge-card and source-search surfaces.

Result: current brain search is useful for mixed pattern/source readback, but
coverage is uneven. Source-to-decision, Codex hook guardrail, and TypeScript
boundary questions have matching retained pattern cards. Graph, ingest, and
heartbeat questions are answerable through source-search evidence, but do not
yet have matching retained pattern cards.

## Query List

Committed query list:

```txt
docs/benchmarks/brain-qa/v376-questions.json
```

Commands were run with:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn brain search \
  --query "<query>" \
  --catalog-file docs/brain-knowledge/catalog.json \
  --limit 16 \
  --max-inclusions 6 \
  --json
```

## Batch Results

| ID | Query | Knowledge cards | Source usefulness | Claims | Docs | Relations | Missing evidence | Usefulness verdict |
|---|---|---:|---|---:|---:|---:|---|---|
| V376-Q1 | `source-to-decision retention gate consumer falsifier` | 1 | `useful` | 5 | 1 | 3 | none | useful |
| V376-Q2 | `hook deterministic guardrail` | 1 | `partly_useful_missing_document` | 6 | 0 | 7 | included SearchDocument evidence for this combined query | useful with document gap |
| V376-Q3 | `unknown-first external boundary explicit result state` | 1 | `partly_useful_missing_document` | 6 | 0 | 5 | included SearchDocument evidence for this combined query | useful with document gap |
| V376-Q4 | `graph sourceclaimedge relation temporal source relations` | 0 | `partly_useful_missing_document` | 6 | 0 | 6 | included SearchDocument evidence for this combined query | source-only useful |
| V376-Q5 | `ingest v0 source artifact searchdocument sourceclaim activation` | 0 | `useful` | 5 | 1 | 4 | none | source-only useful |
| V376-Q6 | `heartbeat dreaming source relation evidence` | 0 | `partly_useful_missing_document` | 6 | 0 | 7 | included SearchDocument evidence for this combined query | source-only useful with document gap |

Aggregate:

```txt
questions: 6
knowledge_card_hits: 3
source_useful: 2
source_partly_useful_missing_document: 4
source_no_answer: 0
graph_aware_results: 6
memory_mutation: none
```

## Answerability

Answered well enough for operator guidance:

- V376-Q1: source-to-decision retention gate.
- V376-Q2: Codex hook deterministic guardrail.
- V376-Q3: TypeScript unknown-first/result-state boundary.
- V376-Q5: ingest v0 source artifact/source claim/search document path.

Answered with useful source evidence but missing retained pattern coverage:

- V376-Q4: graph/source relation readback.
- V376-Q6: heartbeat/dreaming/source-relation evidence.

## Proof Boundaries

This benchmark proves:

- `krn brain search --json` can be consumed across six current local questions.
- Existing readbacks expose knowledge-card hits, source-search usefulness,
  source claim counts, SearchDocument counts, relation support, missing
  evidence, and recommended next action.
- The batch can identify a concrete coverage gap without adding a broad
  benchmark platform.

This benchmark does not prove:

- answer correctness;
- source truth;
- ranking quality;
- semantic search quality;
- broad benchmark quality;
- product readiness;
- second-operator usability;
- Memory Core mutation.

## Gap

The most useful gap is not a retrieval rewrite. The current readback says graph,
ingest, and heartbeat questions have source evidence, but only some concepts
have retained pattern cards.

Next repair candidate:

```txt
V377 Brain-QA Pattern Coverage Gap Closure
```

Goal: add one or two retained pattern cards only if the V376 evidence shows a
real reusable mechanism with consumer and falsifier. Candidate areas:

- graph brain readback relation-support boundary;
- heartbeat/dreaming candidate-only runtime boundary.

Non-goals:

```txt
no ranking rewrite
no crawler
no broad benchmark platform
no UI/API/MCP
no DB schema
no worker daemon
no Memory Core mutation
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| six `krn brain search --json` commands | passed | Existing read-only brain search can return benchmarkable JSON for six local questions. | Answer correctness, ranking quality, or product readiness. |
| `KRN_DATABASE_URL=... krn brain search --query "hook deterministic guardrail" --json` | passed | Representative explicit-env readback returns one knowledge-card hit and source-search proof boundaries. | The earlier no-env failure does not prove the surface is broken; this also does not prove ranking quality. |
| `pnpm db:ready` | passed | Local Postgres is reachable, migrations are applied, and pgvector is available. | CI DB state or product readiness. |
| `pnpm run typecheck` | passed | Workspace TypeScript compiles. | Runtime correctness or usefulness. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Workspace tests pass. | Product readiness or SOTA quality. |
| `pnpm quality:fallow:ci` | passed | Fallow found no issues in changed files. | Fallow completeness or absence of all quality issues. |
| `git diff --check` | passed | Diff has no whitespace errors. | Behavioral correctness. |
| `krn plan --persist` | passed | V376 plan, context assembly, and execution run were persisted. | Selected context sufficiency or ranking quality. |
| `krn evidence capture --persist` | passed | EvidenceBundle, ReviewAssessment, and FeedbackDelta were persisted with all changed files classified as intended. | Candidate truth, source truth, or product readiness. |
| `krn observe --persist` | passed | Observation group was persisted without Memory Core mutation. | Reflection usefulness or memory quality. |
| `krn reflect --persist` | passed | Reflection selected 5 observations and persisted without candidate rows or Memory Core mutation. | That reflection extracted useful findings. |

Persisted IDs:

```txt
executionRun: 855945e3-e6ae-47a1-a28e-9270c0ed15e9
evidenceBundle: ad70d3c9-7f52-4d5e-94e2-80a808362da1
reviewAssessment: a7210c9b-d6fb-43ca-a6da-c662e16fa394
feedbackDelta: ba2c012b-343a-4fe2-bc72-3275409f1d4c
observationGroup: 22fb5810-d33d-47b0-9b17-08d6950010fe
reflectionRecord: 8c41be55-fa5f-44a7-9547-b89987bdaca3
```

## Next

Proceed to one bounded coverage-gap closure before second-operator work:

```txt
V377 Brain-QA Pattern Coverage Gap Closure
```
