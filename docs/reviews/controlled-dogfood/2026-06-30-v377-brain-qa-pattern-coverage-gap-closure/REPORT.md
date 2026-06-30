# V377 Brain-QA Pattern Coverage Gap Closure

Status: complete compact pattern-coverage closure.
Date: 2026-06-30.

## Verdict

V377 closed the strongest V376 retained-pattern coverage gap without adding a
benchmark platform, retrieval rewrite, crawler, schema change, or runtime
mutation.

Two V376 source-search-useful areas now have retained, queryable patterns:

- graph relation readback boundary;
- heartbeat candidate-only runtime boundary.

The ingest v0 pattern was deferred. V376 found ingest source-search useful, but
V377 allowed only one or two retained cards and graph/heartbeat had stronger
current gaps tied to relation readback and candidate-only runtime safety.

## Selected Patterns

### Graph Relation Readback Boundary

```txt
source: V370 graph readback report + V376 Brain-QA gap
mechanism: expose existing SourceClaimEdge relation counts, relation support,
  graph-aware caveats, and query-shape diagnostics through read-only
  source/brain search.
KRN implication: graph relation readback can guide operator work but must not
  imply graph ranking quality, entity extraction, source truth, or
  GraphRAG-quality reasoning.
decision: retain as pattern:graph-relation-readback-boundary.
consumer: future graph brain readback slices, source-search relation support
  tests, and Brain-QA graph relation cases.
falsifier: a future graph slice treats relation counts/readback as proof of
  graph retrieval quality, source truth, entity extraction, or product-ready
  GraphRAG behavior.
```

### Heartbeat Candidate-Only Runtime Boundary

```txt
source: V372 heartbeat runtime report + V374 source relation evidence repair +
  V376 Brain-QA gap.
mechanism: heartbeat/dreaming remains a candidate-only maintenance/readback
  loop with readiness, reviewability, missing evidence, next action, and
  forbidden writes.
KRN implication: heartbeat can guide repair and review without introducing a
  scheduler, daemon, source-truth mutation, or Memory Core mutation.
decision: retain as pattern:heartbeat-candidate-only-runtime-boundary.
consumer: future heartbeat/dreaming repair slices, heartbeat preview tests,
  and candidate reviewability/missing-evidence gates.
falsifier: a future heartbeat slice adds scheduler/daemon/auto-mutation or
  review-ready maintenance candidates without explicit evidence refs and
  reviewability reasons.
```

## Deferred

```txt
pattern: ingest v0 bounded loop
reason: V376 showed ingest source-search usefulness, but V377's bounded scope
  was one or two cards. Graph/heartbeat had stronger immediate gap evidence.
next condition: retain only if a future slice shows ingest pattern recall would
  change an implementation or operator decision.
```

## Readback Evidence

New retained pattern files:

```txt
docs/patterns/retained-patterns/graph-relation-readback-boundary.json
docs/patterns/retained-patterns/heartbeat-candidate-only-runtime-boundary.json
```

New usefulness feedback:

```txt
docs/brain-knowledge/usefulness-feedback/v377-brain-qa-pattern-coverage-gap.json
```

Catalog:

```txt
docs/brain-knowledge/catalog.json
```

Readback commands:

```sh
pnpm --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "graph relation readback" \
  --json

pnpm --filter @krn/cli krn knowledge cards \
  --catalog-file docs/brain-knowledge/catalog.json \
  --text "heartbeat candidate runtime boundary" \
  --json
```

Both returned one card, `access: read_only`, `mutation: none`, and proof
boundaries stating that the readback does not prove ranking quality, retained
pattern completeness, Memory Core mutation, or product readiness.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runKnowledgeCardsCommand` | passed | Catalog readback and deterministic search tests cover both new retained cards. | Product readiness, ranking quality, or live DB state. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "graph relation readback" --json` | passed | The graph relation card is queryable through the catalog preview. | Graph ranking quality, entity extraction, relation correctness, source truth, or product readiness. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "heartbeat candidate runtime boundary" --json` | passed | The heartbeat candidate-only card is queryable through the catalog preview. | Heartbeat scheduling, autonomous dreaming, candidate truth, Memory Core mutation safety, or product readiness. |
| `pnpm --filter @krn/cli krn knowledge cards ... --format json` | failed | The CLI rejects unsupported `--format` and requires `--json`; this was operator error during manual readback. | It does not prove the readback surface is broken. |
| `pnpm db:ready` | passed | Local Postgres is reachable, 14/14 migrations are applied, and pgvector is available. | CI DB state or product readiness. |
| `pnpm run typecheck` | passed | Workspace TypeScript compiles. | Runtime correctness or usefulness. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed after fixing stale `GOAL.md` task line | Workspace tests pass and root active-state invariants are consistent. | Product readiness or second-operator usability. |
| `pnpm quality:fallow:ci` | passed | Fallow found no issues in changed files. | Absence of all quality issues. |
| `git diff --check` | passed | Diff has no whitespace errors. | Behavioral correctness. |
| `krn plan --persist` | passed | V377 execution run and context assembly were persisted. | Selected context sufficiency or ranking quality. |
| `krn evidence capture --persist` | passed | EvidenceBundle, ReviewAssessment, and FeedbackDelta were persisted with changed files classified as intended and no unrelated/unknown files. | Candidate truth, source truth, or product readiness. |
| `krn observe --persist` | passed | Observation group with 5 items was persisted without Memory Core mutation. | Reflection usefulness or memory quality. |
| first `krn reflect --persist` | passed with 0 observations | Shows parallel reflect can race before observe commits; kept as weak sequencing evidence. | It does not represent the final observed run. |
| second `krn reflect --persist` | passed with 5 observations | Reflection selected observed items and persisted without candidate rows or Memory Core mutation. | Useful extraction, candidate quality, or memory quality. |

Persisted IDs:

```txt
executionRun: a74ef8ef-1fdb-4355-99ec-c7a3ef966e99
evidenceBundle: fa012c18-0219-4272-b50b-4ac7a0faf35b
reviewAssessment: 43c1171f-3ab9-40a9-8750-9ca082944c8f
feedbackDelta: 673c087d-af6c-46f3-a9b8-cd8bea88a0c2
observationGroup: 97dcecc7-2dbb-4b1e-9d37-c3469db8df2f
reflectionRecord: 4364fd06-5859-434c-bd5f-e9c7687a9730
```

## Pattern Application

```txt
pattern:graph-relation-readback-boundary
outcome: helped
evidence: V376 gap and successful catalog readback.
does_not_prove: graph ranking quality, entity extraction, source truth, or
  product readiness.

pattern:heartbeat-candidate-only-runtime-boundary
outcome: helped
evidence: V376 gap and successful catalog readback.
does_not_prove: heartbeat scheduling, autonomous dreaming, source truth,
  Memory Core mutation safety, or product readiness.
```

## What Changed

- retained two source-backed patterns;
- added usefulness feedback for both;
- updated the brain knowledge catalog;
- added focused CLI readback tests;
- did not change retrieval, ranking, DB schema, source truth, Memory Core, UI,
  API, MCP, crawler, scheduler, daemon, or worker runtime.

## Next

Proceed to a second-operator launch packet. Do not fake the second-operator
proof; prepare the exact operator packet, transcript requirements, DB mode,
support boundary, and acceptance criteria so the proof can run when real input
exists.
