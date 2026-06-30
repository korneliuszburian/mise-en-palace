# KRN Active Plan

Status: active compact root plan. Date: 2026-06-30.

Root `PLAN.md` is the compact product source of truth. Detailed history stays in `PLANS.md`.
Current-task contracts live in `PLANS.md`.

## Product State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
external/foreign second-operator proof: rejected as wrong product forcing function
active stream: Internal Multi-Repo Operator Loop
current task: IMR-00 Internal Multi-Repo Operator Loop
```

## Compact Checkpoints

```txt
repo/current-truth hygiene: strong enough for continuation
evidence/review loop: DB-backed and useful for dogfood
candidate reviewability: core primitive
source-search readback: usable through CLI and JSON
brain-search preview: usable through CLI and JSON
brain-search selected knowledge: usable pattern packet in preview output
product loop replay: DB-backed and inspectable
graph-brain readback: relation summary visible through source/brain search
ingest v0/v1: bounded loop readback visible through source artifact preview
heartbeat/dreaming: manual candidate-only runtime loop readback visible through heartbeat preview
heartbeat candidate review: one candidate can be reviewed/deferred with evidence result
source relation candidate evidence: missing relation evidence is explicit and blocks review-ready status
pattern/research brain: one official Codex hooks pattern retained with consumer/falsifier and knowledge-card readback
mini brain-QA benchmark: six current local questions ran through brain search JSON readback
brain-QA pattern coverage: graph relation and heartbeat candidate-only runtime patterns retained; ingest pattern deferred until it changes a decision
second-operator launch packet: historical packet only; no longer active direction
product-ready brain: not complete
```

## Active Task

### IMR-00 Internal Multi-Repo Operator Loop

Status: active.

Goal: build the shared KRN brain kernel as the foundation for future
agentic/harness work and prove it through internal multi-repo use.

Hard boundary: do not build dashboard, API, MCP, worker daemon, crawler, broad
eval platform, DB schema, or product server. Do not create synthetic proof. Use
real repo work, real evidence, and compact reports.

Latest completed report:

```txt
docs/reviews/controlled-dogfood/2026-06-30-v378-second-operator-launch-packet/REPORT.md
```

Historical launch packet:

```txt
docs/operator-trials/v02-01-second-operator-launch-packet.md
```

Next slice should exercise the brain loop:

```txt
plan -> context -> Codex brief -> execution -> evidence -> review
-> candidates -> promotion/rejection -> next-run reuse or explicit abstention
```

The point is not "operator proof" by itself. The point is a multi-layer memory
system that condenses best patterns, papers, courses, local evidence, and senior
engineering standards into reusable decisions that improve future work.

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
V375: Codex hook guardrail pattern intake.
V376: mini Brain-QA benchmark/readback over six current local questions.
V377: retained graph relation readback and heartbeat candidate-only runtime
  patterns from the V376 benchmark gap; ingest pattern deferred.
V378: prepared current second-operator launch packet without claiming V02-01.
IMR-01: brain search now exposes selected brain knowledge packets for agent use.
```

## Remaining Product Gaps

```txt
1. shared brain kernel vertical loop
2. pattern/research brain continuously applied to code quality
3. graph/ingest/heartbeat/consensus vertical loops
4. product UI/API/MCP after usefulness/security gates
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
