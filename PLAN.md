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
active stream: V330 Edge-Aware SourceClaim Candidate Ranking Lab
current task: V330-00 Edge-Aware SourceClaim Candidate Ranking Lab
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
5. graph brain v0 candidate extraction/reviewability/persistence surface
6. heartbeat/dreaming v0 as candidate generator
7. consensus v0 as eval/candidate layer
8. product UI/search/API/MCP after usefulness/security gates
```

## Active Stream

Recent graph-brain outcomes:

```txt
V324 complete: SourceClaimEdge readback by SourceClaim id.
V325 complete: candidate-only local extraction preview.
V326 complete: ready vs deferred extraction claim reviewability gate.
V327 complete: reviewed selected extraction candidate persistence bridge.
V328 complete: source extraction fence-state carryover repair.
V329 complete: graph-aware SourceClaimEdge adjacent context readback.
Reports: docs/reviews/controlled-dogfood/2026-06-29-v324-...,
docs/reviews/controlled-dogfood/2026-06-29-v325-...,
docs/reviews/controlled-dogfood/2026-06-29-v326-...,
docs/reviews/controlled-dogfood/2026-06-29-v327-...,
docs/reviews/controlled-dogfood/2026-06-29-v328-...,
docs/reviews/controlled-dogfood/2026-06-29-v329-...
```

### V330 Edge-Aware SourceClaim Candidate Ranking Lab

Goal:

Add a bounded behavior lab/proof that a source claim connected through a
persisted `SourceClaimEdge` can be represented as edge-aware ranking/readback
input without claiming production graph retrieval quality.

Current action:

```txt
Execute V330-00: inspect activation ranking/readback seams and add the smallest
lab/proof for edge-aware source candidate input. Do not add schema, graph
database, crawler, UI/API/MCP, worker daemon, consensus runtime, broad ranking
rewrite, or Memory Core mutation.
```

Primary consumer:

```txt
future source artifact ingest, graph-aware retrieval, contradiction/duplicate
detection, temporal slices, consensus candidate evaluation, and product-facing
knowledge search.
```

Falsifier:

```txt
Given source claims connected by SourceClaimEdge, KRN can represent edge-aware
source candidate influence in a bounded lab/readback without pretending product
graph retrieval quality exists.
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
