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
active stream: V110 Post PLANS Revision Note Freshness Re-Gate
current task: V110-00 Post PLANS Revision Note Freshness Re-Gate
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
V100-00: post source map full mapping guard re-gate complete.
V101-00: active surface compactness guard complete.
V102-00: post active surface compactness guard re-gate complete.
V103-00: handoff compact contract guard complete.
V104-00: post handoff compact contract guard re-gate complete.
V105-00: PLANS compact GOAL contract freshness guard complete.
V106-00: post PLANS compact GOAL contract freshness re-gate complete.
V107-00: PLANS known current gap freshness guard complete.
V108-00: post PLANS known current gap freshness re-gate complete.
V109-00: PLANS revision note freshness guard complete.
```

## Active Stream

### V110 Post PLANS Revision Note Freshness Re-Gate

Goal:

Decide the next bounded task after reframing stale revision-note active-stream
wording as historical creation-time context.

Current finding:

```txt
V108 found that `PLANS.md` section 23 still said the plan sets V05 as the next
active stream. V109 reframed that note as creation-time history and added a
focused active-plan invariant.
```

Current action:

```txt
Execute V110-00: select the next pattern surface from evidence. Do not broaden
revision-note freshness into rewriting historical outcomes.
```

Primary consumer:

```txt
One next-task/defer decision.
```

Falsifier:

```txt
The re-gate opens another PLANS freshness task without a concrete stale-guidance
falsifier in default resume context.
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
