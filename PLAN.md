# KRN Active Plan

Status: active compact root plan.

Date: 2026-06-27.

Repository: `/home/krn/coding/krn/active/mise-en-palace`.

Root `PLAN.md` is the compact product single source of truth. Detailed
continuous execution lives in:

```txt
PLANS.md
```

Do not create another parallel roadmap.

## Current Product State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
active stream: V160 Post Continuation Pattern Gate Chain Re-Gate
current task: V160-00 Post Continuation Pattern Gate Chain Re-Gate
```

## Compact Completed Checkpoints

Detailed history stays in `PLANS.md`.

```txt
V02..V47: target-aware evidence, DB replay, activation, memory/source,
          target workflow, and controlled internal alpha hardening complete.
V48..V63: continuous pattern source-to-decision gate, CI/eval gates,
          operator packet refresh, and pattern intake runbook complete.
V64..V84: pattern surface matrix, TypeScript/security trust repairs,
          source map guard, active plan guard, and skill invariant guard complete.
V85..V92: authority ID branding for anti-memory, evidence spine,
          source decisions, and eval/policy surfaces complete.
V93..V99: brain-battle matrix guard, context hygiene guard,
          active plan completion guard, and full source-map mapping guard complete.
V100..V159: active-surface compactness, handoff, PLANS freshness,
           source-to-decision, TypeScript, source trust/classification,
           verification TMPDIR, stale-objective, progress stale-active,
           root/smoke/compact/continuation pattern-gate guards complete.
```

## Active Stream

### V160 Post Continuation Pattern Gate Chain Re-Gate

Goal:

Decide the next bounded task after preserving the full pattern-gate chain in
compact continuation instructions.

Current finding:

```txt
V158 selected continuation pattern-gate chain repair because root `GOAL.md`
operating rules had the full consumer/falsifier chain, but the continuation
research note still used the older no-consumer chain.
```

Current action:

```txt
Execute V160-00: select the next pattern surface from evidence. Do not broaden
continuation-chain preservation into prompt bureaucracy, Research Foundry,
source crawler, dashboard, or product-readiness claims.
```

Primary consumer:

```txt
One next-task/defer decision.
```

Falsifier:

```txt
The re-gate turns focused continuation-chain preservation into prompt
bureaucracy or research hoarding without a concrete consumer and falsifier.
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

Do not build or claim:

- fake V02-01 proof;
- product-ready status;
- widened internal alpha;
- dashboard;
- API server;
- MCP server;
- worker daemon;
- source crawler;
- Research Foundry;
- broad eval platform;
- generic multi-agent system;
- runtime markdown memory;
- hidden semantic hooks;
- living target repo writes without explicit scope;
- large `AGENTS.md` expansion;
- parallel roadmap.

## Verification Policy

Use the narrowest relevant verification for each slice.

If local Vitest or workspace tests fail with a temporary-directory write error,
set `TMPDIR` to a path outside this repository, for example:

```sh
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
```

Do not set `TMPDIR` under the repo checkout: CLI boundary tests rely on
outside-workspace temporary directories.

Docs/plan-only changes:

```sh
git diff --check
```

Source changes:

```sh
pnpm typecheck
pnpm test
git diff --check
```

DB/eval-affecting changes:

```sh
pnpm db:ready
pnpm db:smoke
pnpm eval:promptfoo:smoke
```

After each bounded slice, commit, push, and confirm CI when appropriate.
