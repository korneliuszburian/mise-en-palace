# V288 Brain Knowledge External Pattern Usefulness Dogfood

Status: complete.

## Executive Verdict

The three external Codex workflow cards were useful in this continuation. The
strongest proof is that the pasted objective still named an old `V05` stream,
while the current root `GOAL.md`, `PLAN.md`, and `PLANS.md` named `V288`. The
goal-continuation and ExecPlan cards reinforced the correct decision: treat the
attachment as historical evidence and continue from current root active state.

This proves the retained external patterns can reduce stale-plan drift and
support task-contract discipline. It does not prove automatic application,
semantic ranking, or product readiness.

## Cards Queried

| Query | Result | Usefulness |
|---|---|---|
| `goal continuation` | `pattern:codex-goal-continuation-evidence-contract` | helped |
| `living validation loop` | `pattern:codex-execplan-living-validation-loop` | helped |
| `task contract proof boundary` | `pattern:codex-prompt-task-contract-proof-boundary` | helped |

All three readbacks were `access: read_only` and `mutation: none`.

## What The Cards Changed

### Goal Continuation Evidence Contract

Outcome: helped.

The continuation objective pointed at:

```txt
V05 — Target-Aware Evidence Capture Repair
```

Current root state pointed at:

```txt
V288 Brain Knowledge External Pattern Usefulness Dogfood
```

The retained goal card supported the decision to keep root `GOAL.md`, `PLAN.md`,
and `PLANS.md` authoritative and treat the pasted objective as stale historical
evidence. This directly prevented active-stream rollback.

### ExecPlan Living Validation Loop

Outcome: helped.

The retained ExecPlan card supported using `PLANS.md` for detailed current
state and next-task synthesis instead of rereading historical ledgers or
following stale conversation state. This reduced resume ambiguity and kept V288
bounded as a usefulness dogfood rather than another intake batch.

### Prompt Task Contract Proof Boundary

Outcome: helped.

The retained task-contract card shaped the next action: V288 had to record
proof/non-proof, usefulness outcome, non-goals, and next task instead of merely
saying that the cards exist. It also constrained the next slice to usefulness
measurement before more source intake.

## Source Usefulness Feedback

```yaml
- source_id: pattern:codex-goal-continuation-evidence-contract
  outcome: helped
  reason: prevented stale pasted V05 objective from rolling active stream backward from V288
  evidence_refs:
    - /home/krn/.codex/attachments/7e4336bf-875e-413a-8fa4-489f4f11133a/pasted-text-1.txt
    - GOAL.md#current-objective
    - PLAN.md#current-product-state
    - PLANS.md#current-state
  does_not_prove: automatic resume correctness or product readiness

- source_id: pattern:codex-execplan-living-validation-loop
  outcome: helped
  reason: routed continuation through compact root state plus PLANS.md outcome history instead of broad historical reread
  evidence_refs:
    - PLANS.md#current-state
    - PLANS.md#outcome-v287-00-brain-knowledge-external-pattern-intake-trial
  does_not_prove: PLANS.md is always compact enough or that every old decision remains current

- source_id: pattern:codex-prompt-task-contract-proof-boundary
  outcome: helped
  reason: forced V288 to record proof/non-proof and usefulness feedback before adding more external sources
  evidence_refs:
    - docs/reviews/controlled-dogfood/2026-06-28-v288-brain-knowledge-external-pattern-usefulness-dogfood/REPORT.md
    - PLAN.md#active-stream
  does_not_prove: future task prompts will be high quality by default
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git fetch --prune && git status --short --branch && git log --oneline -n 8` | passed | Local worktree started clean and current with `origin/main` before V288 edits. | Does not prove product readiness. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "goal continuation" --json` | passed | The goal continuation card is searchable and read-only. | Does not prove live DB state or automatic application. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "living validation loop" --json` | passed | The ExecPlan card is searchable and read-only. | Does not prove ranking quality. |
| `pnpm --filter @krn/cli krn knowledge cards --catalog-file docs/brain-knowledge/catalog.json --text "task contract proof boundary" --json` | passed | The task-contract card is searchable and read-only. | Does not prove all future task contracts are good. |

## What This Proves

- Retained external Codex workflow cards can help a real continuation decision.
- The goal-continuation card prevented stale active-state rollback in this run.
- The ExecPlan card reduced resume ambiguity.
- The task-contract card improved proof/non-proof discipline for this dogfood.

## What This Does Not Prove

- Product readiness.
- Semantic search or ranking quality.
- Automatic selection/application by Codex.
- Completeness of the external pattern catalog.
- That future source intake should continue before usefulness feedback loops are
  retained.

## Next Recommended Action

Open V289: Brain Knowledge Pattern Usefulness Feedback Readback.

The next gap is that usefulness feedback exists in this report, but the brain
knowledge readback surface does not expose per-pattern usefulness outcomes. Add
the smallest read-only artifact or guard that can show:

```txt
pattern id -> latest usefulness outcome -> evidence refs -> does-not-prove
```

Do not mutate Memory Core, add DB schema, build API/MCP/dashboard, or add more
external sources in V289.
