# KRN Active Plan

Status: active compact root plan.

Date: 2026-06-27.

Repository: `/home/krn/coding/krn/active/mise-en-palace`.

Root `PLAN.md` is the product single source of truth. Long-running execution
details for the current goal live in:

```txt
docs/plans/v04-internal-brain-utility/PLANS.md
```

Do not create another parallel roadmap.

## Current Product State

Completed:

- V02-03 through V02-08 product-forward slices.
- V03-00 through V03-06 controlled-internal-alpha hardening.
- Headless `wilq-seo` target trial report as engineering evidence, not
  second-operator proof.

Current readiness:

```txt
controlled-internal-alpha for technical operators: yes
product-ready: no
widened internal alpha: no
V02-01 real second-operator proof: blocked/deferred
V04 internal brain utility: active
```

V02-01 can resume only with real second-operator inputs:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Do not substitute self/headless scenarios for V02-01.

## Active Goal: V04

V04 turns KRN into a more useful internal Codex operating layer by running a
repeatable improvement loop:

```txt
controlled scenario
  -> evidence
  -> finding
  -> condensation decision
  -> rule / skill / test / eval / memory candidate / source decision / repair
  -> next scenario
```

V04 is an internal engineering-proof stream. It is allowed to use self/headless
scenarios to improve KRN for our own workflows. It is not allowed to claim
product readiness or complete V02-01.

## V04 Queue

### V04-00 — Baseline Governance Reconciliation

Status: in progress.

Goal: reconcile dirty target-testing/runbook/report state and ensure root plan
points to the V04 ExecPlan without turning the root plan into a long ledger.

Expected outputs:

- `docs/plans/v04-internal-brain-utility/PLANS.md`;
- compact `PLAN.md` and `GOAL.md`;
- target repo testing runbook;
- corrected headless `wilq-seo` report boundary;
- second-operator runbook pointer to target repo testing rules.

### V04-01 — First Concrete Product Friction Repair

Status: pending.

Candidate: inspect whether generic `db:smoke` idempotency after fresh Docker
volume recovery is still a real friction. Repair it only if current evidence
confirms the gap.

### V04-02 — Controlled Scenario Factory

Status: pending.

Goal: define the minimal scenario contract for observation-only, repair-trial,
source-repair, and db-backed-replay modes.

### V04-03 — Knowledge Condensation Gate

Status: pending.

Goal: require every scenario report to decide whether findings stay as report
evidence or condense into AGENTS, skill, guard, eval, memory/source candidate,
hook candidate, or bounded repair.

### V04-04 — Skill-First KRN

Status: pending.

Goal: create or improve at most two repo skills/stable workflow surfaces,
starting with `target-repo-testing` and `evidence-review-loop` if evidence
still supports them.

### V04-05 — Controlled Scenario Batch

Status: pending.

Goal: plan at least six controlled scenarios and execute at least four unless
blocked.

Required coverage:

- KRN-on-KRN repair;
- DB-backed replay/readiness/smoke;
- headless target observation;
- skill/evidence-review loop.

### V04-06 — Guard/Eval From Real Evidence

Status: pending.

Goal: add or expand at least one deterministic guard/golden/eval case from V04
scenario evidence.

### V04-07 — Internal Brain Usefulness Re-Gate

Status: pending.

Goal: create a final V04 report deciding whether KRN became materially more
useful for our own workflows.

## Hard Non-Goals

Do not build or claim:

- fake V02-01 proof;
- product-ready status;
- dashboard;
- API server;
- MCP server;
- worker daemon;
- source crawler;
- broad eval platform;
- generic multi-agent system;
- runtime markdown memory;
- hidden semantic hooks;
- living target repo writes without explicit scope.

## Verification Policy

Use the narrowest relevant verification for each slice. For source changes,
run:

```sh
pnpm typecheck
pnpm test
git diff --check
```

For DB/eval-affecting changes, add relevant commands:

```sh
pnpm db:ready
pnpm db:smoke
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
```

After each bounded slice, commit, push, and confirm CI when appropriate.
