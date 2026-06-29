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
active stream: V324 Graph Brain v0 SourceClaimEdge Readback Surface
current task: V324-00 Graph Brain v0 SourceClaimEdge Readback Surface
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
5. graph brain v0 readback/query surface
6. heartbeat/dreaming v0 as candidate generator
7. consensus v0 as eval/candidate layer
8. product UI/search/API/MCP after usefulness/security gates
```

## Active Stream

### V323 Graph Brain v0 Bounded Source Entity/Claim Edge Preview

Status: complete.

Outcome:

```txt
Report: docs/reviews/controlled-dogfood/2026-06-29-v323-graph-brain-v0-bounded-source-entity-claim-edge-preview/REPORT.md
`krn source artifact preview` now renders reviewable SourceClaimEdge
candidates and can persist/read back governed SourceClaimEdge rows when
complete explicit graph-edge fields are supplied. Live DB proof created
SourceClaimEdge 415321b3-4a26-4634-bfbe-38b756777d6a of kind `narrows` with
source ranges and does-not-prove metadata. No schema, graph runtime, crawler,
UI, API/MCP, worker daemon, consensus runtime, or Memory Core mutation.
```

### V324 Graph Brain v0 SourceClaimEdge Readback Surface

Goal:

Expose the persisted graph edge substrate through the smallest operator-facing
readback surface by claim id.

Current action:

```txt
Execute V324-00: add or extend an existing `krn source ...` readback command so
an operator can inspect SourceClaimEdges connected to a SourceClaim, including
edge kind, from/to ids, consumer, doesNotProve, and evidence/source-range
metadata. Use existing repository methods and tests; do not add graph ranking,
entity extraction, crawler, UI, API/MCP, worker daemon, consensus runtime, or
automatic Memory Core mutation.
```

Primary consumer:

```txt
future graph-aware retrieval, contradiction/duplicate detection, temporal
slices, consensus candidate evaluation, and product-facing knowledge search.
```

Falsifier:

```txt
Given a persisted SourceClaimEdge row, KRN cannot show the edge and its
governance metadata by SourceClaim id, or the readback implies graph truth,
ranking quality, or Memory Core mutation.
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
