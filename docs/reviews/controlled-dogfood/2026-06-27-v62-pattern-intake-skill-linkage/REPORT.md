# V62 Wire Pattern Intake Runbook Into Source-To-Decision Skill

Status: complete.

Date: 2026-06-27.

## Executive Verdict

The source-to-decision skill now points to the pattern intake runbook for
multi-source, course, paper, practitioner-pattern, and operator-facing intake.

Change:

```txt
.agents/skills/source-to-decision/SKILL.md
```

The update is intentionally small. The skill remains the trigger/gate. The
runbook owns the fuller workflow.

## What Changed

Added a compact pointer:

```txt
For multi-source, course, paper, practitioner-pattern, or operator-facing
intake, use docs/runbooks/pattern-intake.md as the fuller procedure. Keep this
skill as the trigger/gate; keep the runbook as the workflow.
```

## Source-To-Decision Mapping

```yaml
source_id: v62-pattern-intake-skill-linkage
title: Wire Pattern Intake Runbook Into Source-To-Decision Skill
url_or_ref: docs/reviews/controlled-dogfood/2026-06-27-v61-post-pattern-intake-regate/REPORT.md
trust_tier: high
source_class: repo-local evidence
mechanism: V58 created the runbook, but the skill that triggers source-to-decision work did not point to it.
krn_implication: Future source work should discover the fuller operator workflow through progressive disclosure.
decision_kind: adopt
decision: Add a compact runbook pointer to the skill.
consumer: .agents/skills/source-to-decision/SKILL.md
falsifier: The skill becomes bloated, duplicates the runbook, or future source-intake tasks still miss the runbook when it applies.
does_not_prove: Future source intake quality, product readiness, or that all best sources are known.
candidate_output:
  type: none
  reviewability: ready
next_action: Re-gate after pattern-intake linkage.
```

## Rejected Alternatives

| Alternative | Decision | Reason |
|---|---|---|
| Copy the runbook into the skill | reject | Would bloat the skill and violate progressive disclosure. |
| Add more examples to the skill | reject | Examples belong in the runbook. |
| Add new source material | reject | V62 is linkage only. |
| Package source change | reject | No source behavior gap is selected. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `git diff --check` | passed | Checks whitespace for docs/skill changes. | Skill usefulness at runtime. |
| `git status --short --branch` | expected docs/plan/skill changes only | Shows local worktree state before commit. | CI success. |

## Next Recommended Task

Promote:

```txt
V63 — Post Pattern-Intake Linkage Re-Gate
```

Goal:

Decide whether internal KRN work should continue or whether current progress
should pause on external operator/owner blockers.

## What This Proves

- The runbook is discoverable from the skill that triggers source-to-decision
  work.
- Pattern intake remains progressive-disclosure based.

## What This Does Not Prove

- Product readiness.
- V02-01.
- Future source intake quality.
- That every Codex run will choose the skill/runbook correctly.
