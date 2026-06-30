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
active stream: V363 Heartbeat/Dreaming Candidate Generator V0
current task: V363-00 Heartbeat/Dreaming Candidate Generator V0
```

## Compact Checkpoints

```txt
repo/current-truth hygiene: strong enough for continuation
evidence/review loop: DB-backed and useful for dogfood
candidate reviewability: core primitive
source-search readback: usable through CLI and JSON
product-ready brain: not complete
```

## Active Task

### V362-00 Ingest V0 Expansion With Bounded Evidence

Status: complete.

Outcome: a second bounded local artifact flowed through existing SourceArtifact,
SourceChunk, SearchDocument, reviewed SourceClaim, SourceClaimEdge, and
source-search answer-package `relationSupport` readback paths.

The slice found and fixed a real live-DB bug: `source artifact preview
--persist` lost the repository receiver for `createSourceChunk`. A
receiver-sensitive regression test now guards the runtime path.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v362-ingest-v0-expansion/REPORT.md
```

Next decision: proceed to a candidate-only heartbeat/dreaming v0 surface before
worker daemon, scheduler, autonomous Memory Core mutation, crawler, embeddings,
schema, UI/API/MCP, or broad benchmark.

### V363-00 Heartbeat/Dreaming Candidate Generator V0

Status: active.

Goal: implement the smallest candidate-only heartbeat/dreaming v0 surface over
existing source, memory, evidence, and review state.

Hard boundary: no autonomous Memory Core mutation, worker daemon, scheduler,
crawler, embeddings, schema, ranking rewrite, UI/API/MCP, broad benchmark, or
consensus runtime unless this task records a blocking falsifier.

## Recent Completed Streams

```txt
V358: graph query-shape diagnostics closure.
V359-V360: Fallow quality gate and bounded legacy cleanup; full Fallow clean.
V361: source-search JSON answer packages expose read-only relationSupport.
V362: second local artifact ingest/readback and source chunk receiver fix.
```

## Remaining Product Gaps

```txt
1. heartbeat/dreaming candidate generator
2. consensus eval/candidate lane
3. product UI/search/API/MCP after usefulness/security gates
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
