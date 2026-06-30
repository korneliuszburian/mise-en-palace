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
active stream: V367 Consensus Eval/Candidate Lane
current task: V367-00 Consensus Eval/Candidate Lane
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

### V363-00 Heartbeat/Dreaming Candidate Generator V0

Status: complete.

Outcome: `@krn/workers` now exports `buildBrainHeartbeatPreview`, a pure
candidate-only aggregate over memory-staleness and source-relation heartbeat
previews with shared budget, proof/non-proof, reviewability, and mutation
boundaries.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v363-heartbeat-dreaming-candidate-generator/REPORT.md
```

### V364-00 Heartbeat Preview CLI Readback

Status: complete.

Outcome: `krn heartbeat preview` now exposes the V363 candidate-only heartbeat
preview as read-only Postgres operator output with evidence refs,
`doesNotProve`, reviewability, next action, and mutation boundaries.

Report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v364-heartbeat-preview-cli-readback/REPORT.md
```

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

Status: active.

Goal: add the smallest candidate-only consensus/eval surface that can evaluate
bounded claim or candidate disagreements without producing final truth,
mutating Memory Core, starting agent runtime, or creating a broad consensus
platform.

Hard boundary: no autonomous Memory Core mutation, worker daemon, scheduler,
crawler, embeddings, schema, ranking rewrite, UI/API/MCP, broad benchmark, or
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
```

## Remaining Product Gaps

```txt
1. consensus eval/candidate lane
2. product UI/search/API/MCP after usefulness/security gates
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
