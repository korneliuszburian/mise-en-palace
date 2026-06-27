# KRN Onboarding

## First Read

1. `AGENTS.md`.
2. `docs/KRN_KERNEL.md`.
3. The specific doc or skill needed for the current task.

Do not start from `docs/materials/` unless the task is source audit,
reconciliation, or doctrine recovery.

## Current State

This repo is past bootstrap. It is a controlled-internal-alpha KRN workspace for
technical operators, not product-ready and not widened internal alpha.

Current durable surfaces include:

- compact root `GOAL.md` / `PLAN.md` active truth;
- detailed continuous execution in `PLANS.md`;
- kernel contract and raw source quarantine;
- source-to-decision and pattern-intake gates;
- repo-local skills for repeated KRN workflows;
- store-backed memory/source/evidence/review primitives;
- DB-backed replay and smoke paths;
- target-repo testing guidance;
- brain-battle/golden behavior guards;
- TypeScript boundary and skill invariants.

External second-operator proof remains blocked/deferred until real operator
inputs and a transcript exist.

## How To Work Here

- Keep context selected and small.
- Map sources to mechanisms and decisions.
- Keep memory runtime store-backed.
- Treat files as exports, docs, seeds, or audit trails.
- Prefer Codex-native surfaces before inventing new ones.
- Use skills for reusable workflows.
- Use subagents only for explicit, bounded work.
- Keep review burden and diff risk visible.

## First Dogfood Path

Use the current active stream in root `PLAN.md`; do not start from an old
dogfood recipe. A normal KRN-on-KRN slice now follows:

```text
read active GOAL.md / PLAN.md / PLANS.md
apply the relevant skill and pattern gate
make one bounded repair or guard
run focused verification plus typecheck/test when source changes
capture evidence or record proof/non-proof boundaries
append outcome and next task to PLANS.md
commit, push, and check CI when relevant
```

If the work depends on courses, papers, official docs, practitioner writing,
target evidence, or local reports, route it through:

```text
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```
