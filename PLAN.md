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
active stream: V134 Post Promptfoo Adapter Boundary Guard Re-Gate
current task: V134-00 Post Promptfoo Adapter Boundary Guard Re-Gate
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
V110..V133: revision-note, checkpoint rollup, smoke coverage, pattern-gate,
           task-contract, final-response, TypeScript boundary, source trust
           metadata, pattern-intake output, source location scheme,
           source-to-decision skill, current-smoke description, and Promptfoo
           adapter boundary guards complete.
```

## Active Stream

### V134 Post Promptfoo Adapter Boundary Guard Re-Gate

Goal:

Decide the next bounded task after guarding the Promptfoo adapter boundary
without turning Promptfoo into a broad eval platform or behavior authority.

Current finding:

```txt
V132 selected Promptfoo adapter boundary alignment as the next bounded eval
surface. V133 strengthened the brain-battle matrix invariant so Promptfoo smoke
must remain an integration smoke/result adapter and cannot be confused with KRN
behavior proof.
```

Current action:

```txt
Execute V134-00: select the next pattern surface from evidence. Do not broaden
Promptfoo into a behavior authority, LLM judge, dashboard, benchmark lane, or
hosted eval platform.
```

Primary consumer:

```txt
One next-task/defer decision.
```

Falsifier:

```txt
The re-gate turns focused Promptfoo boundary guarding into Promptfoo authority
or broad eval platform work without a concrete consumer.
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
