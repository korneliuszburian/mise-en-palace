# KRN Active Execution Ledger

Status: compact active ledger. Date: 2026-07-03.

Root `GOAL.md` is the continuous objective. Root `PLAN.md` is the compact
product source of truth. This file keeps only current execution state, task
contract requirements, and handoff requirements. Detailed completed history is
archived under `docs/archive/ledgers/`.

## Current State

```txt
controlled-internal-alpha for technical operators: yes / stronger
product-ready: no
widened internal alpha: no
external/foreign second-operator proof: rejected as wrong product forcing function
active stream: Shared Brain Vertical Loop
current task: Cleanup wave checkpoint and next bounded task selection
latest pushed commit: see git history
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

Known current gap:

```txt
Cleanup wave checkpoint and next bounded task selection is active.
The Fallow cleanup slice is closed; commit/push before selecting another
bounded task.
```

## 2. Product Thesis

KRN is a Codex Operating Layer / AI Engineering Control Plane.

Codex executes. KRN supplies bounded context, store-backed memory, source
grounding, policy, skills, eval expectations, traces, review gates, and
feedback.

Current useful loop:

```txt
bounded product slice
-> source/pattern decision when relevant
-> implementation
-> verification
-> compact evidence
-> next bounded task
```

Avoid guard-only treadmill work. A task must close a usefulness loop, improve a
bounded product surface, or unblock the next vertical slice.

Pattern intake and retained source decisions use
`docs/runbooks/pattern-intake.md` and the Surface Consumer Matrix.

For non-trivial infra, harness, CI/eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven work:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

## Source-To-Decision Record

Source-to-decision:

- Source: repository health audit finding that Fallow runs changed-file-only in
  CI and `usedClassMembers` can preserve zombie repository writer methods.
- Mechanism: run the full Fallow audit, prune specific source-writer allowlist
  entries, and keep only allowlist entries backed by an executing consumer.
- KRN implication: dead-code evidence becomes harder to mask behind historical
  allowlists.
- Decision: Fallow findings are review evidence; the named source writer
  allowlist removals were rejected because current code has live consumers.
- Does not prove: the whole repository has no dead code, or that all DB tables
  have a live product path.
- Consumer: CI quality gate, cleanup Beads, and future dead-code deletion
  decisions.
- Falsifier: full Fallow stays green while a removed allowlist entry is still
  needed by a live repository implementation.

## Active Task

### Cleanup Wave Checkpoint

Status: in_progress

Goal: commit and push the verified cleanup wave.

Product rationale: do not keep a large verified cleanup wave stranded locally.

Architectural rationale: Beads/root state, committed code, and remote CI should
line up before the next implementation slice.

Evidence source: completed Beads and local verification.

Official/external sources: none required for this cleanup slice.

Inputs required: current git diff and Beads state.

Files likely touched: root active state only unless verification exposes a
blocking issue.

Allowed writes: compact root state, commit, push.

Forbidden writes: broad historical report rewrites, dashboard/API/MCP, worker
daemon, runtime DB schema, package deletion, or broad rewrite.

Output requirements: pushed cleanup commit and CI/run status.

Definition of Done: commit exists on origin and next task is selected from
Beads.

Verification commands: `pnpm typecheck`, `pnpm test`, `pnpm quality:fallow:ci`,
`pnpm eval:krn:smoke`, and `git diff --check` unless a command is explicitly
deferred with reason.

Acceptance criteria: remote branch contains the cleanup wave.

Risk: broad workspace verification may expose integration fallout from the
cleanup wave.

Rollback: revert the checkpoint commit only if verification exposes a real
regression.

Condensation expectation: preserve this task state and archive path only.

Next-task synthesis rule: choose the highest-ROI cleanup that removes
non-executing surface or improves product behavior; do not add another ledger.

## 9. Task Contract Schema

Every new task appended to `Active Task Queue` or `Generated Task Backlog` must use this schema.
If a task cannot satisfy the schema, it is not ready for execution.

ID:
Name:
Status:
Goal:
Product rationale:
Architectural rationale:
Evidence source:
Official/external sources:
Inputs required:
Files likely touched:
Allowed writes:
Forbidden writes:
Output requirements:
Definition of Done:
Verification commands:
Acceptance criteria:
Risk:
Rollback:
Condensation expectation:
Next-task synthesis rule:

## 13. Generated Task Backlog

Template:

### <ID> — <Name>

Status:
Goal:
Product rationale:
Architectural rationale:
Evidence source:
Official/external sources:
Inputs required:
Files likely touched:
Allowed writes:
Forbidden writes:
Output requirements:
Definition of Done:
Verification commands:
Acceptance criteria:
Risk:
Rollback:
Condensation expectation:
Next-task synthesis rule:
Pattern surface:
Primary consumer:
Does not prove:
Falsifier:

```txt
Use Beads for durable task tracking. Do not grow root PLANS.md with generated
backlog detail.
```

## 15. Progress

```txt
Active slice: root ledger cap and active doc surface reduction.
Historical IMR/product outcomes: archived, not embedded in root context.
Next selection: use Beads ready work after this slice verifies.
```

## 21. Final Response Format For Codex Runs

Every continuation or completed slice must end with:

```txt
Active stream:
Current task:
Stale objective handling:
DB used:
Changed:
Commands run:
Reports/artifacts:
Commits/CI:
What this proves:
What this does not prove:
Condensation decisions:
Tasks appended to PLANS.md:
Next active task:
Blocked/budget-limited:
```

## 22. Compact GOAL.md Contract To Pair With This Plan

Active stream: <current active stream from PLAN.md>.
Current task: <current task from PLAN.md>.

For every non-trivial infra, harness, CI, eval, Codex-surface, TypeScript,
target-workflow, security, operator-UX, or research/paper/course-driven slice:

```txt
source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier
```

If a pasted objective, attachment, old prompt, or conversation summary names a
stale stream, read them as historical evidence.
If that happens, do not roll the active stream backward.

## 23. Plan Revision Note

At creation time this compact ledger archived the completed root outcome
history and preserved only active state, task contract requirements, and final
response requirements. It is historical guidance, not a second roadmap.
