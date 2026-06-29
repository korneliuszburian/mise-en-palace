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
active stream: V339 Consensus Candidate Evaluation Preview
current task: V339-00 Consensus Candidate Evaluation Preview
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
V330 complete: bounded edge-aware source candidate ranking lab.
V331 complete: persisted edge-aware activation readback.
V332 complete: edge-aware source candidate refinement without lab-seeded duplicate row.
V333 complete: edge-aware activation usefulness closure showed review-useful
  edge metadata and top ordering, but not inclusion delta.
V334 complete: edge-aware selection delta proof showed SourceClaimEdge influence
  can change the bounded working set against a no-edge baseline.
V335 complete: tiny graph-brain QA proof showed edge-aware context can select
  the answer-grounding SourceClaim while the no-relation baseline cannot.
V336 complete: relation-grounded QA readback helper and golden case protect the
  baseline-vs-edge answer delta.
V337 complete: source-relation heartbeat preview proposes reviewable
  maintenance candidates without source truth or Memory Core mutation.
V338 complete: memory-staleness heartbeat preview proposes reviewable
  MemoryRecord maintenance candidates without Memory Core mutation.
Reports: docs/reviews/controlled-dogfood/2026-06-29-v324-... through v338-...
```

### V339 Consensus Candidate Evaluation Preview

Goal:

Add the first bounded consensus/eval preview for candidate review.

Current action:

```txt
Execute V339-00: inspect candidate reviewability/eval surfaces, then add the
smallest preview that evaluates a candidate with preserved dissent and
proof/non-proof boundaries. Do not add consensus agents, autonomous truth
runtime, schema, worker daemon, UI/API/MCP, crawler, or broad benchmark lane.
```

Primary consumer:

```txt
future consensus v0, source/pattern/candidate review, review gates, and
product-facing knowledge search.
```

Falsifier:

```txt
Given a reviewable candidate with supporting and dissenting evidence, KRN cannot
produce a candidate-only consensus/eval preview that preserves dissent,
decision options, evidence refs, and does-not-prove boundary.
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
