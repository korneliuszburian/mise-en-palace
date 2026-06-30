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
active stream: V376 Mini Brain-QA Benchmark Slice
current task: V376-00 Mini Brain-QA Benchmark Slice
```

## Compact Checkpoints

```txt
repo/current-truth hygiene: strong enough for continuation
evidence/review loop: DB-backed and useful for dogfood
candidate reviewability: core primitive
source-search readback: usable through CLI and JSON
brain-search preview: usable through CLI and JSON
product loop replay: DB-backed and inspectable
graph-brain readback: relation summary visible through source/brain search
ingest v0/v1: bounded loop readback visible through source artifact preview
heartbeat/dreaming: manual candidate-only runtime loop readback visible through heartbeat preview
heartbeat candidate review: one candidate can be reviewed/deferred with evidence result
source relation candidate evidence: missing relation evidence is explicit and blocks review-ready status
pattern/research brain: one official Codex hooks pattern retained with consumer/falsifier and knowledge-card readback
product-ready brain: not complete
```

## Active Task

### V376-00 Mini Brain-QA Benchmark Slice

Status: active.

Goal: run one compact mini Brain-QA benchmark/readback over existing KRN brain
knowledge and source-search surfaces.

Hard boundary: no broad benchmark platform, ranking rewrite, crawler, dashboard,
API server, MCP server, DB schema, worker daemon, source-truth mutation,
autonomous Memory Core mutation, or generic multi-agent runtime.

Latest completed report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v375-pattern-research-brain-intake-trial/REPORT.md
```

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
V370: graph brain v1 readback.
V371: ingest v0/v1 bounded input loop readback.
V372: heartbeat/dreaming manual candidate runtime-loop readback.
V373: heartbeat runtime candidate review-result loop.
V374: source relation candidate evidence repair.
```

## Remaining Product Gaps

```txt
1. real benchmarks
2. second-operator proof
3. product UI/API/MCP after usefulness/security gates
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
