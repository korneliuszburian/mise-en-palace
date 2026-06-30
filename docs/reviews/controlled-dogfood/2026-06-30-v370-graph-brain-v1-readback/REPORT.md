# V370 Graph Brain V1 Readback

Status: complete.

## Executive Verdict

V370 improved graph-brain readback without adding a graph platform. Existing
`SourceClaimEdge` relation support is now summarized as graph readback in
`krn source search` and surfaced by `krn brain search`.

This makes graph state more inspectable, but it still does not prove graph
retrieval quality, entity extraction, contradiction truth, duplicate truth, or
product readiness.

## What Changed

- `krn source search` answer packages now include `graphReadback`.
- `graphReadback` summarizes:
  - claim nodes;
  - relation edges;
  - relation kind counts;
  - temporal edges;
  - contradiction edges;
  - duplicate edges;
  - invalidation/supersession/expiry edges;
  - graph-aware status;
  - caveats.
- `krn brain search` now exposes the graph summary from source search.
- No DB schema, crawler, graph runtime, ranking rewrite, dashboard, API, MCP,
  worker daemon, or Memory Core mutation was added.

## Source-To-Decision

```txt
source: current KRN SourceClaimEdge readback and V369 loop evidence
mechanism: summarize existing relation support as graph readback
KRN implication: graph brain should become inspectable before graph runtime
decision: add bounded readback summary, reject new graph platform
consumer: technical operator using source search / brain search
falsifier: V370 adds schema, crawler, graph runtime, ranking rewrite, or
  claims entity/contradiction/duplicate truth without evidence
```

## Live DB Readback

Command:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn brain search \
  --query "source-to-decision" \
  --limit 3 \
  --max-inclusions 3 \
  --json
```

Observed:

```txt
knowledge cards: 3
sourceSearch.answerUsefulness: useful
supportingClaims: 2
supportingDocuments: 1
relationSupport: 1
graphReadback.claimNodes: 2
graphReadback.relationEdges: 1
graphReadback.graphAware: true
```

Graph caveats:

```txt
graph readback summarizes existing SourceClaimEdge rows only
entity extraction is not available in this bounded readback
relation support does not prove source truth, edge correctness, or ranking quality
```

## DB-Backed Run

```txt
executionRun: eff1cb37-775f-4683-9bf3-d019f6f6ed4a
taskContract: 5df9c872-9d04-4ed7-ae0f-5be3e8348eff
evidenceBundle: e7da8f47-e958-4150-9684-17b05ee7b866
reviewAssessment: cc5120c1-da85-4938-ac49-0390e8596e68
feedbackDelta: 8ebc4347-ef88-4b43-8a5b-e7a9d1d13ebd
observationGroup: e0cf3d24-8089-49f7-9b4d-eccd2ad77f10
reflectionRecord: a7bc1875-8a6c-4dd0-a46a-ae42104f290d
```

Note: a first parallel observe/reflect attempt produced a reflection record
with `Observations selected: 0`. The sequential reflect after observe selected
5 observations. Future replay steps should avoid parallel observe/reflect when
the reflect step depends on newly persisted observations.

## Command Evidence

| Command | Result | Proves | Does Not Prove |
|---|---:|---|---|
| `pnpm db:ready` | passed | current-shell DB readiness | CI DB state |
| `pnpm --filter @krn/cli test -- runSourceSearchCommand runBrainSearchCommand` | passed | focused readback behavior | product readiness |
| `pnpm --filter @krn/cli run typecheck` | passed | touched CLI types compile | runtime usefulness |
| `pnpm run typecheck` | passed | workspace types compile | graph quality |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | product readiness |
| `pnpm quality:fallow:ci` | passed | changed JS/TS files have no Fallow findings | semantic correctness |
| `git diff --check` | passed | whitespace clean | behavior correctness |
| live `krn brain search source-to-decision` | passed | graph summary appears in readback | source truth, ranking quality, entity extraction |

## Candidate / Reflection Quality

Evidence capture still produced vague candidate proposals:

```txt
memory candidate: too_vague
source decision candidate: too_vague
```

Sequential reflection selected 5 observations but produced:

```txt
findings: 0
contradictions: 0
gaps: 0
candidate rows written: no
Memory mutation: none
```

This is acceptable for V370, but it keeps reflection usefulness and candidate
quality as open product gaps.

## What This Proves

- Existing `SourceClaimEdge` rows can be summarized in source-search answer
  packages.
- Brain search can surface graph-aware readback without mutating KRN state.
- Tests cover relation kind counts and temporal/contradiction/duplicate/
  invalidation summaries.
- Fallow did not flag added complexity or duplication.

## What This Does Not Prove

- It does not prove graph retrieval quality.
- It does not prove entity extraction.
- It does not prove contradiction or duplicate truth.
- It does not prove ranking quality.
- It does not prove product readiness.
- It does not promote or mutate Memory Core.

## Next Recommended Action

Move to V371 Ingest v0/v1. The graph readback is more visible now, but graph
quality still depends on better bounded ingest inputs:

```txt
artifact -> chunks -> claims -> search docs -> graph edges -> activation/readback
```

Keep it bounded. Do not build a crawler, API, MCP server, dashboard, schema
rewrite, worker daemon, broad benchmark, or autonomous runtime.
