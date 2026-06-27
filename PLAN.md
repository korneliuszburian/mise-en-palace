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
active stream: V130 Post Source-To-Decision Skill Contract Guard Re-Gate
current task: V130-00 Post Source-To-Decision Skill Contract Guard Re-Gate
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
V110..V129: revision-note, checkpoint rollup, smoke coverage, pattern-gate,
           task-contract, final-response, TypeScript boundary, source trust
           metadata, pattern-intake output, source location scheme, and
           source-to-decision skill guards complete.
```

## Active Stream

### V130 Post Source-To-Decision Skill Contract Guard Re-Gate

Goal:

Decide the next bounded task after guarding the source-to-decision skill
contract without turning source intake into a crawler, freshness scanner, source
archive, or skill sprawl.

Current finding:

```txt
V128 selected the source-to-decision skill as the next bounded pattern surface.
V129 strengthened the skill invariant so the skill must keep pattern-intake
routing, anti-source-hoarding rules, legal/course boundaries, output fields,
decision kind, consumer/falsifier gate, and candidate reviewability labels.
```

Current action:

```txt
Execute V130-00: select the next pattern surface from evidence. Do not broaden
source intake into Research Foundry, crawler, decorative source archive,
freshness scanner, paid-course transcription, or extra skills without repeated
workflow evidence.
```

Primary consumer:

```txt
One next-task/defer decision.
```

Falsifier:

```txt
The re-gate turns focused source-to-decision skill guarding into source crawling,
source archival work, or skill sprawl without a concrete consumer.
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
