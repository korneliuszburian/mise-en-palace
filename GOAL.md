# Goal: Execute V04 Internal Brain Utility

You are working in:

```txt
/home/krn/coding/krn/active/mise-en-palace
```

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

## Current Objective

Use root `PLAN.md` as the product single source of truth and execute the V04
long-run plan:

```txt
docs/plans/v04-internal-brain-utility/PLANS.md
```

V04 objective:

```txt
Make KRN materially more useful for our own Codex workflows by building a
repeatable internal brain-improvement loop:

controlled scenario
  -> evidence
  -> finding
  -> condensation decision
  -> durable surface or bounded repair
  -> next scenario
```

## Current State

```txt
V02-03..V02-08: complete.
V03-00..V03-06: complete.
V02-01 real second-operator trial: blocked/deferred.
V04 internal brain utility: active.
Current active slice: V04-00 — Baseline Governance Reconciliation.
```

V02-01 can resume only after real second-operator inputs exist:

```txt
operator:
KRN source:
target repo:
DB mode:
support boundary:
operator transcript:
```

Self/headless scenarios are engineering proof and knowledge-distillation
material. They must not be described as second-operator proof or product-ready
proof.

## Operating Rules

- Keep `GOAL.md` compact.
- Keep root `PLAN.md` compact and authoritative.
- Keep the detailed V04 ExecPlan under
  `docs/plans/v04-internal-brain-utility/PLANS.md`.
- Do not create another parallel roadmap.
- Do not reopen archived historical plans as active context.
- Do not build dashboard, API, MCP server, worker runtime, source crawler,
  broad eval platform, `krn audit`, anti-slop scanner, generic multi-agent
  system, runtime markdown memory, or hidden semantic hooks.
- Do not write to living target repos unless the active task explicitly allows
  target writes.
- After each bounded slice, verify, commit, push, and check CI when relevant.
- Do not mark V04 complete after one report, one repair, one skill, or one
  scenario. Completion requires the criteria in the V04 ExecPlan.

## Continuation After Compact

After auto-compact, resume, context loss, or a new `/goal` continuation:

1. Read `GOAL.md`, root `PLAN.md`, and
   `docs/plans/v04-internal-brain-utility/PLANS.md`.
2. Return to the current active slice first. Do not restart from old context,
   old reports, archived plans, or memory unless the current slice asks for it.
3. Inspect `git status --short --branch`, latest commits, and the V04 ExecPlan
   `Progress`, `Evidence Ledger`, `Decision Log`, and `Condensation Queue`.
4. If the previous slice was committed but not pushed or CI-checked, finish that
   before starting unrelated work.
5. If the current slice is complete, update progress, choose the next unmet V04
   criterion, and continue with the smallest evidence-backed product action.
6. Keep moving the project forward. Do not stop on a completed minor doc/report
   change unless verification, commit/push/CI, or a real blocker requires it.
7. When new evidence appears, add new bounded tasks to the V04 ExecPlan instead
   of bloating `GOAL.md` or root `PLAN.md`.
8. Condense knowledge continuously: repeated findings become a rule, skill,
   deterministic guard/eval, memory/source candidate, hook candidate, or a
   rejected/deferred decision with evidence.
9. Research is useful only when mapped through:

   ```txt
   source -> mechanism -> KRN implication -> decision/rejection -> falsifier
   ```

10. V04 is a self-improving loop. Each scenario should reduce future context
    waste, repeated explanation, review burden, or product uncertainty.
