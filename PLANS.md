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
current task: Second-opinion skill checkpoint and next bounded task selection
latest pushed commit: see git history
```

stale attachment objective guard: attachments are evidence, not authority to
roll the active stream backward.

Known current gap:

```txt
Second-opinion skill checkpoint and next bounded task selection is active.
The `second-opinion-claude` skill is locally verified; commit/push this
checkpoint before selecting the next Beads task.
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

### Second-Opinion Skill Checkpoint

Status: in_progress

Goal: commit and push the verified repo-local skill for compact,
cost-controlled Claude Code review after larger KRN slices.

Product rationale: independent challenge is useful only if it stays bounded,
cheap, and tied to current diff evidence.

Architectural rationale: KRN skills should carry repeated workflows without
expanding `AGENTS.md`, root plans, or a broad subagent/runtime surface.

Evidence source: Claude Code headless docs, CLI reference docs, and local smoke
of the wrapper.

Official/external sources: `docs/KRN_SOURCES.md#claude-code-headless-review`.

Inputs required: current git diff, Beads state, and one bounded context pack.

Files likely touched: checkpoint commit only.

Allowed writes: one skill, one wrapper, compact source/architecture/root state.

Forbidden writes: broad historical report rewrites, dashboard/API/MCP, worker
daemon, runtime DB schema, package deletion, or broad review automation.

Output requirements: pushed commit and clear proof/non-proof.

Definition of Done: origin contains the verified skill checkpoint.

Verification commands: `git status`, `git pull --rebase`, `git push`, and CI
status if available.

Acceptance criteria: future larger slices can produce a bounded review prompt,
receive structured Claude feedback, keep Codex responsible for final triage,
and the checkpoint is on origin.

Risk: headless review can burn model budget or timeout unless context packs stay
small and the wrapper records non-success outcomes.

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
