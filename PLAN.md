# KRN Active Plan

Status: active compact root plan. Date: 2026-06-30.

Root `PLAN.md` is the compact product source of truth. Detailed history stays in `PLANS.md`.
Current-task contracts live in `PLANS.md`.

## Product State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V362 Ingest V0 Expansion With Bounded Evidence
current task: V362-00 Ingest V0 Expansion With Bounded Evidence
```

## Compact Checkpoints

```txt
repo/current-truth hygiene: strong enough for continuation
evidence/review loop: DB-backed and useful for dogfood
candidate reviewability: core primitive
source-search readback: usable through CLI and JSON
product-ready brain: not complete
```

Recent source-search ladder:

```txt
V340-V357 complete: source artifact/search, answer packages, usefulness,
graph SearchDocuments, and query-shape diagnostics.
```

## Active Task

### V358-00 Graph Mini Brain-QA Query-Shape Diagnostics Closure

Status: complete.

Outcome: DB-backed broad/narrow graph-relations source-search readbacks consume
built-in `queryShapeDiagnostics`. Broad query-shape ambiguity is visible without
manual DB/source inspection; narrow graph query still returns claims and
SearchDocuments without diagnostic noise.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v358-graph-mini-brain-qa-query-shape-diagnostics/REPORT.md
```

Next decision: proceed to graph brain v0 entity/relation extraction and
answer-delta proof before UI/API/MCP, crawler, embeddings, worker runtime, or
ranking work.

### V361-00 Graph Brain V0 Entity/Relation Extraction And Answer Delta

Status: complete.

Outcome: `krn source search --json` now exposes read-only `relationSupport` for
included SourceClaims with persisted SourceClaimEdge rows. The slice rejected a
new extraction layer because deterministic local entity/claim/relation
extraction already exists; the product gap was answer-package consumption.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v361-graph-brain-v0-entity-relation-answer-delta/REPORT.md
```

Next decision: expand ingest v0 with one more bounded local artifact flow before
crawler, embeddings, schema, ranking, UI/API/MCP, worker runtime, broad
benchmark, or Memory Core mutation.

### V362-00 Ingest V0 Expansion With Bounded Evidence

Status: active.

Goal: prove a second local artifact can flow through existing source artifact,
SearchDocument, SourceClaim, SourceClaimEdge, and source-search answer-package
readback paths.

Hard boundary: no DB schema, ranking rewrite, retrieval semantics rewrite,
UI/API/MCP, crawler, embeddings, worker runtime, broad benchmark, or Memory Core
mutation unless this task explicitly records a blocking falsifier.

### V359-00 Fallow Quality Gate And First Cleanup

Status: complete.

Outcome: Fallow added as a JS/TS quality layer, AGENTS guidance added, CI
changed-files gate added, intentional fixture/typecheck/repository exceptions
configured, dead-code findings reduced to zero, and first ranked health target
(`persistActivationTrace`) refactored below Fallow complexity thresholds.

Does not prove: full repo cleanup. Full Fallow audit still reports legacy
duplication and health debt.

### V360-00 Fallow Legacy Complexity Cleanup

Status: complete.

Outcome: full Fallow now exits cleanly. Dead-code findings remain zero, health
findings are below gate, and remaining duplication output is below configured
failure threshold.

Progress in this stream:

```txt
completed locally: bounded CLI/core/schema/db/harness/codex/workers cleanup
  slices from parser boundaries through harness smoke scaffolding.
recent slices: shared parser helpers, source-search readback preparation,
  shared metadata reader, DB readiness table inspection, temporal timestamp
  parsing, activation/retrieval smoke scaffold, DB smoke support tasks,
  harness smoke scaffolding, memory/source smoke setup, migration readiness.
  project repo lookup, locked row metadata mapping, retrieval subject mapping.
  evidence command normalization, feedback candidate normalization, evidence
  persistence assembly, harness run readback, source-map invariant assertions,
  knowledge-card preview parser, evidence golden expectations, codex brief
  golden expectations, CLI persisted evidence fixtures, harness retrieval and
  fixture helpers.
full Fallow moved: dupes 136 -> below gate; health 117 -> 0 failing findings;
dead-code 0
```

Verification: `pnpm quality:fallow`, `pnpm typecheck`, `pnpm test`,
`git diff --check`, and CI run `28428209649`.

## Remaining Product Gaps

```txt
1. ingest v0 expansion with bounded evidence
2. heartbeat/dreaming candidate generator
3. consensus eval/candidate lane
4. product UI/search/API/MCP after usefulness/security gates
```

## Pattern Gate

For non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven work:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

## Verification Policy

Use the narrowest relevant verification.

```txt
docs/plan-only: git diff --check
source: pnpm typecheck, pnpm test, git diff --check
DB/eval-affecting: pnpm db:ready, pnpm db:smoke, pnpm eval:promptfoo:smoke when relevant
```

If Vitest hits a temporary-directory write error, use
`TMPDIR=/home/krn/.cache/krn-tmp pnpm test`. Do not set `TMPDIR` under the repo checkout:
CLI boundary tests rely on outside-workspace temporary directories.

After each bounded slice, commit, push, and confirm CI with the full SHA.
