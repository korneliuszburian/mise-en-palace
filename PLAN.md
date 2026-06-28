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
active stream: V250 Product Readiness Re-Gate
current task: V250-00 Product Readiness Re-Gate After Activation Guards
```

## Compact Completed Checkpoints

Detailed history stays in `PLANS.md`.

```txt
V02..V47: target/evidence/DB/activation/memory/source/internal-alpha complete.
V48..V99: source-to-decision, CI/eval, pattern matrix, TypeScript/security,
          source-map, skill, brain-battle, and context-hygiene guards complete.
V100..V241: active-surface, handoff, PLANS freshness, pattern-gate,
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
           skill owner-file seed repair, activation surface re-gate, and
           budget-priority guard complete.
```

## Active Stream

### V250 Product Readiness Re-Gate

Goal:

Decide the next product-readiness blocker after activation seed and budget
guards, without claiming product-ready from internal dogfood alone.

Current finding:

```txt
V245/V247 repaired read-model seed gaps and V249 added a budget-priority guard
without needing a runtime scoring rewrite. The next decision should be a product
readiness re-gate, not another activation tweak by default.
```

Current action:

```txt
Execute V250-00: compare current proof against product-readiness requirements
and choose one next blocker: target trial, second-operator launch, reflection /
candidate quality, activation evidence, or explicit defer.
```

Primary consumer:

```txt
PLAN/PLANS next product stream and product-readiness status.
```

Falsifier:

```txt
V250 claims product-ready or opens new product work without requirement-by-
requirement evidence.
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
