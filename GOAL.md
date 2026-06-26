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

## Current State

```txt
V02-02 — Brain Battle Eval Matrix And Guarded Eval Harness is complete.
V02-03 — Run Readback And Source Rejection Guard Expansion is complete.
V02-04 — Memory Feedback And Anti-Memory Guard Expansion is complete.
V02-05 — Codex Brief And Context ROI Guard Expansion is complete.
V02-06 — Operator-Facing Readback / Doctor Friction Repair is complete.
V02-07 — Target Battle Trial Packet Refresh is complete.
V02-08 — Controlled Alpha Re-Gate After Brain Battle Guards is complete.
V03-00 — Local DB Bootstrap And Doctor Recovery is complete.
V03-01 — Target Fixture Battle Harness is complete.
V03-02 — Target Owner-File Recall Below Named Roots is active.
Next active slice: V03-02 — Target Owner-File Recall Below Named Roots.
V02-01 — Real Second-Operator Controlled Alpha Trial remains blocked/deferred.
```

V02-01 can resume only after the operator supplies or approves:

```txt
operator:
KRN source: existing tag / current main / other
target repo:
DB mode: local Docker/Postgres / preview only
support boundary:
```

Do not substitute V02-02 or local docs/source work for real V02-01 proof.
The operator authorized continuous V02 product-forward slices while V02-01 is
blocked. Continue from root `PLAN.md` and do not stop after one completed slice.

B-00, B-01, B-02, B-03, B-04, C-00, C-01, C-02, C-03, D-00, D-01, D-02, D-03, E-00, E-01, E-02, F-00, F-01, F-02, G-00, G-01, G-02, G-03, G-04, V01-00, V01-01, V01-02, V01-03, V01-R01, V01-04, and V02-00 are complete. Current evidence:

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
docs/reviews/controlled-dogfood/2026-06-25-security-trust-boundary-review/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-policy-hooks-boundary/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-worker-runtime-acceptance-gate/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-read-only-run-readback-boundary/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-codex-automation-boundary/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-dashboard-readiness-gate/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-ci-verification-pipeline/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-migration-backup-policy/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-internal-alpha-packaging/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-internal-alpha-release-gate/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-v0-1-roadmap-gate/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-external-target-muke-v2/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-operator-beyond-author/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-target-trust-redaction/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-activation-reflection-usefulness-decision/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-target-activation-read-model/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-internal-alpha-re-gate-after-v01/REPORT.md
docs/reviews/controlled-dogfood/2026-06-25-internal-alpha-runbook-friction/REPORT.md
```

The V02 product-forward rescope queue is complete through V02-08. The
operator-authorized V03 product-forward continuation is active in root
`PLAN.md`; V03-00 is complete and V03-01 is next. Continue with the
internal alpha second-operator trial only after the operator supplies or
approves the trial setup. Do not move the alpha tag unless explicitly asked.

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
- After the first active task is complete, continue to the next unchecked
  `PLAN.md` task. Do not treat one slice as completion of this roadmap goal.
