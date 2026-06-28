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
active stream: V238 Current-State Activation Seed And Read-Model Decision
current task: V238-00 Current-State Activation Seed And Read-Model Decision
```

## Compact Completed Checkpoints

Detailed history stays in `PLANS.md`.

```txt
V02..V47: target/evidence/DB/activation/memory/source/internal-alpha complete.
V48..V99: source-to-decision, CI/eval, pattern matrix, TypeScript/security,
          source-map, skill, brain-battle, and context-hygiene guards complete.
V100..V237: active-surface, handoff, PLANS freshness, pattern-gate,
           TypeScript, source-map, ADR, skill, CI/eval, onboarding, infra,
           worker, security permission-boundary, root-plan headroom, and
           re-gate plus source-usefulness readback/producer and preview
           dogfood plus persisted readback dogfood and repo-root path
           normalization/readback guards plus best-pattern usefulness closure
           and closure dogfood plus TS best-pattern application and sibling
           package path normalization plus activation abstention re-gate and
           abstention diagnostics/readback complete.
```

## Active Stream

### V238 Current-State Activation Seed And Read-Model Decision

Goal:

Decide and execute the smallest existing path that gives the current KRN
project project kernel, repo installation, source seed, or owner-file activation
material.

Current finding:

```txt
V237 made abstention diagnostics visible and proved the active project currently
reports `empty_activation_store`: no memory, source claims, search documents,
owner-file candidates, anti-memory, target read model, source seeds, or owner
files.
```

Current action:

```txt
Execute V238-00: inspect existing init/connect/source-seed paths, seed/connect
the current repo only if an existing bounded path supports it, and prove a
DB-backed plan no longer reports `empty_activation_store` for a task that should
surface owner-file context.
```

Primary consumer:

```txt
KRN current-state planning context, source/memory activation, owner-file recall,
and future source repair selection.
```

Falsifier:

```txt
The slice invents a broad source crawler, rewrites scoring, or seeds unchecked
runtime memory instead of using/repairing the smallest existing current-repo
init/connect/read-model path.
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
