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
active stream: V146 Post TypeScript Boundary Re-Scan Re-Gate
current task: V146-00 Post TypeScript Boundary Re-Scan Re-Gate
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
V100..V109: active-surface compactness, handoff contract, and PLANS freshness
           guards complete.
V110..V145: revision-note, checkpoint rollup, smoke coverage, pattern-gate,
           task-contract, final-response, TypeScript boundary, source trust
           metadata, pattern-intake output, source location scheme,
           source-to-decision skill, current-smoke description, Promptfoo
           adapter boundary, source classification, and latest-outcome
           source-to-decision, source-to-decision skill output, and
           source-class vocabulary, verification TMPDIR, and TypeScript
           boundary re-scan complete.
```

## Active Stream

### V146 Post TypeScript Boundary Re-Scan Re-Gate

Goal:

Decide the next bounded task after re-scanning TypeScript boundary drift without
turning practitioner/course guidance into broad type-audit bureaucracy.

Current finding:

```txt
V144 selected a TypeScript boundary re-scan because the next best-pattern
concern was whether Matt Pocock-style unknown-first and narrow-type discipline
still holds in production source. V145 found no production drift from the
guarded boundary rules.
```

Current action:

```txt
Execute V146-00: select the next pattern surface from evidence. Do not broaden
TypeScript boundary hygiene into broad type rewrites, audit theater, dashboard,
or benchmark lane.
```

Primary consumer:

```txt
One next-task/defer decision.
```

Falsifier:

```txt
The re-gate turns a clean TypeScript boundary re-scan into broad type-audit
bureaucracy without a concrete consumer and falsifier.
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
