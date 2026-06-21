---
name: evidence-review-loop
description: Use when capturing KRN execution evidence, assessing review risk, deriving feedback deltas, or proposing memory, source, skill, policy, or eval candidates after a run.
---

# Evidence Review Loop

Use this skill after or around execution, when proof must become reviewable
state without mutating memory automatically.

## Trigger

- Capturing changed files, command results, typecheck/test status, diff risk,
  review burden, rollback path, or feedback candidates.
- Turning review findings into memory/source/skill/policy/eval candidates.

## Workflow

1. Record changed files and scope.
2. Record each command with status: passed, failed, or skipped.
3. State diff risk and review burden.
4. State rollback path.
5. Separate hard evidence from interpretation.
6. Create feedback candidates; do not apply them automatically.
7. Append run/outbox evidence only when persistence is configured.

## Output

- Evidence summary.
- Command proof.
- Diff risk.
- Review burden.
- Rollback path.
- Feedback candidates.
- Persistence status.

## Forbidden

- Do not claim skipped commands passed.
- Do not mutate Memory Core without explicit acceptance.
- Do not invent execution runs when DB/run IDs are absent.
- Do not promote eval/source/memory candidates as a side effect of capture.

## Verification

Evidence must let a reviewer see what changed, what was actually run, what risk
remains, and how to roll back.
