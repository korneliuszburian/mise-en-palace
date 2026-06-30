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
active stream: V368 Brain Search Product Surface Preview
current task: V368-00 Brain Search Product Surface Preview
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

### V365-00 Heartbeat Preview Review/Eval Closure

Status: complete.

Outcome: heartbeat preview now emits and renders a read-only
`reviewEvalClosure` decision with next action, evidence refs, does-not-prove,
candidate ids, mutation boundary, and forbidden writes.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v365-heartbeat-preview-review-eval-closure/REPORT.md
```

### V366-00 Heartbeat Preview Golden Behavior Proof

Status: complete.

Goal: add one bounded behavior proof that fails if heartbeat preview stops
emitting candidate-only review/eval closure output with evidence refs,
`doesNotProve`, reviewability, next action, and no mutation.

Hard boundary: no autonomous Memory Core mutation, worker daemon, scheduler,
crawler, embeddings, schema, ranking rewrite, UI/API/MCP, broad benchmark, or
consensus runtime.

Outcome: workers heartbeat preview tests now include a focused behavior proof
for exact `reviewEvalClosure` output, review-ready candidates, evidence refs,
`doesNotProve`, next action, forbidden writes, and no mutation.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v366-heartbeat-preview-golden-behavior-proof/REPORT.md
```

### V367-00 Consensus Eval/Candidate Lane

Status: complete.

Goal: add the smallest candidate-only consensus/eval surface that can evaluate
bounded claim or candidate disagreements without producing final truth,
mutating Memory Core, starting agent runtime, or creating a broad consensus
platform.

Hard boundary: no autonomous Memory Core mutation, worker daemon, scheduler,
crawler, embeddings, schema, ranking rewrite, UI/API/MCP, broad benchmark, or
multi-agent runtime.

Outcome: current-state audit verified V339 already provides the bounded
candidate-only consensus/eval lane through
`buildConsensusCandidateEvaluationPreview`.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v367-consensus-eval-candidate-lane/REPORT.md
```

### V368-00 Brain Search Product Surface Preview

Status: active.

Goal: expose the smallest product-facing brain search/readback surface over
existing source-search and knowledge-card outputs without adding a dashboard,
API server, MCP server, crawler, schema, ranking rewrite, or autonomous
runtime.

Hard boundary: use existing CLI/readback surfaces first; no new product server,
MCP server, DB schema, crawler, broad benchmark, or ranking rewrite.

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
```

## Remaining Product Gaps

```txt
1. brain search product surface preview
2. product UI/API/MCP after usefulness/security gates
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
