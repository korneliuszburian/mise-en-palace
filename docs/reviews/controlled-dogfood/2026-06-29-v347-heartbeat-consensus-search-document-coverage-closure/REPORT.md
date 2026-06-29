# V347 Heartbeat/Consensus SearchDocument Coverage Closure

Status: complete.

Date: 2026-06-29
DB available: yes
Execution run: `394ad4fb-a73d-4a71-86f8-bcb072d168fd`
Task contract: `d536d273-d998-454a-8ae9-5e171d336935`
Context assembly: `7913376c-9c06-480d-bd34-d2fa6a958f9c`
Evidence bundle: `6f62e321-4403-4d56-9417-5cfbf3a4d821`
Review assessment: `f01800de-917b-4435-92a9-21716f8e1ed5`
Feedback delta: `ec83cfd9-8232-49a2-90be-7ecaf64442e8`
Observation group: `b5ebeb81-dc4c-4275-a59f-e4b4829ab754`
Reflection record: `9e34d736-c256-4c85-b077-a4c09c6b5fa9`

## Executive Verdict

The V346 missing-SearchDocument signal was not a missing coverage problem for
heartbeat or consensus. Topic-specific source-search queries retrieve the
expected SearchDocuments. The failing case was a broad combined query that mixed
heartbeat, dreaming, consensus, eval, and candidate-layer terms.

V347 therefore made a bounded query-guidance repair in the answer package: when
governed SourceClaims exist but no SearchDocuments match the combined query,
the output now says topic-specific documents may still exist and recommends
splitting the query before changing retrieval.

## Source-To-Decision

Source: V346 answer package report, V343 coverage seed report, and V347 DB
readback.

Mechanism: V343 persisted heartbeat and consensus SearchDocuments. V347
specific queries retrieved them, while the broad combined query returned
SourceClaims only. This distinguishes query formulation from missing coverage.

KRN implication: source search should guide operators toward narrower
topic-specific searches before they infer that retrieval, ranking, or coverage
needs repair.

Decision: adopt query-guidance wording in the answer package; reject retrieval,
ranking, schema, crawler, UI/API/MCP, graph runtime, worker, or coverage changes
for this slice.

Consumer: technical operators using source-search answer packages for next-task
decisions.

Falsifier: specific heartbeat/consensus queries cannot retrieve their
SearchDocuments, or broad-query output still implies retrieval/coverage repair
before narrower searches.

Does not prove: source truth, ranking quality, broad corpus coverage, semantic
query understanding, product readiness, or Memory Core mutation safety.

## What Changed

Changed files:

```txt
packages/cli/src/runSourceSearchCommand.ts
packages/cli/src/runSourceSearchCommand.test.ts
```

When SourceClaims are present but SearchDocuments are absent, answer-package
missing evidence now says:

```txt
matching SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist
```

Recommended next action now says:

```txt
Use the supporting claims cautiously and split broad queries into narrower topic-specific source searches before changing retrieval.
```

## DB Readback

| Query | SourceClaims | SearchDocuments | Verdict |
|---|---:|---:|---|
| `memory staleness heartbeat candidate MemoryRecord` | 11 | 1 | specific heartbeat coverage exists |
| `consensus candidate dissent decision options` | 11 | 1 | specific consensus coverage exists |
| `heartbeat dreaming candidate generator consensus eval candidate layer` before repair | 11 | 0 | broad combined query, documents absent |
| `heartbeat dreaming candidate generator consensus eval candidate layer` after repair | 11 | 0 | output now identifies combined-query guidance |

Scratch outputs:

```txt
.local-lab/v347/heartbeat-specific.txt
.local-lab/v347/consensus-specific.txt
.local-lab/v347/broad-composite.txt
.local-lab/v347/broad-composite-after.txt
```

## TypeScript Boundary

Boundary: internal CLI rendering over already typed source-search candidates and
diagnostics.

No external input parsing, persistence, DB schema, JSON parsing, env boundary,
MCP boundary, or public package API changed.

No `any` or double assertion was introduced.

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runSourceSearchCommand` | passed | focused CLI behavior covers claims-without-documents guidance | broad product search quality |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | TypeScript source remains type-correct across workspace packages | runtime usefulness |
| `pnpm db:ready` | passed | local DB is reachable with migrations and pgvector | future DB availability |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |
| `krn evidence capture --persist` | passed | command proof and source-usefulness outcomes were persisted | product readiness |
| `krn observe --persist` | passed | same-run observations were persisted before reflection | reflection quality |
| `krn reflect --persist` | passed | reflection selected 5 observations and did not mutate Memory Core | useful candidate quality |

## Brain ROI

Brain ROI: positive.

What improved:

- answer package no longer implies a coverage/retrieval repair when narrower
  topic searches should be tried first;
- heartbeat and consensus SearchDocument coverage is proven for specific
  queries;
- source truth and ranking quality are still not overclaimed.

What remains weak:

- answer package is still plain text;
- no machine-readable answer package exists for future UI/search/API consumers;
- broad semantic query understanding remains limited.

## Next Recommended Task

`V348 Source Search Answer Package JSON Readback`

Goal: expose the current answer package as a typed JSON readback while keeping
the text output and raw candidates inspectable. This should support future UI,
web search, MCP, and benchmark consumers without building those surfaces yet.

Non-goals:

- no UI/API/MCP;
- no crawler;
- no schema;
- no ranking rewrite;
- no embeddings or graph runtime;
- no worker daemon;
- no Memory Core mutation.
