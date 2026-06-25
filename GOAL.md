# Goal: Execute KRN Production Roadmap From Root PLAN.md

You are working in:

```txt
/home/krn/coding/krn/active/mise-en-palace
```

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

## Current Objective

Use root `PLAN.md` as the single source of truth for production roadmap
execution.

Do not continue from `docs/plans/memory-ideal-state/PLAN.md` as active context.
Historical plans, dogfood reports, ADRs, run ledgers, and raw materials are
evidence only unless root `PLAN.md` names them for a current task.

## First Active Task

```txt
E-00 — Security And Trust Boundary Review
```

B-00, B-01, B-02, B-03, B-04, C-00, C-01, C-02, C-03, D-00, D-01, D-02, and D-03 are complete. Current evidence:

```txt
docs/reviews/controlled-dogfood/2026-06-25-owner-file-recall-db-readiness/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-activation-owner-file-recall-repair/REPORT.md
docs/decisions/ADR-0021-temporal-claim-graph.md
docs/reviews/controlled-dogfood/2026-06-25-temporal-claim-edge-schema/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-research-to-brain-agents-guidance/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-memory-feedback-demotion-loop/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-anti-memory-conflict-integration/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-target-workers-harness-trial/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-init-connect-source-seed-hardening/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-governed-memory-activation-path/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-codex-brief-contract-hardening/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-golden-task-promotion-lane/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-promptfoo-adapter-boundary/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-run-evidence-readback/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-observability-read-models/REPORT.md
```

## Operating Rules

- Keep `GOAL.md` compact.
- Keep root `PLAN.md` as the execution map.
- Do not create `PLANS.md` or a parallel roadmap.
- Do not reopen archived historical task bodies as active work.
- Do not build dashboard, API, MCP server, worker runtime, source crawler,
  broad eval platform, `krn audit`, anti-slop scanner, or package source
  changes unless a named `PLAN.md` task authorizes them.
- Before each task, inspect git status and current source truth.
- After each completed task, verify, commit, push, and leave the worktree
  clean.
