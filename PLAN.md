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
active stream: V346 Source Search Answer Package Preview
current task: V346-00 Source Search Answer Package Preview
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
4. ingest v0 SourceClaim/SearchDocument usefulness after retrieval alignment
5. graph brain v0 candidate extraction/reviewability/persistence surface
6. heartbeat/dreaming v0 as candidate generator
7. consensus v0 as eval/candidate layer
8. product UI/search/API/MCP after usefulness/security gates
```

## Active Stream

V324-V339 complete: graph/source-edge, heartbeat, consensus, and tiny QA
previews exist without autonomous truth runtime. V340 proved one artifact-to-
activated-SourceClaim loop. V341 added `krn source search --query`. V342 showed
coverage gaps. V343 seeded four artifacts. V344 repaired source-search document
retrieval alignment so seeded natural-language queries return matching
SearchDocuments. V345 proved the repaired search reduces rereads for seeded
Pattern Application Gate questions but still leaves operators manually
synthesizing raw candidate lists.

### V346 Source Search Answer Package Preview

Goal:

Add a bounded read-only answer package preview over existing `krn source search`
results.

Current action:

```txt
Execute V346-00: render a compact answer package from existing source-search
results with supporting claims, supporting documents, neutral/noise, missing
evidence, does-not-prove, and recommended next action. Do not add crawler,
UI/API/MCP, worker daemon, schema, broad eval platform, ranking rewrite,
embeddings, graph runtime, autonomous truth runtime, or Memory Core mutation.
```

Primary consumer:

```txt
technical operators using source search as a pre-coding Pattern Application
Gate.
```

Falsifier:

```txt
The answer package hides proof/non-proof boundaries, overclaims source truth, or
does not reduce rereads compared with raw source-search output.
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
