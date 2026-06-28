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
active stream: V240 Default-Path Source-To-Decision Dogfood
current task: V240-00 Default-Path Source-To-Decision Dogfood
```

## Compact Completed Checkpoints

Detailed history stays in `PLANS.md`.

```txt
V02..V47: target/evidence/DB/activation/memory/source/internal-alpha complete.
V48..V99: source-to-decision, CI/eval, pattern matrix, TypeScript/security,
          source-map, skill, brain-battle, and context-hygiene guards complete.
V100..V239: active-surface, handoff, PLANS freshness, pattern-gate,
           TypeScript, source-map, ADR, skill, CI/eval, onboarding, infra,
           worker, security permission-boundary, root-plan headroom, and
           re-gate plus source-usefulness readback/producer and preview
           dogfood plus persisted readback dogfood and repo-root path
           normalization/readback guards plus best-pattern usefulness closure
           and closure dogfood plus TS best-pattern application and sibling
           package path normalization plus activation abstention re-gate,
           abstention diagnostics/readback, current-state activation seed, and
           default connected-project resolution complete.
```

## Active Stream

### V240 Default-Path Source-To-Decision Dogfood

Goal:

Use default `krn plan --persist` without explicit `--project` for the next
KRN-on-KRN slice, and prove the connected read model plus source-to-decision
pattern gate can guide a small real repair without manual UUID routing.

Current finding:

```txt
V239 repaired default connected-project resolution. Current-repo
`krn plan --persist` now selects project `7d9d103a-1a8e-4492-a4ca-db3a5589bd9b`,
loads repoInstallation `7a2f9ba6-8df8-48a8-bfb0-a54653ea91a3`, and renders
`inputStatus: candidates_available` without explicit `--project`.
```

Current action:

```txt
Execute V240-00: pick the smallest source-to-decision-backed KRN repair where
default connected planning should surface relevant owner files; use the pattern
gate, verify the repair, and report whether default-path KRN materially reduced
manual routing/review burden.
```

Primary consumer:

```txt
KRN self-dogfood planning, source-to-decision discipline, TypeScript/source
repair quality, and future best-pattern intake without manual project UUIDs.
```

Falsifier:

```txt
Default planning again requires manual `--project`, selected owner files are
irrelevant to the repair, or the slice adopts a pattern without a consumer and
falsifier.
```

## Pattern Gate

For non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven work,
apply: source -> mechanism -> KRN implication -> decision/rejection -> consumer
-> falsifier.

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
