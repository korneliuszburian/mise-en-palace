# KRN Active Plan

Status: active compact root plan. Date: 2026-06-27.

Root `PLAN.md` is the compact product single source of truth. Detailed
continuous execution lives in `PLANS.md`.

Do not create another parallel roadmap.

## Current Product State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V323 Graph Brain v0 Bounded Source Entity/Claim Edge Preview
current task: V323-00 Graph Brain v0 Bounded Source Entity/Claim Edge Preview
```

## Compact Completed Checkpoints

Detailed history stays in `PLANS.md`.

```txt
repo/current-truth hygiene: complete enough for continuation
evidence/review loop: DB-backed and useful for dogfood
candidate reviewability: core primitive
pattern gate/readback: active hardening stream
product-ready brain: not complete
```

Remaining product gaps:

```txt
1. pattern search/readback hardening
2. research/paper/course source decisions
3. mini brain-QA benchmark
4. ingest v0 activation/readback closure
5. graph brain v0
6. heartbeat/dreaming v0 as candidate generator
7. consensus v0 as eval/candidate layer
8. product UI/search/API/MCP after usefulness/security gates
```

## Active Stream

### V321 Ingest v0 Activation Over Persisted Source State

Status: complete.

Outcome:

```txt
Report: docs/reviews/controlled-dogfood/2026-06-29-v321-ingest-v0-activation-over-persisted-source-state/REPORT.md
SourceArtifact/Chunk/SearchDocument/Claim/DecisionEdge readback works.
`krn plan --persist` activates persisted SourceClaims. `krn run show` now
exposes context details. Plan lexical search over the artifact SearchDocument
still reports search=0.
```

### V322 Activation Lexical Search Over Persisted Local Source Documents

Status: complete.

Outcome:

```txt
Report: docs/reviews/controlled-dogfood/2026-06-29-v322-activation-lexical-search-over-persisted-local-source-documents/REPORT.md
`krn plan --persist` now retries empty lexical source search with explicit
marker/hash terms. Live DB readback showed search=5 and exposed persisted local
artifact SearchDocument ccc44d6d-18ae-4b15-81cb-d948ea09b721 as an over-budget
context exclusion.
```

### V323 Graph Brain v0 Bounded Source Entity/Claim Edge Preview

Goal:

Start the first bounded graph-brain preview over local source state by producing
reviewable entity/claim/edge candidates with source ranges.

Current action:

```txt
Execute V323-00: use one small persisted local source artifact corpus and add
the smallest graph preview/readback path needed to represent entity/claim/edge
candidates. No crawler/UI/API/MCP/worker daemon/consensus runtime/automatic
Memory Core mutation.
```

Primary consumer:

```txt
future graph-aware retrieval, contradiction/duplicate detection, temporal
slices, consensus candidate evaluation, and product-facing knowledge search.
```

Falsifier:

```txt
Given a small source artifact with named entities and claims, KRN cannot produce
reviewable candidate graph facts with source ranges and does-not-prove
boundaries, or it mutates final memory/graph truth without review.
```

## Pattern Gate

For non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven work,
apply: source -> mechanism -> KRN implication -> decision/rejection -> consumer
-> falsifier.

Pattern application gate:

```txt
before coding:
  query helped retained patterns;
  select 1-5 expected-use patterns or explicitly reject/defer them.

after verification:
  classify selected patterns as helped / neutral / noise / missing / stale;
  record proof and does-not-prove boundaries.
```

## External Input Blocker

Status: deferred boundary, not the current internal stream.

V02-01 still requires real second-operator inputs:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Do not substitute self/headless scenarios for V02-01.

## Hard Non-Goals

Do not build or claim: fake V02-01 proof, product-ready status, dashboard,
API/MCP, worker, crawler, Research Foundry, broad eval, generic multi-agent,
runtime markdown memory, hidden semantic hooks, unsafe target writes, large
`AGENTS.md`, or parallel roadmap.

## Verification Policy

Use the narrowest relevant verification for each slice.

If local Vitest or workspace tests fail with a temporary-directory write error,
use `TMPDIR=/home/krn/.cache/krn-tmp pnpm test`. Do not set `TMPDIR` under the repo checkout: CLI boundary tests rely on outside-workspace temporary directories.

Docs/plan-only changes: `git diff --check`.
Source changes: `pnpm typecheck`, `pnpm test`, `git diff --check`.
DB/eval-affecting changes: `pnpm db:ready`, `pnpm db:smoke`,
`pnpm eval:promptfoo:smoke`.

After each bounded slice, commit, push, and confirm CI when appropriate. Use a
full `git rev-parse HEAD` SHA for `gh run list --commit`; if that is empty, use
branch readback and match `headSha`. Do not claim missing CI from short-SHA
lookup alone.
