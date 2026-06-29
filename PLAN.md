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
active stream: V352 Source Search JSON Diagnostics Usefulness Closure
current task: V352-00 Source Search JSON Diagnostics Usefulness Closure
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
SearchDocuments. V345 proved reduced rereads for seeded Pattern Application
Gate questions. V346 added an answer package. V347 proved heartbeat/consensus
documents exist for specific queries and repaired broad-query guidance. V348
added typed JSON answer package readback without building a new product surface.
V349 proved a small consumer can use JSON without parsing text.

V350 outcome:

```txt
Five JSON answer packages were consumed without parsing text; all had answers,
proof boundaries, raw candidate inspectability, and lower parsing burden. The
batch exposed over-broad `missingEvidence` diagnostics for combined queries.
report: docs/reviews/controlled-dogfood/2026-06-29-v350-mini-brain-qa-json-batch-preview/REPORT.md
executionRun: 4127e542-3989-43fc-9d56-3b89688645b3
```

V351 outcome:

```txt
`missingEvidence` now derives from visible answer-package support counts.
Supported-document cases no longer look like no-document cases; graph-relations
still reports its real SearchDocument gap.
report: docs/reviews/controlled-dogfood/2026-06-29-v351-source-search-missing-evidence-specificity-repair/REPORT.md
executionRun: 26d4576a-14b2-4347-b4a8-8c3577859b5b
```

### V352 Source Search JSON Diagnostics Usefulness Closure

```txt
Execute V352-00: rerun a tiny JSON batch/readback after V351 and classify
whether repaired diagnostics reduce operator ambiguity. Do not change source
unless the closure falsifies V351.
```

Consumer: technical operators deciding whether source-search JSON is ready for
the next mini Brain-QA loop.

Falsifier: the same cases still require manual interpretation to distinguish
supported-document answers from real missing-document gaps.

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
