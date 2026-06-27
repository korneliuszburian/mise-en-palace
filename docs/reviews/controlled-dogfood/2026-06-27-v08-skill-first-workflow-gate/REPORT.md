# V08 Skill-First Workflow Expansion Gate

Status: V08 completion gate.

Date: 2026-06-27

## Executive Verdict

V08 accepts one bounded skill refinement and rejects a new skill, hook, MCP
server, subagent, or AGENTS.md expansion for now.

The repeated workflow is not a new domain workflow. It is continuation after
auto-compaction or pause inside the continuous `PLANS.md` goal. The existing
`handoff-compact` skill already owned this surface, so the smallest durable
repair was to refine that skill with active stream/task and verified
commit/push/CI state.

## Inputs

| Input | Verdict | Evidence |
|---|---|---|
| Existing skill surface | reusable | `.agents/skills/handoff-compact/SKILL.md` |
| Current continuation contract | useful but outside skill | `GOAL.md` continuation section |
| V07 re-gate | accepts V08 | `docs/reviews/controlled-dogfood/2026-06-27-v07-memory-source-re-gate/REPORT.md` |
| V04 compression screen | prefer skills before heavier surfaces | `docs/reviews/controlled-dogfood/2026-06-27-v04-compression-screening/REPORT.md` |
| Current plan state at gate start | V08 active | `PLAN.md`, `PLANS.md` |

## Source To Decision

```yaml
source_id: codex-skill-creator
title: Codex Skill Creator local skill guidance
trust_tier: high
mechanism: Skills should be concise, update an existing skill when possible, and keep trigger-critical information in the frontmatter description.
krn_implication: V08 should refine the existing handoff skill instead of creating a new continuation skill.
decision: update `.agents/skills/handoff-compact/SKILL.md`.
consumer: handoff compact workflow for continuous KRN goals.
falsifier: future compaction handoffs still omit active stream/task or verified commit/push/CI state.
does_not_prove: all future skills will trigger correctly.
```

```yaml
source_id: v04-compression-screening
title: V04 Compression, Surface Screening, And Internal Utility Metrics
trust_tier: high local
mechanism: Repeated workflows should move to small repo skills before hooks, MCP, subagents, or AGENTS.md bloat.
krn_implication: Continuation state belongs in a bounded skill plus compact GOAL/PLAN/PLANS, not in a new automation layer.
decision: reject hook/MCP/subagent work in V08.
consumer: V08 surface decision.
falsifier: repeated resume failures cannot be fixed by the handoff skill and need deterministic lifecycle enforcement.
does_not_prove: hooks/MCP/subagents are never useful.
```

## Decision

Accepted:

- refine existing `handoff-compact`;
- include active stream/task and commit/push/CI state in the handoff output;
- keep output small and forbid completed backlog dumps.

Rejected now:

- new `continuous-goal` skill;
- AGENTS.md expansion;
- compact recovery hook;
- KRN MCP surface;
- subagent workflow.

Reason:

```txt
The repeated problem is context loss during long-running KRN goals. Existing
handoff-compact is the owning surface. Updating it reduces future rereads
without creating another product brain.
```

## What Changed

- `handoff-compact` frontmatter now triggers for active `PLANS.md` stream/task,
  verified commit/push/CI state, auto-compaction, resume, pause, or transfer.
- Workflow now requires active stream/task and last verified commit/push/CI/DB
  worktree state.
- Output now includes `Active stream/task` and `Commit/push/CI`.
- Forbidden section now rejects completed backlog dumps unless they affect the
  next action.

## What This Proves

- V08 can improve a repeated KRN/Codex workflow through one existing skill.
- The project can keep `AGENTS.md` compact while preserving continuation
  quality.
- Skill-first expansion can be bounded rather than becoming skill sprawl.

## What This Does Not Prove

- Product readiness.
- V02-01 second-operator usability.
- That hooks, MCP, or subagents are never needed.
- That future Codex sessions will always trigger the skill automatically.
- That handoff compactness is perfect forever.

## Condensation Decision

```txt
finding: continuous KRN goals need compact resume state after auto-compaction.
frequency: repeated/high-risk for long-running goal execution.
candidate_surface: skill
decision: accept existing-skill refinement.
rationale: current handoff skill is small and owns this workflow; a new skill
  would duplicate it.
evidence: GOAL.md continuation rules; PLANS.md continuous execution protocol;
  V04 compression screening; V07 re-gate.
does_not_prove: need for hook/MCP/subagent implementation.
falsifier: future compact/resume failures persist despite handoff skill usage.
next_task_id: V09-00.
```

## Next Recommended Stream

Move to:

```txt
V09 — Deterministic Hooks Candidate Decision
```

Do not implement a hook by default. The first V09 task should screen whether any
repeated deterministic violation survived V05-V08. If not, reject/defer hooks
with evidence and move toward MCP/subagent candidate screening.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `sed -n '1,220p' .agents/skills/handoff-compact/SKILL.md` | passed | Existing handoff skill was inspected before editing. | Does not prove future trigger quality. |
| `rg -n "compact\|compaction\|resume\|handoff\|skill" ...` | passed | Repeated continuation and skill references exist across active plans/reports. | Does not prove a new skill is needed. |
| `python /home/krn/.codex/skills/.system/skill-creator/scripts/quick_validate.py .agents/skills/handoff-compact` | failed: missing local `yaml` module | The bundled validator was attempted. | Does not prove the skill is invalid. |
| `node -e <frontmatter sanity check>` | passed | `handoff-compact` frontmatter has the expected name and trigger text. | Does not replace full bundled validator coverage. |
| `git diff --check` | passed | Diff whitespace is clean. | Does not prove semantic correctness. |
