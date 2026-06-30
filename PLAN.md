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
active stream: V370 Graph Brain V1 Readback
current task: V370-00 Graph Brain V1 Readback
```

## Compact Checkpoints

```txt
repo/current-truth hygiene: strong enough for continuation
evidence/review loop: DB-backed and useful for dogfood
candidate reviewability: core primitive
source-search readback: usable through CLI and JSON
brain-search preview: usable through CLI and JSON
product loop replay: DB-backed and inspectable
product-ready brain: not complete
```

## Active Task

### V368-00 Brain Search Product Surface Preview

Status: complete.

Goal: expose the smallest product-facing brain search/readback surface over
existing source-search and knowledge-card outputs without adding a dashboard,
API server, MCP server, crawler, schema, ranking rewrite, or autonomous
runtime.

Hard boundary: use existing CLI/readback surfaces first; no new product server,
MCP server, DB schema, crawler, broad benchmark, or ranking rewrite.

Outcome: `krn brain search` now composes existing knowledge-card and
source-search readbacks into one read-only no-mutation preview with proof and
does-not-prove boundaries.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v368-brain-search-product-surface-preview/REPORT.md
```

### V369-00 End-To-End Product Loop Replay

Status: complete.

Goal: run one bounded KRN-on-KRN product loop using existing surfaces:
brain search, plan/brief, execution, evidence, review, candidate output, and
next-run readback.

Hard boundary: no dashboard, API server, MCP server, crawler, DB schema,
ranking rewrite, worker daemon, autonomous Memory Core mutation, broad
benchmark, or generic multi-agent runtime.

Outcome: DB-backed replay covered plan, brief, evidence, observe, reflect,
run show, and next-run brain search. It exposed missing knowledge-card coverage
for `end-to-end product loop`, weak reflection usefulness, and a too-vague
feedback candidate.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v369-end-to-end-product-loop-replay/REPORT.md
```

### V370-00 Graph Brain V1 Readback

Status: active.

Goal: strengthen graph-brain readback for entities, claims, relations,
temporal edges, contradictions, duplicates, and graph-aware search using
existing source-search/readback paths first.

Hard boundary: no dashboard, API server, MCP server, crawler, schema rewrite,
worker daemon, broad benchmark, autonomous Memory Core mutation, or generic
multi-agent runtime.

## Recent Completed Streams

```txt
V358: graph query-shape diagnostics closure.
V359-V360: Fallow quality gate and bounded legacy cleanup; full Fallow clean.
V361: source-search JSON answer packages expose read-only relationSupport.
V362: second local artifact ingest/readback and source chunk receiver fix.
V363: candidate-only brain heartbeat preview primitive.
V364: heartbeat preview CLI/readback.
V365: heartbeat preview review/eval closure.
V366: heartbeat preview golden behavior proof.
V367: consensus eval/candidate lane completion audit.
V368: brain search product surface preview.
V369: end-to-end product loop replay.
```

## Remaining Product Gaps

```txt
1. graph brain v1
2. ingest v0/v1
3. heartbeat/dreaming candidate runtime
4. pattern/research brain
5. real benchmarks
6. second-operator proof
7. product UI/API/MCP after usefulness/security gates
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
