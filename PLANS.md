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
current task: graph relation consensus decision-closure loop after store-backed SBV reuse proof
latest pushed commit: see git history
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

Known current gap:

```txt
graph relation consensus decision-closure loop after store-backed SBV reuse proof.
`mise-en-palace-b18l` is closed. `mise-en-palace-1c5x` proved store-backed
MemoryRecord reuse after fixing run project lineage for memory candidates.
Retained-pattern catalog selection still returned `rejected_or_deferred`, so it
is not proof of catalog recall. Next queue item: `mise-en-palace-royf`.
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

- Source: Claude Code headless and CLI reference docs.
- Mechanism: non-interactive `--print`, JSON output, bare mode, budget caps,
  turn caps, and resumable sessions support bounded model review without
  granting edit authority.
- KRN implication: larger completed slices can receive independent challenge
  through compact context packs instead of pasted audit prompts or a broad
  multi-agent runtime.
- Decision: add a repo-local `second-opinion-claude` operational skill and
  wrapper scripts.
- Does not prove: Claude is correct, CI passed, product readiness, or that
  review loops should run without budget control.
- Consumer: `.agents/skills/second-opinion-claude/SKILL.md`, root handoffs, and
  larger migration/audit-hardening slice closure.
- Falsifier: the workflow burns budget without actionable findings, encourages
  broad rewrites, or replaces local verification.

## Active Task

### First End-To-End Shared Brain Vertical Loop Proof

Status: complete

Goal: run one real operator task through KRN, promote or reject the produced
knowledge, then run a second related task that reuses or explicitly rejects it.

Product rationale: reuse-or-reject on a second task is the first meaningful
proof that KRN is more than Codex running twice.

Architectural rationale: product truth now comes from the typed loop and
evidence/review feedback, not another cleanup audit.

Evidence source: closed Bead `mise-en-palace-pvtf`, root GOAL direction, and
Claude second-opinion priority synthesis.

Official/external sources: none required beyond existing KRN loop sources.

Inputs required: a real operator task, a second related task, and captured
evidence/review output.

Files likely touched: task-dependent implementation, evidence/review surfaces,
and compact run report only if it records proof/non-proof.

Allowed writes: bounded implementation, evidence/review artifacts, Beads/root
state, and focused tests required by the task.

Forbidden writes: broad historical report rewrites, dashboard/API/MCP, worker
daemon, global audit, benchmark platform, or broad review automation.

Output requirements: two related task runs with reuse-or-reject evidence and
clear proof/non-proof.

Definition of Done: the second related task either uses the promoted knowledge
or explicitly rejects it with a recorded reason.

Verification commands: task-specific focused tests, relevant KRN readback
commands, `git diff --check`, and second-opinion-claude if the slice is large.

Acceptance criteria: one real task produces reviewable knowledge, and a second
related task either reuses that knowledge or rejects it with a recorded reason.

Risk: without the second related task, the run proves only execution, not a
closed brain loop.

Rollback: revert the checkpoint commit only if verification exposes a real
regression.

Condensation expectation: preserve proof/non-proof boundary only.

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
