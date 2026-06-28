# KRN Active Plan

Status: active compact root plan. Date: 2026-06-27.

Repository: `/home/krn/coding/krn/active/mise-en-palace`.

Root `PLAN.md` is the compact product single source of truth. Detailed
continuous execution lives in `PLANS.md`.

Do not create another parallel roadmap.

## Current Product State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V305 Knowledge Cards No-Match Guidance
current task: V305-00 Knowledge Cards No-Match Guidance
```

## Compact Completed Checkpoints

Detailed history stays in `PLANS.md`.

```txt
V02..V47: target/evidence/DB/activation/memory/source/internal-alpha complete.
V48..V99: source-to-decision, CI/eval, pattern matrix, TypeScript/security,
          source-map, skill, brain-battle, and context-hygiene guards complete.
V100..V255: active-surface, handoff, PLANS freshness, pattern-gate,
           TypeScript, source-map, ADR, skill, CI/eval, onboarding, infra,
           worker, security permission-boundary, root-plan headroom, and
           re-gate plus source-usefulness readback/producer and preview
           dogfood plus persisted readback dogfood and repo-root path
           normalization/readback guards plus best-pattern usefulness closure
           and closure dogfood plus TS best-pattern application and sibling
           package path normalization plus activation abstention re-gate,
           abstention diagnostics/readback, current-state activation seed, and
           default connected-project resolution, and project resolution
           readback plus external TypeScript best-pattern intake,
           finite-state exhaustiveness application, Codex ExecPlan source
           decision guard, best-pattern surface re-gate, and source-decision
           owner-file seed repair plus observe-reflect sequencing guard and
           skill owner-file seed repair, activation surface re-gate,
           budget-priority guard, product-readiness re-gate, normalized target
           substrate/repair/replay baseline, and active ledger condensation
           complete.
```

## Active Stream

### V305 Knowledge Cards No-Match Guidance

Goal:

Make zero-result `krn knowledge cards` output useful for Pattern Application
Gate operators without adding semantic ranking, UI, API, MCP, or mutation.

Current finding:

```txt
V304 used the Pattern Application Gate on a bounded source slice and added
`--limit` to `krn knowledge cards`. The first pre-coding query was too narrow
and returned zero cards; useful patterns appeared only after broader follow-up
queries.
```

Current action:

```txt
Execute V305-00: add clear no-match guidance when `krn knowledge cards` returns
zero cards, keeping the command read-only and proof-bounded. The guidance should
help operators broaden filters or record an explicit rejection before coding.
Do not add semantic ranking, API/MCP/dashboard, source crawler, target writes,
or Memory Core mutation.
```

Primary consumer:

```txt
pattern application gate operator UX.
```

Falsifier:

```txt
Zero-result pattern queries still leave operators without bounded next steps, or
the command suggests stronger search/ranking guarantees than it actually has.
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

Do not build or claim: fake V02-01 proof, product-ready status, widened
internal alpha, dashboard, API server, MCP server, worker daemon, source
crawler, Research Foundry, broad eval platform, generic multi-agent system,
runtime markdown memory, hidden semantic hooks, living target repo writes
without explicit scope, large `AGENTS.md` expansion, or parallel roadmap.

## Verification Policy

Use the narrowest relevant verification for each slice.

If local Vitest or workspace tests fail with a temporary-directory write error,
set `TMPDIR` to a path outside this repository, for example:

```sh
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
```

Do not set `TMPDIR` under the repo checkout: CLI boundary tests rely on
outside-workspace temporary directories.

Docs/plan-only changes: `git diff --check`.
Source changes: `pnpm typecheck`, `pnpm test`, `git diff --check`.
DB/eval-affecting changes: `pnpm db:ready`, `pnpm db:smoke`,
`pnpm eval:promptfoo:smoke`.

After each bounded slice, commit, push, and confirm CI when appropriate. Use a
full `git rev-parse HEAD` SHA for `gh run list --commit`; if that is empty, use
branch readback and match `headSha`. Do not claim missing CI from short-SHA
lookup alone.
